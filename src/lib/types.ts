// Real Estate Management System Types & Utilities

export type PropertyType = "building" | "villa" | "apartment_complex" | "commercial" | "land";
export type PropertyStatus = "active" | "inactive" | "under_maintenance";

export type UnitType = "apartment" | "room" | "shop" | "office" | "studio" | "floor" | "villa";
export type UnitStatus = "available" | "reserved" | "rented" | "under_maintenance" | "unavailable";
export type FurnishedType = "furnished" | "semi_furnished" | "unfurnished";

export type ContractStatus = "active" | "expired" | "terminated" | "cancelled" | "renewed";
export type PaymentCycle = "monthly" | "quarterly" | "semi_annual" | "annual" | "custom";
export type PaymentTiming = "advance" | "arrears";

export type DueStatus = "pending" | "paid" | "partially_paid" | "overdue";
export type PaymentMethod = "cash" | "transfer" | "card" | "cheque" | "other";

export type ExpenseCategory = "maintenance" | "electricity" | "water" | "cleaning" | "services" | "fees" | "other";
export type MaintenancePriority = "urgent" | "high" | "medium" | "low";
export type MaintenanceStatus = "new" | "in_progress" | "completed" | "cancelled";
export type UtilityType = "electricity" | "water";

export type Property = {
  id: string;
  name: string;
  type: PropertyType;
  description: string;
  city: string;
  district: string;
  location: string;
  floorsCount: number;
  totalArea: number;
  yearBuilt: number | null;
  amenities: string[];
  status: PropertyStatus;
  imageUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type Unit = {
  id: string;
  propertyId: string;
  unitNumber: string;
  type: UnitType;
  floor: number;
  area: number;
  rooms: number;
  bathrooms: number;
  furnished: FurnishedType;
  rentPrice: number;
  depositAmount: number;
  status: UnitStatus;
  createdAt: string;
  updatedAt: string;
  propertyName?: string;
};

export type Tenant = {
  id: string;
  name: string;
  phone: string;
  email: string;
  idNumber: string;
  idType: string;
  address: string;
  nationality: string;
  emergencyContact: string;
  emergencyPhone: string;
  notes: string;
  createdAt: string;
  updatedAt: string;
};

export type Contract = {
  id: string;
  contractNumber: string;
  tenantId: string;
  unitId: string;
  startDate: string;
  endDate: string;
  durationMonths: number;
  rentAmount: number;
  depositAmount: number;
  paymentCycle: PaymentCycle;
  paymentTiming: PaymentTiming;
  customMonths: number | null;
  status: ContractStatus;
  autoRenew: boolean;
  notes: string;
  createdAt: string;
  updatedAt: string;
  tenantName?: string;
  tenantPhone?: string;
  unitNumber?: string;
  propertyName?: string;
};

export type Due = {
  id: string;
  contractId: string;
  dueDate: string;
  amount: number;
  paidAmount: number;
  status: DueStatus;
  title: string;
  createdAt: string;
  updatedAt: string;
  tenantId?: string;
  tenantName?: string;
  tenantPhone?: string;
  unitNumber?: string;
  propertyId?: string;
  propertyName?: string;
  propertyImageUrl?: string | null;
};

export type Payment = {
  id: string;
  dueId: string | null;
  contractId: string;
  tenantId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: PaymentMethod;
  receiptNumber: string;
  notes: string;
  createdAt: string;
  tenantName?: string;
  dueTitle?: string;
};

export type Expense = {
  id: string;
  propertyId: string | null;
  unitId: string | null;
  category: ExpenseCategory;
  amount: number;
  description: string;
  expenseDate: string;
  vendor: string;
  receiptUrl: string | null;
  notes: string;
  createdAt: string;
  propertyName?: string;
  unitNumber?: string;
};

export type MaintenanceRequest = {
  id: string;
  propertyId: string;
  unitId: string;
  tenantId: string | null;
  title: string;
  description: string;
  category: string;
  priority: MaintenancePriority;
  status: MaintenanceStatus;
  cost: number;
  images: string[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  propertyName?: string;
  unitNumber?: string;
  tenantName?: string;
};

export type UtilityReading = {
  id: string;
  unitId: string;
  type: UtilityType;
  previousReading: number;
  currentReading: number;
  pricePerUnit: number;
  totalAmount: number;
  readingDate: string;
  billedToTenant: boolean;
  notes: string;
  createdAt: string;
  unitNumber?: string;
  propertyName?: string;
};

export type Notification = {
  id: string;
  kind: string;
  title: string;
  body: string;
  contractId: string | null;
  dueId: string | null;
  tenantId: string | null;
  read: boolean;
  createdAt: string;
};

// Helper Functions & Labels
export function propertyTypeLabel(t: PropertyType): string {
  switch (t) {
    case "building": return "عمارة / مجمع";
    case "villa": return "فيلا";
    case "apartment_complex": return "مجمع شقق";
    case "commercial": return "عقار تجاري";
    case "land": return "أرض";
    default: return t;
  }
}

export function unitTypeLabel(t: UnitType): string {
  switch (t) {
    case "apartment": return "شقة";
    case "room": return "غرفة";
    case "shop": return "محل تجاري";
    case "office": return "مكتب";
    case "studio": return "استوديو";
    case "floor": return "دور كامل";
    case "villa": return "فيلا";
    default: return t;
  }
}

export function unitStatusMeta(s: UnitStatus) {
  switch (s) {
    case "available":
      return { label: "متاحة", tone: "bg-primary/10 text-primary" };
    case "reserved":
      return { label: "محجوزة", tone: "bg-[color:var(--color-warn)]/15 text-[color:oklch(0.55_0.15_70)]" };
    case "rented":
      return { label: "مؤجرة", tone: "bg-ink text-white" };
    case "under_maintenance":
      return { label: "صيانة", tone: "bg-destructive/10 text-destructive" };
    case "unavailable":
      return { label: "غير متاحة", tone: "bg-muted text-muted-foreground" };
  }
}

export function contractStatusMeta(s: ContractStatus) {
  switch (s) {
    case "active":
      return { label: "نشط", tone: "bg-primary/10 text-primary" };
    case "expired":
      return { label: "منتهي", tone: "bg-destructive/10 text-destructive" };
    case "terminated":
      return { label: "مفسوخ", tone: "bg-muted text-muted-foreground" };
    case "cancelled":
      return { label: "ملغى", tone: "bg-muted text-muted-foreground" };
    case "renewed":
      return { label: "مجدد", tone: "bg-ink text-white" };
  }
}

export function dueStatusMeta(s: DueStatus) {
  switch (s) {
    case "paid":
      return { label: "مدفوع", tone: "bg-primary/10 text-primary" };
    case "pending":
      return { label: "مستحق", tone: "bg-[color:var(--color-warn)]/15 text-[color:oklch(0.55_0.15_70)]" };
    case "partially_paid":
      return { label: "سداد جزئي", tone: "bg-ink/10 text-ink" };
    case "overdue":
      return { label: "متأخر", tone: "bg-destructive/10 text-destructive" };
  }
}

export function paymentMethodLabel(m: PaymentMethod): string {
  switch (m) {
    case "cash": return "نقداً";
    case "transfer": return "تحويل بنكي";
    case "card": return "بطاقة مدى / ائتمان";
    case "cheque": return "شيك مصدّق";
    case "other": return "طريقة أخرى";
  }
}

export function expenseCategoryLabel(c: ExpenseCategory): string {
  switch (c) {
    case "maintenance": return "صيانة وتصليحات";
    case "electricity": return "كهرباء";
    case "water": return "مياه";
    case "cleaning": return "نظافة وحراسة";
    case "services": return "خدمات وإداريات";
    case "fees": return "رسوم وضريبة";
    case "other": return "مصروفات أخرى";
  }
}

export function paymentCycleLabel(pc: PaymentCycle, customMonths?: number | null): string {
  switch (pc) {
    case "monthly": return "شهري (كل شهر)";
    case "quarterly": return "ربع سنوي (كل ٣ أشهر)";
    case "semi_annual": return "نصف سنوي (كل ٦ أشهر)";
    case "annual": return "سنوي (دفعة واحدة)";
    case "custom": return `كل ${customMonths || 1} أشهر`;
  }
}

const AR_WEEKDAYS = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
const AR_WEEKDAYS_SHORT = ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"];
const AR_MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

export function toArabicDigits(input: number | string): string {
  return String(input).replace(/\d/g, (d) => "٠١٢٣٤٥٦٧٨٩"[Number(d)]);
}

export function formatDate(
  d: Date | string,
  parts: { weekday?: "long" | "short"; day?: boolean; month?: boolean; year?: boolean } = {
    weekday: "long",
    day: true,
    month: true,
  },
): string {
  const dateObj = typeof d === "string" ? new Date(d) : d;
  if (isNaN(dateObj.getTime())) return "—";
  const out: string[] = [];
  if (parts.weekday === "long") out.push(AR_WEEKDAYS[dateObj.getDay()]);
  else if (parts.weekday === "short") out.push(AR_WEEKDAYS_SHORT[dateObj.getDay()]);
  const dateBit: string[] = [];
  if (parts.day) dateBit.push(toArabicDigits(dateObj.getDate()));
  if (parts.month) dateBit.push(AR_MONTHS[dateObj.getMonth()]);
  if (parts.year) dateBit.push(toArabicDigits(dateObj.getFullYear()));
  if (dateBit.length) out.push(dateBit.join(" "));
  return out.join("، ");
}

export function greeting(now: Date = new Date()): string {
  const h = now.getHours();
  if (h < 12) return "صباح الخير";
  return "مساء الخير";
}

export function todayLabel(now: Date = new Date()): string {
  return formatDate(now, { weekday: "long", day: true, month: true });
}

// WhatsApp and SMS launcher helper
export function openWhatsApp(phone: string, text: string) {
  const cleaned = phone.replace(/[^\d+]/g, "");
  let formatted = cleaned;
  if (cleaned.startsWith("05")) {
    formatted = "966" + cleaned.slice(1);
  } else if (cleaned.startsWith("5")) {
    formatted = "966" + cleaned;
  }
  const url = `https://wa.me/${formatted}?text=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}

export function openSMS(phone: string, text: string) {
  const url = `sms:${phone}?body=${encodeURIComponent(text)}`;
  window.open(url, "_blank");
}
