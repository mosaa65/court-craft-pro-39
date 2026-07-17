import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { serverClient } from "./bookings.server";

/** ---------- MARK PAID / UNPAID ---------- */

const MarkPaidInput = z.object({
  id: z.string().uuid(),
  method: z.enum(["cash", "transfer", "card", "other"]),
  note: z.string().max(280).optional().default(""),
});

export const markPaidFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => MarkPaidInput.parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: row, error } = await sb
      .from("bookings")
      .update({
        status: "confirmed",
        paid_at: new Date().toISOString(),
        payment_method: data.method,
        payment_note: data.note ?? "",
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await sb.from("notifications").insert({
      kind: "payment_received",
      title: "تم استلام الدفع",
      body: `${row.customer_name} — ${Number(row.price).toLocaleString("ar-SA")} ر.س (${methodLabel(data.method)})`,
      booking_id: row.id,
    });
    return row;
  });

export const markUnpaidFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: row, error } = await sb
      .from("bookings")
      .update({
        status: "pending",
        paid_at: null,
        payment_method: null,
        payment_note: "",
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

function methodLabel(m: string) {
  return m === "cash" ? "نقداً" : m === "transfer" ? "تحويل" : m === "card" ? "بطاقة" : "أخرى";
}

/** ---------- SEND INVOICE (Twilio via Connector Gateway) ---------- */

const SendInvoiceInput = z.object({
  id: z.string().uuid(),
  channel: z.enum(["whatsapp", "sms"]),
});

const GATEWAY_URL = "https://connector-gateway.lovable.dev/twilio";

export const sendInvoiceFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => SendInvoiceInput.parse(d))
  .handler(async ({ data }) => {
    const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;
    const TWILIO_API_KEY = process.env.TWILIO_API_KEY;
    const FROM_SMS = process.env.TWILIO_FROM_SMS;
    const FROM_WA = process.env.TWILIO_WHATSAPP_FROM;

    if (!LOVABLE_API_KEY || !TWILIO_API_KEY) {
      throw new Error("قناة الإرسال غير مكتملة (Twilio). يرجى ربط الحساب مجدداً.");
    }
    if (data.channel === "sms" && !FROM_SMS) {
      throw new Error("لم يتم ضبط رقم الإرسال (TWILIO_FROM_SMS). أضِفه في الإعدادات ثم أعد المحاولة.");
    }
    if (data.channel === "whatsapp" && !FROM_WA) {
      throw new Error("لم يتم ضبط رقم واتساب (TWILIO_WHATSAPP_FROM). أضِفه في الإعدادات ثم أعد المحاولة.");
    }

    const sb = serverClient();
    const { data: booking, error } = await sb
      .from("bookings")
      .select("*, courts(name)")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!booking) throw new Error("الحجز غير موجود");
    if (!booking.customer_phone) throw new Error("لا يوجد رقم جوال للعميل");

    const phone = normalizeE164(booking.customer_phone);
    if (!phone) throw new Error("رقم الجوال غير صحيح (يجب أن يبدأ بـ + ورمز الدولة)");

    const body = renderInvoiceMessage({
      customer: booking.customer_name,
      invoiceNo: `INV-${booking.id.slice(0, 8).toUpperCase()}`,
      courtName:
        (booking as unknown as { courts?: { name?: string } | null }).courts?.name ?? "—",
      startAt: booking.start_at,
      endAt: booking.end_at,
      price: Number(booking.price),
      paid: !!booking.paid_at,
    });

    const To = data.channel === "whatsapp" ? `whatsapp:${phone}` : phone;
    const From = data.channel === "whatsapp" ? `whatsapp:${FROM_WA}` : FROM_SMS!;

    const res = await fetch(`${GATEWAY_URL}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": TWILIO_API_KEY,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To, From, Body: body }),
    });

    if (!res.ok) {
      const t = await res.text();
      console.error(`Twilio send failed [${res.status}]:`, t);
      throw new Error(`فشل الإرسال (${res.status}): ${extractTwilioError(t)}`);
    }

    // Mark invoice sent
    await sb
      .from("bookings")
      .update({
        invoice_sent_at: new Date().toISOString(),
        invoice_channel: data.channel,
      })
      .eq("id", data.id);

    await sb.from("notifications").insert({
      kind: "invoice_sent",
      title: data.channel === "whatsapp" ? "تم إرسال الفاتورة عبر واتساب" : "تم إرسال الفاتورة عبر SMS",
      body: `${booking.customer_name} — ${phone}`,
      booking_id: booking.id,
    });

    return { ok: true };
  });

function renderInvoiceMessage(opts: {
  customer: string;
  invoiceNo: string;
  courtName: string;
  startAt: string;
  endAt: string;
  price: number;
  paid: boolean;
}) {
  const s = new Date(opts.startAt);
  const e = new Date(opts.endAt);
  const fmtDate = new Intl.DateTimeFormat("ar-SA", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(s);
  const fmtTime = (d: Date) =>
    new Intl.DateTimeFormat("ar-SA", { hour: "numeric", minute: "2-digit", hour12: true }).format(d);
  const priceAr = opts.price.toLocaleString("ar-SA");
  const state = opts.paid ? "✅ مدفوعة" : "⏳ بانتظار الدفع";

  return [
    `مرحباً ${opts.customer} 👋`,
    ``,
    `فاتورة حجزك:`,
    `• رقم الفاتورة: ${opts.invoiceNo}`,
    `• الملعب: ${opts.courtName}`,
    `• التاريخ: ${fmtDate}`,
    `• الوقت: ${fmtTime(s)} — ${fmtTime(e)}`,
    `• المبلغ: ${priceAr} ر.س`,
    `• الحالة: ${state}`,
    ``,
    `شكراً لتعاملك معنا 🌟`,
  ].join("\n");
}

function normalizeE164(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, "").replace(/-/g, "");
  if (/^\+[1-9]\d{7,14}$/.test(trimmed)) return trimmed;
  // Saudi shortcut: local 05xxxxxxxx -> +9665xxxxxxxx
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
