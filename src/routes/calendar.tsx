import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { ChevronRight, ChevronLeft, Calendar as CalendarIcon, FileText, Clock, Wrench, Coins, ReceiptText, AlertTriangle, CheckCircle2, Building2, Filter } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { duesQuery } from "@/lib/dues.queries";
import { paymentsQuery } from "@/lib/payments.queries";
import { expensesQuery } from "@/lib/expenses.queries";
import { contractsQuery } from "@/lib/contracts.queries";
import { propertiesQuery } from "@/lib/properties.queries";
import { maintenanceQuery } from "@/lib/maintenance.queries";
import { formatDate, toArabicDigits, dueStatusMeta, type Due } from "@/lib/types";
import { DueDetailSheet } from "@/components/due-detail-sheet";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "التقويم — أحداث العقارات والدفعات والصيانة" },
      { name: "description", content: "تقويم عقاري لمتابعة كافة الاستحقاقات، السداد، العقود، المصروفات، والصيانة." },
    ],
  }),
  component: CalendarPage,
});

type EventCategory = "due" | "payment" | "expense" | "contract_start" | "contract_end" | "maintenance";

interface CalendarEvent {
  id: string;
  category: EventCategory;
  dateStr: string;
  propertyId?: string;
  title: string;
  subTitle: string;
  amount?: number;
  statusBadge?: { label: string; tone: string };
  rawDue?: Due;
}

export function CalendarPage() {
  const [dayOffset, setDayOffset] = useState(0);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string>("all");
  const [selectedDue, setSelectedDue] = useState<Due | null>(null);
  const [detailSheetOpen, setDetailSheetOpen] = useState(false);

  const { data: properties = [] } = useQuery(propertiesQuery(""));

  // Generate 14 days centered on selected offset
  const days = useMemo(() => {
    const base = new Date();
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i - 3);
      return d;
    });
  }, []);

  const selectedDay = days[3 + dayOffset] ?? days[3];

  // Helper to format ISO Date string YYYY-MM-DD
  const toIsoDateStr = (date: Date | string) => {
    const d = new Date(date);
    if (isNaN(d.getTime())) return "";
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };

  const selectedDayIsoStr = toIsoDateStr(selectedDay);

  const { data: dues = [] } = useQuery(duesQuery({}));
  const { data: payments = [] } = useQuery(paymentsQuery({}));
  const { data: expenses = [] } = useQuery(expensesQuery(""));
  const { data: contracts = [] } = useQuery(contractsQuery({}));
  const { data: maintenanceList = [] } = useQuery(maintenanceQuery({}));

  // Build all events
  const allEvents = useMemo(() => {
    const list: CalendarEvent[] = [];

    // Dues
    dues.forEach((d) => {
      const meta = dueStatusMeta(d.status);
      list.push({
        id: `due-${d.id}`,
        category: "due",
        dateStr: toIsoDateStr(d.dueDate),
        propertyId: d.propertyId,
        title: d.tenantName ? `استحقاق: ${d.tenantName}` : "استحقاق إيجار",
        subTitle: `${d.propertyName} (وحدة ${d.unitNumber}) • ${d.title}`,
        amount: d.amount - d.paidAmount,
        statusBadge: { label: meta.label, tone: meta.tone },
        rawDue: d,
      });
    });

    // Payments
    payments.forEach((p) => {
      list.push({
        id: `pay-${p.id}`,
        category: "payment",
        dateStr: toIsoDateStr(p.paymentDate),
        title: `سند قبض ${p.receiptNumber}`,
        subTitle: `محصل من: ${p.tenantName || "مستأجر"} • ${p.propertyName || ""}`,
        amount: p.amount,
        statusBadge: { label: "تم التحصيل", tone: "bg-emerald-500/10 text-emerald-600" },
      });
    });

    // Expenses
    expenses.forEach((e) => {
      list.push({
        id: `exp-${e.id}`,
        category: "expense",
        dateStr: toIsoDateStr(e.expenseDate),
        propertyId: e.propertyId ?? undefined,
        title: `مصروف: ${e.description}`,
        subTitle: `${e.propertyName || "عقار عام"} • ${e.vendor || ""}`,
        amount: e.amount,
        statusBadge: { label: "مصروف", tone: "bg-destructive/10 text-destructive" },
      });
    });

    // Contract Starts & Ends
    contracts.forEach((c) => {
      list.push({
        id: `c-start-${c.id}`,
        category: "contract_start",
        dateStr: toIsoDateStr(c.startDate),
        title: `بداية عقد جديد #${c.contractNumber}`,
        subTitle: `${c.tenantName} — ${c.propertyName} (وحدة ${c.unitNumber})`,
        amount: c.rentAmount,
        statusBadge: { label: "عقد جديد", tone: "bg-primary/10 text-primary" },
      });
      list.push({
        id: `c-end-${c.id}`,
        category: "contract_end",
        dateStr: toIsoDateStr(c.endDate),
        title: `انتهاء عقد #${c.contractNumber}`,
        subTitle: `${c.tenantName} — ${c.propertyName} (وحدة ${c.unitNumber})`,
        amount: c.rentAmount,
        statusBadge: { label: "انتهاء عقد", tone: "bg-destructive/10 text-destructive" },
      });
    });

    // Maintenance
    maintenanceList.forEach((m) => {
      list.push({
        id: `maint-${m.id}`,
        category: "maintenance",
        dateStr: toIsoDateStr(m.createdAt),
        propertyId: m.propertyId,
        title: `طلب صيانة: ${m.title}`,
        subTitle: `وحدة ${m.unitNumber} • أولية: ${m.priority}`,
        statusBadge: { label: "صيانة", tone: "bg-sky-500/10 text-sky-600" },
      });
    });

    return list;
  }, [dues, payments, expenses, contracts, maintenanceList]);

  // Filter events for selected date & selected property filter
  const dayEvents = useMemo(() => {
    return allEvents.filter((ev) => {
      if (ev.dateStr !== selectedDayIsoStr) return false;
      if (selectedPropertyId !== "all" && ev.propertyId && ev.propertyId !== selectedPropertyId) return false;
      return true;
    });
  }, [allEvents, selectedDayIsoStr, selectedPropertyId]);

  const monthLabel = formatDate(selectedDay, { month: true, year: true });

  const getEventCategoryStyle = (cat: EventCategory) => {
    switch (cat) {
      case "payment":
      case "contract_start":
        return {
          bar: "bg-emerald-500",
          bg: "bg-emerald-500/10 border-emerald-500/20",
          icon: <CheckCircle2 className="size-4 text-emerald-500" />,
        };
      case "due":
        return {
          bar: "bg-primary",
          bg: "bg-primary/10 border-primary/20",
          icon: <Coins className="size-4 text-primary" />,
        };
      case "expense":
      case "contract_end":
        return {
          bar: "bg-destructive",
          bg: "bg-destructive/10 border-destructive/20",
          icon: <ReceiptText className="size-4 text-destructive" />,
        };
      case "maintenance":
      default:
        return {
          bar: "bg-sky-500",
          bg: "bg-sky-500/10 border-sky-500/20",
          icon: <Wrench className="size-4 text-sky-500" />,
        };
    }
  };

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/85 px-6 pb-4 pt-8 backdrop-blur-md border-b border-stone-line/70">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {monthLabel}
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight">التقويم العقاري الأنيق</h1>
          </div>
          <div className="flex gap-1">
            <button
              onClick={() => setDayOffset((d) => Math.max(d - 1, -3))}
              className="grid size-9 place-items-center rounded-full border border-stone-line bg-card text-foreground transition active:scale-95 hover:bg-muted"
            >
              <ChevronRight className="size-4" />
            </button>
            <button
              onClick={() => setDayOffset((d) => Math.min(d + 1, 9))}
              className="grid size-9 place-items-center rounded-full border border-stone-line bg-card text-foreground transition active:scale-95 hover:bg-muted"
            >
              <ChevronLeft className="size-4" />
            </button>
          </div>
        </div>

        {/* Property Filter Bar (كل العقارات / برج الياسمين / إلخ) */}
        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setSelectedPropertyId("all")}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition border ${
              selectedPropertyId === "all"
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "border-stone-line bg-card text-muted-foreground hover:text-foreground"
            }`}
          >
            كل العقارات
          </button>
          {properties.map((p) => (
            <button
              key={p.id}
              onClick={() => setSelectedPropertyId(p.id)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-bold transition border ${
                selectedPropertyId === p.id
                  ? "bg-primary text-primary-foreground border-primary shadow-sm"
                  : "border-stone-line bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.name}
            </button>
          ))}
        </div>

        {/* Dynamic Days Selector Slider */}
        <div className="no-scrollbar -mx-6 mt-3 flex gap-3 overflow-x-auto px-6 pb-2">
          {days.map((d, i) => {
            const active = i - 3 === dayOffset;
            const isToday = i === 3;
            const dateIso = toIsoDateStr(d);
            const hasEvents = allEvents.some((ev) => ev.dateStr === dateIso);

            return (
              <button
                key={i}
                onClick={() => setDayOffset(i - 3)}
                className="group flex shrink-0 flex-col items-center gap-1.5 transition-transform active:scale-95"
              >
                <span className={`text-[10px] font-bold tracking-wider transition ${active ? "text-foreground font-extrabold" : "text-muted-foreground"}`}>
                  {formatDate(d, { weekday: "short" })}
                </span>
                <span
                  className={`tabular relative grid size-13 place-items-center rounded-2xl border-2 text-base font-bold transition-all ${
                    active
                      ? "border-transparent bg-ink text-white shadow-md scale-105"
                      : isToday
                      ? "border-primary/60 bg-primary/10 text-primary"
                      : "border-stone-line bg-card text-foreground"
                  }`}
                >
                  {toArabicDigits(d.getDate())}
                  {hasEvents && !active && (
                    <span className="absolute bottom-1 left-1/2 size-1.5 -translate-x-1/2 rounded-full bg-primary" />
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </header>

      <main className="space-y-4 px-5 pt-5">
        <section className="card-elev overflow-hidden p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-stone-line/70 pb-3">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <CalendarIcon className="size-4 text-primary" />
              أحداث {formatDate(selectedDay, { weekday: "long", day: true, month: true })}
            </h2>
            <span className="text-xs font-bold text-muted-foreground rounded-full bg-muted px-2.5 py-1">
              {toArabicDigits(dayEvents.length)} حدث
            </span>
          </div>

          {dayEvents.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground space-y-2">
              <div className="grid size-12 place-items-center rounded-full bg-muted/60 mx-auto text-muted-foreground">
                <CalendarIcon className="size-5" />
              </div>
              <p className="font-bold">لا يوجد أحداث أو دفعات مجدولة لهذا اليوم بالتصفية المحددة.</p>
              <p className="text-[11px] opacity-70">اختر عقاراً آخر أو يوماً آخر من شريط التواريخ أعلاه لمعاينة الأحداث.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dayEvents.map((ev, idx) => {
                const style = getEventCategoryStyle(ev.category);
                return (
                  <div
                    key={ev.id}
                    onClick={() => {
                      if (ev.rawDue) {
                        setSelectedDue(ev.rawDue);
                        setDetailSheetOpen(true);
                      }
                    }}
                    className={cn(
                      "p-4 rounded-2xl border flex items-center justify-between gap-3 text-xs transition-all hover:shadow-md animate-rise cursor-pointer",
                      style.bg,
                    )}
                    style={{ animationDelay: `${idx * 40}ms` }}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="grid size-10 place-items-center rounded-xl bg-background shadow-sm shrink-0">
                        {style.icon}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-foreground truncate">{ev.title}</h3>
                          {ev.statusBadge && (
                            <span className={cn("rounded-full px-2 py-0.5 text-[9px] font-bold shrink-0", ev.statusBadge.tone)}>
                              {ev.statusBadge.label}
                            </span>
                          )}
                        </div>
                        <p className="text-muted-foreground mt-0.5 truncate">{ev.subTitle}</p>
                      </div>
                    </div>

                    {ev.amount !== undefined && (
                      <div className="text-left font-extrabold text-sm tabular shrink-0 text-foreground">
                        {toArabicDigits(ev.amount)} <span className="text-[10px] font-medium text-muted-foreground">ر.س</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <DueDetailSheet
        due={selectedDue}
        open={detailSheetOpen}
        onOpenChange={setDetailSheetOpen}
      />
    </AppShell>
  );
}
