import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Search, ReceiptText, Calendar, DollarSign, User, AlertCircle, Filter, SlidersHorizontal } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { duesQuery } from "@/lib/dues.queries";
import { PaymentSheet } from "@/components/payment-sheet";
import { DueDetailSheet } from "@/components/due-detail-sheet";
import { AdvancedFilterSheet } from "@/components/advanced-filter-sheet";
import { toArabicDigits, dueStatusMeta, formatDate, type Due } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bookings/")({
  head: () => ({
    meta: [
      { title: "الاستحقاقات — جدول الأقساط والدفعات" },
      { name: "description", content: "متابعة كافة استحقاقات ودفعات الإيجار المتأخرة والقادمة والمدفوعة." },
    ],
  }),
  component: DuesPage,
});

type DateFilterType = "all" | "yesterday" | "today" | "tomorrow" | "specific";

export function DuesPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<DateFilterType>("all");
  const [propertyFilter, setPropertyFilter] = useState<string>("");
  const [tenantFilter, setTenantFilter] = useState<string>("");

  const [selectedDue, setSelectedDue] = useState<Due | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [advancedFilterOpen, setAdvancedFilterOpen] = useState(false);
  const [dueForPayment, setDueForPayment] = useState<string | undefined>(undefined);

  const { data: dues = [], isLoading } = useQuery(
    duesQuery({ status: statusFilter === "all" ? undefined : statusFilter, search }),
  );

  // Today Date Strings
  const now = new Date();
  const todayIso = now.toISOString().split("T")[0];

  const yesterdayDate = new Date(now);
  yesterdayDate.setDate(now.getDate() - 1);
  const yesterdayIso = yesterdayDate.toISOString().split("T")[0];

  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);
  const tomorrowIso = tomorrowDate.toISOString().split("T")[0];

  const todayNumLabel = `${toArabicDigits(now.getDate())}/${toArabicDigits(now.getMonth() + 1)}`;

  // Filter dues with date filter and advanced property/tenant filters
  const filteredDues = useMemo(() => {
    return dues.filter((d) => {
      // Date filter
      if (dateFilter === "yesterday" && d.dueDate !== yesterdayIso) return false;
      if (dateFilter === "today" && d.dueDate !== todayIso) return false;
      if (dateFilter === "tomorrow" && d.dueDate !== tomorrowIso) return false;
      if (dateFilter === "specific" && d.dueDate !== todayIso) return false;

      // Property filter
      if (propertyFilter && d.propertyId !== propertyFilter) return false;

      // Tenant filter
      if (tenantFilter && d.tenantId !== tenantFilter) return false;

      return true;
    });
  }, [dues, dateFilter, propertyFilter, tenantFilter, yesterdayIso, todayIso, tomorrowIso]);

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
      <header className="sticky top-0 z-30 bg-background/85 px-6 pb-4 pt-8 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">جدول الدفعات</p>
            <h1 className="mt-1 text-xl font-bold tracking-tight">الاستحقاقات والقروض الإيجارية</h1>
          </div>
          <button
            onClick={() => {
              setDueForPayment(undefined);
              setPaymentSheetOpen(true);
            }}
            className="flex h-10 items-center gap-1.5 rounded-full bg-primary px-4 text-xs font-bold text-primary-foreground shadow-md active:scale-95 transition"
          >
            <DollarSign className="size-4" /> تحصيل / سداد
          </button>
        </div>

        {/* Search Row with Elegant Circular Advanced Filter Button */}
        <div className="relative mt-4 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث باسم المستأجر أو العقار..."
              className="h-12 w-full rounded-2xl border border-stone-line bg-card px-4 pr-11 text-sm font-medium placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>
          <button
            onClick={() => setAdvancedFilterOpen(true)}
            aria-label="الفلاتر المتقدمة"
            title="الفلاتر المتقدمة (العقارات / المستأجرين)"
            className={`grid size-12 shrink-0 place-items-center rounded-2xl border transition active:scale-95 shadow-sm ${
              propertyFilter || tenantFilter
                ? "bg-primary text-primary-foreground border-primary"
                : "border-stone-line bg-card text-foreground hover:bg-muted"
            }`}
          >
            <SlidersHorizontal className="size-5" />
          </button>
        </div>

        {/* Date Filters Pills (أمس / اليوم / غداً / 22/7 / الكل) */}
        <div className="mt-3 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: "all", label: "الكل" },
            { id: "yesterday", label: "أمس" },
            { id: "today", label: "اليوم" },
            { id: "tomorrow", label: "غداً" },
            { id: "specific", label: todayNumLabel },
          ].map((df) => (
            <button
              key={df.id}
              onClick={() => setDateFilter(df.id as DateFilterType)}
              className={`rounded-full px-3 py-1 text-[11px] font-bold transition shrink-0 border ${
                dateFilter === df.id
                  ? "border-primary bg-primary/15 text-primary"
                  : "border-stone-line bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {df.label}
            </button>
          ))}
        </div>

        {/* Status Filter Pills */}
        <div className="mt-2 flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: "all", label: "جميع الاستحقاقات" },
            { id: "overdue", label: "المتأخرة ⚠️" },
            { id: "pending", label: "المستحقة" },
            { id: "partially_paid", label: "مدفوعة جزئياً" },
            { id: "paid", label: "المدفوعة بالكامل" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id)}
              className={`rounded-full px-3.5 py-1.5 text-xs font-bold transition shrink-0 ${
                statusFilter === f.id
                  ? "bg-ink text-white shadow-sm"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </header>

      <main className="space-y-3 px-5 pt-4">
        {isLoading ? (
          <p className="p-8 text-center text-xs text-muted-foreground">جارِ تحميل الاستحقاقات والدفعات...</p>
        ) : filteredDues.length === 0 ? (
          <div className="card-elev flex flex-col items-center gap-2 p-10 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
              <ReceiptText className="size-6" />
            </div>
            <p className="text-sm font-bold">لا تتوفر استحقاقات بهذه التصفية والتاريخ</p>
            <p className="text-xs text-muted-foreground">جرب تغيير فلترة التاريخ أو اسم العقار في خيارات التصفية.</p>
          </div>
        ) : (
          filteredDues.map((d, i) => {
            const meta = dueStatusMeta(d.status);
            const rem = d.amount - d.paidAmount;

            return (
              <div
                key={d.id}
                onClick={() => handleCardClick(d)}
                className="card-elev group relative flex items-center gap-3.5 p-4 transition-all duration-200 hover:shadow-lg active:scale-[0.99] cursor-pointer overflow-hidden animate-rise"
                style={{ animationDelay: `${i * 35}ms` }}
              >
                {/* Status bar */}
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

                {/* Content */}
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

                  <div className="mt-1.5 flex items-center gap-2.5 text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1 font-semibold text-stone-600 dark:text-stone-300">
                      <Calendar className="size-3 text-primary" />
                      {formatDate(d.dueDate, { day: true, month: true, year: true })}
                    </span>
                    <span>•</span>
                    <span className="truncate">{d.title}</span>
                  </div>
                </div>

                {/* Amount & Actions */}
                <div className="flex flex-col items-end gap-1 shrink-0 text-left">
                  <span className="tabular text-sm font-extrabold text-foreground">
                    {toArabicDigits(rem > 0 ? rem : d.amount)} <span className="text-[10px] font-medium text-muted-foreground">ر.س</span>
                  </span>
                  {rem > 0 && (
                    <button
                      type="button"
                      onClick={(e) => handleCollectClick(e, d.id)}
                      className="mt-1 flex h-7 items-center gap-1 rounded-full bg-primary/10 px-3 text-[10px] font-bold text-primary hover:bg-primary hover:text-primary-foreground transition active:scale-95"
                    >
                      <DollarSign className="size-3" />
                      تحصيل
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
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
      <AdvancedFilterSheet
        open={advancedFilterOpen}
        onOpenChange={setAdvancedFilterOpen}
        propertyId={propertyFilter}
        tenantId={tenantFilter}
        onApply={(f) => {
          setPropertyFilter(f.propertyId);
          setTenantFilter(f.tenantId);
        }}
        onReset={() => {
          setPropertyFilter("");
          setTenantFilter("");
        }}
      />
    </AppShell>
  );
}
