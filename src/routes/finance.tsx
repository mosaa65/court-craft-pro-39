import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ArrowRight, TrendingUp, Coins, ReceiptText, Clock, CheckCircle2, XCircle, Download } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { bookingsQuery, courtsQuery } from "@/lib/bookings.queries";
import { toArabicDigits, formatDate, statusMeta, formatTime12 } from "@/lib/mock";

export const Route = createFileRoute("/finance")({
  head: () => ({
    meta: [
      { title: "المالية — الإيرادات والفواتير" },
      { name: "description", content: "لوحة مالية للإيرادات والفواتير الصادرة عن الحجوزات." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(courtsQuery);
    context.queryClient.ensureQueryData(bookingsQuery({}));
  },
  component: FinancePage,
});

type Range = "today" | "week" | "month" | "all";

function FinancePage() {
  const { data: courts } = useSuspenseQuery(courtsQuery);
  const { data: allBookings } = useSuspenseQuery(bookingsQuery({}));
  const [range, setRange] = useState<Range>("month");
  const [status, setStatus] = useState<"all" | "paid" | "pending">("all");

  const courtsMap = useMemo(() => new Map(courts.map((c) => [c.id, c])), [courts]);

  const filtered = useMemo(() => {
    const now = new Date();
    const start = new Date(now);
    if (range === "today") start.setHours(0, 0, 0, 0);
    else if (range === "week") start.setDate(now.getDate() - 7);
    else if (range === "month") start.setMonth(now.getMonth() - 1);
    else start.setTime(0);

    return allBookings
      .filter((b) => b.status !== "cancelled" && b.status !== "maintenance")
      .filter((b) => new Date(b.startAt) >= start)
      .filter((b) => {
        if (status === "all") return true;
        if (status === "paid") return b.status === "confirmed" || b.status === "training";
        return b.status === "pending";
      })
      .sort((a, b) => new Date(b.startAt).getTime() - new Date(a.startAt).getTime());
  }, [allBookings, range, status]);

  const totalRevenue = filtered.filter((b) => b.status !== "pending").reduce((s, b) => s + b.price, 0);
  const pendingRevenue = filtered.filter((b) => b.status === "pending").reduce((s, b) => s + b.price, 0);
  const paidCount = filtered.filter((b) => b.status !== "pending").length;
  const pendingCount = filtered.filter((b) => b.status === "pending").length;

  function exportCsv() {
    const header = ["رقم الفاتورة", "التاريخ", "الوقت", "العميل", "الملعب", "الحالة", "المبلغ"];
    const rows = filtered.map((b) => {
      const d = new Date(b.startAt);
      return [
        `INV-${b.id.slice(0, 8).toUpperCase()}`,
        formatDate(d, { day: true, month: true, year: true }),
        `${formatTime12(b.start)} - ${formatTime12(b.end)}`,
        b.customer,
        courtsMap.get(b.courtId)?.name ?? b.courtId,
        statusMeta(b.status).label,
        b.price,
      ];
    });
    const csv = [header, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/85 px-6 pb-4 pt-8 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <Link
            to="/manage"
            aria-label="رجوع"
            className="grid size-10 place-items-center rounded-full bg-muted text-ink"
          >
            <ArrowRight className="size-4" />
          </Link>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">مركز الإدارة</p>
            <h1 className="mt-0.5 text-xl font-bold tracking-tight">المالية والفواتير</h1>
          </div>
        </div>

        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1">
          {(["today", "week", "month", "all"] as Range[]).map((r) => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={
                "shrink-0 rounded-full px-4 py-2 text-[11px] font-bold transition " +
                (range === r ? "bg-ink text-white" : "bg-muted text-muted-foreground")
              }
            >
              {r === "today" ? "اليوم" : r === "week" ? "٧ أيام" : r === "month" ? "٣٠ يوم" : "الكل"}
            </button>
          ))}
        </div>
      </header>

      <main className="space-y-4 px-5 pt-3">
        <section className="grid grid-cols-2 gap-3">
          <Kpi
            icon={<Coins className="size-4" />}
            label="الإيرادات المحصّلة"
            value={toArabicDigits(totalRevenue)}
            suffix="ر.س"
            trend={`${toArabicDigits(paidCount)} فاتورة`}
            accent="primary"
          />
          <Kpi
            icon={<Clock className="size-4" />}
            label="بانتظار الدفع"
            value={toArabicDigits(pendingRevenue)}
            suffix="ر.س"
            trend={`${toArabicDigits(pendingCount)} فاتورة`}
            accent="warn"
          />
        </section>

        <section className="card-elev flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="grid size-10 place-items-center rounded-full bg-primary/10 text-primary">
              <TrendingUp className="size-4" />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">إجمالي المبيعات</p>
              <p className="tabular text-lg font-bold">
                {toArabicDigits(totalRevenue + pendingRevenue)} <span className="text-[10px] font-medium text-muted-foreground">ر.س</span>
              </p>
            </div>
          </div>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="flex items-center gap-1.5 rounded-full bg-ink px-3 py-2 text-[11px] font-bold text-white shadow-md disabled:opacity-40"
          >
            <Download className="size-3.5" /> تصدير CSV
          </button>
        </section>

        <div className="flex gap-1.5">
          {(["all", "paid", "pending"] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={
                "flex-1 rounded-full px-3 py-2 text-[11px] font-bold transition " +
                (status === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")
              }
            >
              {s === "all" ? "الكل" : s === "paid" ? "مدفوعة" : "معلّقة"}
            </button>
          ))}
        </div>

        <section className="space-y-2">
          <div className="flex items-center gap-2 pb-1">
            <ReceiptText className="size-4 text-muted-foreground" />
            <h2 className="text-sm font-bold">الفواتير</h2>
            <span className="tabular ml-auto text-[11px] font-medium text-muted-foreground">
              {toArabicDigits(filtered.length)} إجمالي
            </span>
          </div>

          {filtered.length === 0 ? (
            <div className="card-elev p-8 text-center text-xs text-muted-foreground">لا فواتير في هذه الفترة.</div>
          ) : (
            filtered.map((b) => {
              const court = courtsMap.get(b.courtId);
              const paid = b.status !== "pending";
              return (
                <Link
                  key={b.id}
                  to="/bookings/$id"
                  params={{ id: b.id }}
                  className="card-elev flex items-center gap-3 p-3 transition active:scale-[0.99]"
                >
                  <div
                    className={
                      "grid size-11 place-items-center rounded-xl " +
                      (paid ? "bg-primary/10 text-primary" : "bg-[color:var(--color-warn)]/15 text-[color:oklch(0.55_0.15_70)]")
                    }
                  >
                    {paid ? <CheckCircle2 className="size-5" /> : <Clock className="size-5" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="tabular text-[10px] font-bold text-muted-foreground">
                        INV-{b.id.slice(0, 6).toUpperCase()}
                      </p>
                      <span className={"rounded-full px-2 py-0.5 text-[9px] font-bold " + statusMeta(b.status).tone}>
                        {statusMeta(b.status).label}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm font-bold">{b.customer}</p>
                    <p className="truncate text-[11px] text-muted-foreground">
                      {court?.name ?? "—"} · {formatDate(new Date(b.startAt), { day: true, month: true })}
                    </p>
                  </div>
                  <div className="text-left">
                    <p className="tabular text-base font-bold">{toArabicDigits(b.price)}</p>
                    <p className="text-[9px] font-medium text-muted-foreground">ر.س</p>
                  </div>
                </Link>
              );
            })
          )}
        </section>
      </main>
    </AppShell>
  );
}

function Kpi({
  icon,
  label,
  value,
  suffix,
  trend,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
  trend?: string;
  accent: "primary" | "warn";
}) {
  const accentClass = accent === "primary" ? "bg-primary/10 text-primary" : "bg-[color:var(--color-warn)]/15 text-[color:oklch(0.55_0.15_70)]";
  return (
    <div className="card-elev p-4">
      <div className={"grid size-8 place-items-center rounded-full " + accentClass}>{icon}</div>
      <XCircle className="hidden" />
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="tabular mt-1 text-xl font-bold">
        {value}
        {suffix && <span className="mr-1 text-[10px] font-medium text-muted-foreground">{suffix}</span>}
      </p>
      {trend && <p className="tabular mt-0.5 text-[10px] font-medium text-muted-foreground">{trend}</p>}
    </div>
  );
}
