import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { ArrowUpLeft, TrendingUp, Bell, ChevronLeft, Building2, Plus, DollarSign, ChevronRight, User, Calendar, FileText } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { greeting, todayLabel, toArabicDigits, dueStatusMeta, formatDate, type Due } from "@/lib/types";
import { propertiesQuery } from "@/lib/properties.queries";
import { unitsQuery } from "@/lib/units.queries";
import { contractsQuery } from "@/lib/contracts.queries";
import { duesQuery } from "@/lib/dues.queries";
import { unreadCountQuery } from "@/lib/notifications.queries";
import { PaymentSheet } from "@/components/payment-sheet";
import { ContractFormSheet } from "@/components/contract-form-sheet";
import { DueDetailSheet } from "@/components/due-detail-sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم — نظام إدارة العقارات والإيجارات" },
      { name: "description", content: "واجهة أنيقة لإدارة العقارات والوحدات والمستأجرين والعقود والدفعات." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { data: properties = [] } = useQuery(propertiesQuery(""));
  const { data: units = [] } = useQuery(unitsQuery({}));
  const { data: contracts = [] } = useQuery(contractsQuery({}));
  const { data: dues = [] } = useQuery(duesQuery({ status: "pending" }));
  const { data: unread = 0 } = useQuery(unreadCountQuery);

  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [contractSheetOpen, setContractSheetOpen] = useState(false);
  const [selectedDue, setSelectedDue] = useState<Due | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [dueForPayment, setDueForPayment] = useState<string | undefined>(undefined);

  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const rentedUnits = units.filter((u) => u.status === "rented").length;
  const availableUnits = units.filter((u) => u.status === "available").length;

  const totalDuesPendingAmount = dues.reduce((s, d) => s + (d.amount - d.paidAmount), 0);
  const activeContractsCount = contracts.filter((c) => c.status === "active").length;
  const occupancyRate = units.length ? Math.round((rentedUnits / units.length) * 100) : 0;

  const upcomingDues = dues.slice(0, 5);

  const handleCardClick = (d: Due) => {
    setSelectedDue(d);
    setDetailSheetOpen(true);
  };

  const handleCollectClick = (e: React.MouseEvent, dueId: string) => {
    e.stopPropagation();
    setDueForPayment(dueId);
    setPaymentSheetOpen(true);
  };

  return (
    <AppShell>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-line/70 bg-background/85 px-6 pb-4 pt-8 backdrop-blur-md">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {now ? greeting(now) : "أهلًا"}
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight">
            {now ? todayLabel(now) : "لوحة التحكم"}
          </h1>
        </div>
        <Link
          to="/notifications"
          aria-label="التنبيهات"
          className="relative grid size-11 place-items-center rounded-full border border-stone-line bg-card text-foreground transition active:scale-95"
        >
          <Bell className="size-[18px]" strokeWidth={1.8} />
          {unread > 0 && (
            <span className="tabular absolute -right-1 -top-1 grid h-5 min-w-[20px] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground ring-2 ring-card">
              {toArabicDigits(unread > 99 ? "99+" : unread)}
            </span>
          )}
        </Link>
      </header>

      <main className="space-y-6 px-5 pt-6">
        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            onClick={() => {
              setDueForPayment(undefined);
              setPaymentSheetOpen(true);
            }}
            className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-xs shadow-md active:scale-95 transition"
          >
            <DollarSign className="size-4" />
            تسجيل سداد / تحصيل
          </button>
          <button
            onClick={() => setContractSheetOpen(true)}
            className="flex items-center justify-center gap-2 h-12 rounded-2xl bg-ink text-white font-bold text-xs shadow-md active:scale-95 transition"
          >
            <Plus className="size-4" />
            إبرام عقد جديد
          </button>
        </div>

        {/* KPIs */}
        <section className="grid grid-cols-2 gap-3 animate-rise">
          <KpiCard
            label="العقارات والوحدات"
            value={toArabicDigits(properties.length)}
            unit="عقار"
            trend={`${toArabicDigits(units.length)} وحدة إجمالية`}
          />
          <KpiInkCard
            label="نسبة الإشغال"
            value={`${toArabicDigits(occupancyRate)}٪`}
            hint={`${toArabicDigits(rentedUnits)} مؤجرة • ${toArabicDigits(availableUnits)} شاغرة`}
          />
          <KpiCard
            label="العقود النشطة"
            value={toArabicDigits(activeContractsCount)}
            unit="عقد"
            trend="جميع العقارات"
          />
          <KpiCard
            label="إجمالي المستحقات"
            value={totalDuesPendingAmount.toLocaleString("ar-SA")}
            unit="ر.س"
            trend={`${toArabicDigits(dues.length)} دفعة مستحقة/متأخرة`}
          />
        </section>

        {/* Properties Showcase Slider */}
        <section className="animate-rise" style={{ animationDelay: "60ms" }}>
          <SectionHead
            title="العقارات النشطة"
            action={<Link to="/courts" className="text-xs font-bold text-primary hover:underline">عرض الكل</Link>}
          />
          {properties.length === 0 ? (
            <div className="card-elev p-6 text-center text-xs text-muted-foreground">
              لا توجد عقارات مسجلة بعد. أضف عقارك الأول من قسم الإدارة.
            </div>
          ) : (
            <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
              {properties.map((p) => {
                const propUnits = units.filter((u) => u.propertyId === p.id);
                const propRented = propUnits.filter((u) => u.status === "rented").length;
                return (
                  <Link
                    to="/courts/$id"
                    params={{ id: p.id }}
                    key={p.id}
                    className="card-elev min-w-[270px] overflow-hidden transition active:scale-[0.99]"
                  >
                    <div className="relative">
                      {p.imageUrl ? (
                        <img src={p.imageUrl} alt={p.name} loading="lazy" className="aspect-[16/10] w-full object-cover" />
                      ) : (
                        <div className="aspect-[16/10] w-full bg-gradient-to-br from-ink to-stone-800 flex items-center justify-center text-white/40">
                          <Building2 className="size-12" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                      <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-ink backdrop-blur-md">
                        {p.city} {p.district ? `— ${p.district}` : ""}
                      </span>
                      <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-primary/90 px-2.5 py-1 text-[10px] font-bold text-primary-foreground backdrop-blur-md">
                        <span>{toArabicDigits(propRented)} / {toArabicDigits(propUnits.length)} وحدة مؤجرة</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-bold">{p.name}</h3>
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {p.description || "عقار سكني / تجاري"}
                        </p>
                      </div>
                      <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-muted">
                        <span className="size-2 rounded-full bg-primary" />
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Upcoming Dues Cards (Same Beautiful Interactive Cards as previous system) */}
        <section className="animate-rise" style={{ animationDelay: "120ms" }}>
          <SectionHead
            title="الاستحقاقات القادمة والدفعات"
            action={
              <Link to="/bookings" className="text-xs font-bold text-primary hover:underline">
                عرض الكل
              </Link>
            }
          />

          {upcomingDues.length === 0 ? (
            <div className="card-elev p-8 text-center text-xs text-muted-foreground">
              لا توجد استحقاقات قادمة حالياً. جميع الالتزامات مسددة.
            </div>
          ) : (
            <div className="space-y-3">
              {upcomingDues.map((d, i) => {
                const meta = dueStatusMeta(d.status);
                const rem = d.amount - d.paidAmount;

                return (
                  <div
                    key={d.id}
                    onClick={() => handleCardClick(d)}
                    className="card-elev group relative flex items-center gap-3.5 p-4 transition-all duration-200 hover:shadow-lg active:scale-[0.99] cursor-pointer overflow-hidden animate-rise"
                    style={{ animationDelay: `${i * 45}ms` }}
                  >
                    {/* Status accent side-pill */}
                    <span
                      aria-hidden
                      className={cn(
                        "h-12 w-1.5 shrink-0 rounded-full transition-colors",
                        d.status === "paid" && "bg-emerald-500",
                        d.status === "partially_paid" && "bg-amber-500",
                        d.status === "pending" && "bg-primary",
                        d.status === "overdue" && "bg-destructive",
                      )}
                    />

                    {/* Main Content */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                          {d.tenantName || "مستأجر"}
                        </h3>
                        <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold shrink-0", meta.tone)}>
                          {meta.label}
                        </span>
                      </div>

                      <p className="truncate text-xs text-muted-foreground mt-0.5">
                        {d.propertyName} (وحدة {d.unitNumber})
                      </p>

                      <div className="mt-1.5 flex items-center gap-3 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1 font-semibold text-stone-600 dark:text-stone-300">
                          <Calendar className="size-3 text-primary" />
                          {formatDate(d.dueDate, { day: true, month: true })}
                        </span>
                        <span>•</span>
                        <span className="truncate">{d.title}</span>
                      </div>
                    </div>

                    {/* Amount & Direct Collect Action */}
                    <div className="flex flex-col items-end gap-1 shrink-0 text-left">
                      <span className="tabular text-sm font-extrabold text-foreground">
                        {toArabicDigits(rem)} <span className="text-[10px] font-medium text-muted-foreground">ر.س</span>
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleCollectClick(e, d.id)}
                        className="mt-1 flex h-7 items-center gap-1 rounded-full bg-primary/10 px-3 text-[10px] font-bold text-primary hover:bg-primary hover:text-primary-foreground transition active:scale-95"
                      >
                        <DollarSign className="size-3" />
                        تحصيل الآن
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Performance Banner */}
        <section className="ink-card flex items-center justify-between p-5 animate-rise" style={{ animationDelay: "180ms" }}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">ملخص العقارات</p>
            <p className="mt-2 text-2xl font-bold tabular">
              {toArabicDigits(activeContractsCount)}{" "}
              <span className="text-xs font-medium text-white/60">عقود جارية</span>
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-primary">
              <TrendingUp className="size-3.5" /> تحصيل وإدارة كاملة للعقارات
            </p>
          </div>
          <Link to="/calendar" className="flex items-center gap-1 rounded-full bg-white/10 px-3.5 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/15">
            التقويم
            <ArrowUpLeft className="size-3.5" />
          </Link>
        </section>
      </main>

      <DueDetailSheet
        due={selectedDue}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
      />
      <PaymentSheet
        open={paymentSheetOpen}
        onOpenChange={setPaymentSheetOpen}
        defaultDueId={dueForPayment}
      />
      <ContractFormSheet open={contractSheetOpen} onOpenChange={setContractSheetOpen} />
    </AppShell>
  );
}

function SectionHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-3.5 flex items-end justify-between px-1">
      <h2 className="text-lg font-bold tracking-tight">{title}</h2>
      {action}
    </div>
  );
}

function KpiCard({ label, value, unit, trend }: { label: string; value: string; unit: string; trend: string }) {
  return (
    <div className="card-elev p-4">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-2 flex items-baseline gap-1 text-2xl font-bold tabular">
        {value}
        {unit && <span className="text-xs font-medium text-muted-foreground">{unit}</span>}
      </p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-primary">{trend}</p>
    </div>
  );
}

function KpiInkCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="ink-card relative overflow-hidden p-4">
      <div className="absolute -left-6 -top-6 size-24 rounded-full bg-primary/25 blur-2xl" />
      <p className="text-[11px] font-semibold uppercase tracking-wider text-white/50">{label}</p>
      <p className="mt-2 text-2xl font-bold tabular">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wide text-primary">{hint}</p>
    </div>
  );
}
