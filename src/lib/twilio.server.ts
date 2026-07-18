/**
 * Twilio helpers — server-only (filename-protected).
 * Sends via Lovable Connector Gateway.
 */

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

export type TwilioChannel = "whatsapp" | "sms";

export function normalizeE164(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, "").replace(/-/g, "");
  if (/^\+[1-9]\d{7,14}$/.test(trimmed)) return trimmed;
  if (/^05\d{8}$/.test(trimmed)) return `+966${trimmed.slice(1)}`;
  if (/^5\d{8}$/.test(trimmed)) return `+966${trimmed}`;
  return null;
}

function extractTwilioError(body: string): string {
  try {
    const j = JSON.parse(body);
    return j.message || j.detail || body.slice(0, 200);
  } catch {
    return body.slice(0, 200);
  }
}

export type TwilioSendResult =
  | { ok: true; channel: TwilioChannel; to: string }
  | { ok: false; error: string; code?: string };

export async function sendTwilioMessage(opts: {
  to: string;
  channel: TwilioChannel;
  body: string;
}): Promise<TwilioSendResult> {
  const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
  const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
  const FROM_SMS = process.env.TWILIO_FROM_SMS;
  const FROM_WA = process.env.TWILIO_WHATSAPP_FROM;

  if (!LOVABLE_API_KEY || !TWILIO_API_KEY) {
    return { ok: false, error: "قناة الإرسال غير مربوطة (Twilio).", code: "NO_CONNECTOR" };
  }
  if (opts.channel === "sms" && !FROM_SMS) {
    return { ok: false, error: "لم يتم ضبط TWILIO_FROM_SMS.", code: "NO_FROM_SMS" };
  }
  if (opts.channel === "whatsapp" && !FROM_WA) {
    return { ok: false, error: "لم يتم ضبط TWILIO_WHATSAPP_FROM.", code: "NO_FROM_WA" };
  }

  const phone = normalizeE164(opts.to);
  if (!phone) return { ok: false, error: "رقم الجوال غير صحيح", code: "BAD_PHONE" };

  const To = opts.channel === "whatsapp" ? `whatsapp:${phone}` : phone;
  const From = opts.channel === "whatsapp" ? `whatsapp:${FROM_WA}` : FROM_SMS!;

  try {
    const res = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To, From, Body: opts.body }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error(`[twilio] send failed [${res.status}]:`, t);
      return { ok: false, error: `فشل الإرسال (${res.status}): ${extractTwilioError(t)}` };
    }
    return { ok: true, channel: opts.channel, to: phone };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[twilio] network error:", msg);
    return { ok: false, error: msg };
  }
}

/** Try WhatsApp first; fall back to SMS if WhatsApp fails or is unavailable. */
export async function sendTwilioAuto(opts: {
  to: string;
  body: string;
}): Promise<TwilioSendResult> {
  const wa = await sendTwilioMessage({ ...opts, channel: "whatsapp" });
  if (wa.ok) return wa;
  const sms = await sendTwilioMessage({ ...opts, channel: "sms" });
  return sms.ok ? sms : wa; // return whichever error is more meaningful
}

export function renderBookingConfirmation(opts: {
  customer: string;
  courtName: string;
  startAt: string;
  endAt: string;
  price: number;
}) {
  const s = new Date(opts.startAt);
  const e = new Date(opts.endAt);
  const fmtDate = new Intl.DateTimeFormat("ar-SA", { year: "numeric", month: "long", day: "numeric" }).format(s);
  const fmtTime = (d: Date) =>
    new Intl.DateTimeFormat("ar-SA", { hour: "numeric", minute: "2-digit", hour12: true }).format(d);
  return [
    `مرحباً ${opts.customer} 👋`,
    ``,
    `تم تأكيد حجزك ✅`,
    `• الملعب: ${opts.courtName}`,
    `• التاريخ: ${fmtDate}`,
    `• الوقت: ${fmtTime(s)} — ${fmtTime(e)}`,
    `• المبلغ: ${opts.price.toLocaleString("ar-SA")} ر.س`,
    ``,
    `بانتظارك — لأي استفسار تواصل معنا 🌟`,
  ].join("\n");
}
