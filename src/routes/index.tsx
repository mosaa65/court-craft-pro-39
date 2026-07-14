import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowUpLeft, TrendingUp, Bell, ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import {
  courts,
  courtById,
  todaysBookings,
  greeting,
  todayLabel,
  statusMeta,
} from "@/lib/mock";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم — نظام إدارة الملاعب" },
      { name: "description", content: "لوحة تحكم أنيقة لإدارة الحجوزات والملاعب الرياضية." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const totalRevenue = todaysBookings.reduce((s, b) => s + b.price, 0);
  const confirmed = todaysBookings.filter((b) => b.status === "confirmed").length;
  const occupancy = Math.round((todaysBookings.length / (courts.length * 14)) * 100);
  const recent = todaysBookings.slice(0, 4);

  return (
    <AppShell>
      {/* Header */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-stone-line/70 bg-background/85 px-6 pb-4 pt-8 backdrop-blur-md">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
            {greeting()}
          </p>
          <h1 className="mt-1 text-xl font-bold tracking-tight">{todayLabel()}</h1>
        </div>
        <button
          aria-label="التنبيهات"
          className="relative grid size-11 place-items-center rounded-full border border-stone-line bg-card text-foreground"
        >
          <Bell className="size-[18px]" strokeWidth={1.8} />
          <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-primary ring-2 ring-card" />
        </button>
      </header>

      <main className="space-y-8 px-5 pt-6">
        {/* KPI Grid */}
        <section className="grid grid-cols-2 gap-3 animate-rise">
          <KpiCard
            label="إيراد اليوم"
            value={totalRevenue.toLocaleString("ar-SA")}
            unit="ر.س"
            trend="+١٢٪ عن أمس"
          />
          <KpiInkCard
            label="حجوزات اليوم"
            value={String(todaysBookings.length)}
            hint={`${confirmed} مؤكدة`}
          />
          <KpiCard
            label="نسبة الإشغال"
            value={`${occupancy}`}
            unit="٪"
            trend={`${courts.length * 14 - todaysBookings.length} فترة متاحة`}
          />
          <KpiCard
            label="الملاعب النشطة"
            value={String(courts.length)}
            unit=""
            trend="جميع الفروع"
          />
        </section>

        {/* Live status slider */}
        <section className="animate-rise" style={{ animationDelay: "60ms" }}>
          <SectionHead
            title="حالة الملاعب مباشرة"
            action={<Link to="/courts" className="text-sm font-semibold text-primary">عرض الكل</Link>}
          />
          <div className="no-scrollbar -mx-5 flex gap-3 overflow-x-auto px-5 pb-2">
            {courts.map((c) => {
              const active = todaysBookings.find(
                (b) => b.courtId === c.id && b.status === "confirmed",
              );
              return (
                <article
                  key={c.id}
                  className="card-elev min-w-[270px] overflow-hidden"
                >
                  <div className="relative">
                    <img
                      src={c.image}
                      alt={c.name}
                      loading="lazy"
                      width={1200}
                      height={750}
                      className="aspect-[16/10] w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/0 to-transparent" />
                    <span
                      className={
                        "absolute right-3 top-3 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider " +
                        (active
                          ? "bg-primary text-primary-foreground"
                          : "bg-white/85 text-ink")
                      }
                    >
                      {active ? "مشغول" : "متاح الآن"}
                    </span>
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[10px] font-bold text-ink backdrop-blur-md">
                      <span className="tabular">{c.pricePerHour}</span>
                      <span className="text-muted-foreground">ر.س / ساعة</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between p-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold">{c.name}</h3>
                      <p className="mt-0.5 truncate text-xs text-muted-foreground">
                        {active ? `التالي: ${active.start} — ${active.customer}` : "لا حجوزات قريبة"}
                      </p>
                    </div>
                    <div className="grid size-8 shrink-0 place-items-center rounded-xl bg-muted">
                      <span
                        className={
                          "size-1.5 rounded-full " +
                          (active ? "animate-pulse bg-primary" : "bg-muted-foreground/40")
                        }
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* Upcoming schedule */}
        <section className="animate-rise" style={{ animationDelay: "120ms" }}>
          <SectionHead
            title="الحجوزات القادمة"
            action={
              <Link to="/calendar" className="flex items-center gap-1 text-sm font-semibold text-primary">
                التقويم <ChevronLeft className="size-4" strokeWidth={2.4} />
              </Link>
            }
          />

          <div className="card-elev overflow-hidden">
            <ol className="divide-y divide-stone-line/70">
              {recent.map((b, i) => {
                const c = courtById(b.courtId)!;
                const meta = statusMeta(b.status);
                return (
                  <li
                    key={b.id}
                    className="flex items-center gap-3 p-4 animate-rise"
                    style={{ animationDelay: `${140 + i * 40}ms` }}
                  >
                    <div className="tabular grid w-14 shrink-0 text-center font-bold">
                      <span className="text-sm">{b.start}</span>
                      <span className="text-[10px] font-medium text-muted-foreground">— {b.end}</span>
                    </div>
                    <span
                      aria-hidden
                      className={
                        "h-10 w-1 shrink-0 rounded-full " +
                        (b.status === "confirmed"
                          ? "bg-primary"
                          : b.status === "training"
                          ? "bg-ink"
                          : b.status === "pending"
                          ? "bg-[color:var(--color-warn)]"
                          : "bg-muted-foreground/40")
                      }
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{b.customer}</p>
                      <p className="truncate text-xs text-muted-foreground">{c.name}</p>
                    </div>
                    <span
                      className={"rounded-full px-2 py-1 text-[10px] font-bold " + meta.tone}
                    >
                      {meta.label}
                    </span>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* Revenue mini insight */}
        <section
          className="ink-card flex items-center justify-between p-5 animate-rise"
          style={{ animationDelay: "180ms" }}
        >
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/50">
              أداء الأسبوع
            </p>
            <p className="mt-2 text-2xl font-bold tabular">
              {(totalRevenue * 6.4).toLocaleString("ar-SA")}{" "}
              <span className="text-xs font-medium text-white/60">ر.س</span>
            </p>
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-primary">
              <TrendingUp className="size-3.5" /> نمو ٢٢٪ خلال ٧ أيام
            </p>
          </div>
          <Link
            to="/calendar"
            className="flex items-center gap-1 rounded-full bg-white/10 px-3.5 py-2 text-xs font-bold text-white backdrop-blur transition hover:bg-white/15"
          >
            التفاصيل
            <ArrowUpLeft className="size-3.5" />
          </Link>
        </section>
      </main>
    </AppShell>
  );
}

function SectionHead({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div className="mb-4 flex items-end justify-between px-1">
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
