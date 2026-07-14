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
  pricePerHour: number;
  surface: string;
};

export const courts: Court[] = [
  {
    id: "padel-1",
    name: "بادل — الملعب الرئيسي",
    sport: "padel",
    sportLabel: "بادل",
    image: courtPadel,
    pricePerHour: 150,
    surface: "عشب صناعي أزرق",
  },
  {
    id: "football-a",
    name: "كرة القدم — الملعب أ",
    sport: "football",
    sportLabel: "كرة القدم",
    image: courtFootball,
    pricePerHour: 350,
    surface: "عشب طبيعي",
  },
  {
    id: "tennis-1",
    name: "التنس — كورت رقم ١",
    sport: "tennis",
    sportLabel: "تنس",
    image: courtTennis,
    pricePerHour: 200,
    surface: "طيني",
  },
  {
    id: "basket-1",
    name: "السلة — الصالة المغطاة",
    sport: "basket",
    sportLabel: "سلة",
    image: courtBasket,
    pricePerHour: 180,
    surface: "خشب مصقول",
  },
];

export type BookingStatus = "confirmed" | "pending" | "training" | "maintenance";

export type Booking = {
  id: string;
  courtId: string;
  customer: string;
  phone: string;
  start: string; // "HH:MM"
  end: string;   // "HH:MM"
  status: BookingStatus;
  price: number;
};

export const todaysBookings: Booking[] = [
  { id: "b1", courtId: "padel-1", customer: "أحمد العتيبي", phone: "0551234567", start: "10:00", end: "11:30", status: "confirmed", price: 225 },
  { id: "b2", courtId: "football-a", customer: "فريق الأساطير", phone: "0559988776", start: "11:00", end: "12:30", status: "confirmed", price: 525 },
  { id: "b3", courtId: "padel-1", customer: "سارة المنصور", phone: "0553344556", start: "13:00", end: "14:00", status: "pending", price: 150 },
  { id: "b4", courtId: "tennis-1", customer: "خالد الشمري", phone: "0557788990", start: "14:00", end: "15:30", status: "confirmed", price: 300 },
  { id: "b5", courtId: "basket-1", customer: "المدرب مارك — تدريب خاص", phone: "0552211334", start: "16:00", end: "17:00", status: "training", price: 180 },
  { id: "b6", courtId: "football-a", customer: "صيانة دورية", phone: "—", start: "18:00", end: "19:00", status: "maintenance", price: 0 },
  { id: "b7", courtId: "padel-1", customer: "فهد العبدالله", phone: "0554455667", start: "20:00", end: "21:30", status: "confirmed", price: 225 },
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
  }
}

export function courtById(id: string) {
  return courts.find((c) => c.id === id);
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

/** Deterministic Arabic gregorian formatter (SSR-safe, no ICU). */
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

export function todayLabel() {
  return formatDate(new Date(), { weekday: "long", day: true, month: true });
}

export function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "صباح الخير";
  if (h < 18) return "مساء الخير";
  return "مساء الخير";
}

/** Convert "HH:MM" to fractional hour */
export function toHour(t: string) {
  const [h, m] = t.split(":").map(Number);
  return h + m / 60;
}
