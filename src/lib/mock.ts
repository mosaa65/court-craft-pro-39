// Shared types, helpers, and image map. NO hardcoded booking/court data — data lives in the database.

import courtPadel from "@/assets/court-padel.jpg";
import courtFootball from "@/assets/court-football.jpg";
import courtBasket from "@/assets/court-basket.jpg";
import courtTennis from "@/assets/court-tennis.jpg";

export type Sport = "padel" | "football" | "tennis" | "basket";

export type Court = {
  id: string;
  name: string;
  sport: Sport;
  sportLabel: string;
  image: string;
  imageUrl: string | null;
  pricePerHour: number;
  surface: string;
  imageKey: string;
};

export type BookingStatus =
  | "confirmed"
  | "pending"
  | "training"
  | "maintenance"
  | "cancelled";

export type Booking = {
  id: string;
  courtId: string;
  customer: string;
  phone: string;
  start: string; // "HH:MM" 24h
  end: string;   // "HH:MM" 24h
  startAt: string; // ISO
  endAt: string;   // ISO
  status: BookingStatus;
  price: number;
  notes: string;
  recurrenceGroupId: string | null;
};

export type Customer = {
  id: string;
  name: string;
  phone: string;
  notes: string;
  createdAt: string;
};

export const SPORT_IMAGES: Record<string, string> = {
  padel: courtPadel,
  football: courtFootball,
  tennis: courtTennis,
  basket: courtBasket,
};

export const SPORT_OPTIONS: { value: Sport; label: string; imageKey: string }[] = [
  { value: "padel", label: "بادل", imageKey: "padel" },
  { value: "football", label: "قدم", imageKey: "football" },
  { value: "tennis", label: "تنس", imageKey: "tennis" },
  { value: "basket", label: "سلة", imageKey: "basket" },
];

export const HOURS = Array.from({ length: 14 }, (_, i) => 9 + i); // 09..22

export function statusMeta(status: BookingStatus) {
  switch (status) {
    case "confirmed":
      return { label: "مؤكد", tone: "bg-primary/10 text-primary" };
    case "pending":
      return { label: "بانتظار الدفع", tone: "bg-[color:var(--color-warn)]/15 text-[color:oklch(0.55_0.15_70)]" };
    case "training":
      return { label: "تدريب", tone: "bg-ink text-white" };
    case "maintenance":
      return { label: "صيانة", tone: "bg-muted text-muted-foreground" };
    case "cancelled":
      return { label: "ملغى", tone: "bg-destructive/10 text-destructive" };
  }
}

const AR_WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const AR_WEEKDAYS_SHORT = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];
const AR_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export function toArabicDigits(input: number | string) {
  return String(input).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

export function formatDate(
  d: Date,
  parts: { weekday?: "long" | "short"; day?: boolean; month?: boolean; year?: boolean } = {
    weekday: "long",
    day: true,
    month: true,
  },
) {
  const out: string[] = [];
  if (parts.weekday === "long") out.push(AR_WEEKDAYS[d.getDay()]);
  else if (parts.weekday === "short") out.push(AR_WEEKDAYS_SHORT[d.getDay()]);
  const dateBit: string[] = [];
  if (parts.day) dateBit.push(toArabicDigits(d.getDate()));
  if (parts.month) dateBit.push(AR_MONTHS[d.getMonth()]);
  if (parts.year) dateBit.push(toArabicDigits(d.getFullYear()));
  if (dateBit.length) out.push(dateBit.join(" "));
  return out.join("، ");
}

export function greeting(now: Date = new Date()) {
  const h = now.getHours();
  if (h < 12) return "صباح الخير";
  return "مساء الخير";
}

export function todayLabel(now: Date = new Date()) {
  return formatDate(now, { weekday: "long", day: true, month: true });
}

export function toHour(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
}

/** Extract HH:MM (local time, 24h) from ISO timestamp. */
export function hhmm(iso: string) {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/** Convert "HH:MM" 24h to 12h Arabic label e.g. "٧:٠٠ ص" / "١٠:٣٠ م". */
export function formatTime12(hhmmStr: string) {
  const [hRaw, mRaw] = hhmmStr.split(":").map(Number);
  const isAm = hRaw < 12;
  const h12 = hRaw % 12 === 0 ? 12 : hRaw % 12;
  const suffix = isAm ? "ص" : "م";
  return `${toArabicDigits(h12)}:${toArabicDigits(String(mRaw).padStart(2, "0"))} ${suffix}`;
}

export function formatTimeRange12(startHHMM: string, endHHMM: string) {
  return `${formatTime12(startHHMM)} — ${formatTime12(endHHMM)}`;
}

/** Duration in minutes between two ISO timestamps. */
export function durationMinutes(startIso: string, endIso: string) {
  return Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000);
}

export function formatDuration(mins: number) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h && m) return `${toArabicDigits(h)} س ${toArabicDigits(m)} د`;
  if (h) return `${toArabicDigits(h)} ساعة`;
  return `${toArabicDigits(m)} دقيقة`;
}
