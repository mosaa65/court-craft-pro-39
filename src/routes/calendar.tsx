import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { HOURS, formatDate, toArabicDigits, statusMeta } from "@/lib/mock";
import { bookingsQuery, courtsQuery, localDateKey } from "@/lib/bookings.queries";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/calendar")({
  head: () => ({
    meta: [
      { title: "التقويم — إدارة الحجوزات" },
      { name: "description", content: "تقويم يومي احترافي لعرض حجوزات الملاعب وحالة كل ساعة." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(courtsQuery);
    context.queryClient.ensureQueryData(bookingsQuery({ date: localDateKey() }));
  },
  component: CalendarPage,
});

function CalendarPage() {
  const [dayOffset, setDayOffset] = useState(0);
  const { data: courts } = useSuspenseQuery(courtsQuery);
  const [courtId, setCourtId] = useState<string>(courts[0]?.id ?? "");

  const days = useMemo(() => {
    const base = new Date();
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i - 2);
      return d;
    });
  }, []);

  const selectedDay = days[2 + dayOffset] ?? days[2];
  const dateKey = localDateKey(selectedDay);
  const { data: bookings = [] } = useSuspenseQuery(bookingsQuery({ date: dateKey, courtId }));
  const courtById = (id: string) => courts.find((c) => c.id === id);

  const bookedByHour = new Map<number, (typeof bookings)[number]>();
  bookings
    .filter((b) => b.status !== "cancelled")
    .forEach((b) => {
      const s = new Date(b.startAt).getHours();
      bookedByHour.set(s, b);
    });

  const monthLabel = formatDate(selectedDay, { month: true, year: true });

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/85 px-6 pb-4 pt-8 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              {monthLabel}
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight">التقويم</h1>
          </div>
          <div className="flex gap-1">
            <IconBtn onClick={() => setDayOffset((d) => Math.max(d - 1, -2))}>
              <ChevronRight className="size-4" />
            </IconBtn>
            <IconBtn onClick={() => setDayOffset((d) => Math.min(d + 1, 4))}>
              <ChevronLeft className="size-4" />
            </IconBtn>
          </div>
        </div>

        <div className="no-scrollbar -mx-6 mt-5 flex gap-2 overflow-x-auto px-6">
          {days.map((d, i) => {
            const active = i - 2 === dayOffset;
            return (
              <button
                key={i}
                onClick={() => setDayOffset(i - 2)}
                className={cn(
                  "flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-2xl border transition-all",
                  active
                    ? "border-transparent bg-ink text-white shadow-[var(--shadow-elev-2)]"
                    : "border-stone-line bg-card text-foreground",
                )}
              >
                <span className={cn("text-[10px] font-semibold", active ? "text-white/60" : "text-muted-foreground")}>
                  {formatDate(d, { weekday: "short" })}
                </span>
                <span className="mt-1 text-lg font-bold tabular">{toArabicDigits(d.getDate())}</span>
                {i === 2 && (
                  <span className={cn("mt-1 size-1 rounded-full", active ? "bg-primary" : "bg-primary/70")} />
                )}
              </button>
            );
          })}
        </div>
      </header>

      <main className="space-y-6 px-5 pt-6">
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {courts.map((c) => {
            const active = courtId === c.id;
            return (
              <button
                key={c.id}
                onClick={() => setCourtId(c.id)}
                className={cn(
                  "shrink-0 rounded-full border px-4 py-2 text-xs font-bold transition-all",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-stone-line bg-card text-muted-foreground",
                )}
              >
                {c.sportLabel} — {c.name.split("—")[1]?.trim()}
              </button>
            );
          })}
        </div>

        <section className="card-elev overflow-hidden">
          <div className="flex items-center justify-between border-b border-stone-line/70 px-5 py-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                جدول الساعات
              </p>
              <p className="mt-0.5 text-sm font-bold">{courtById(courtId)?.name}</p>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-semibold text-muted-foreground">
              <LegendDot className="bg-primary" label="محجوز" />
              <LegendDot className="bg-ink" label="تدريب" />
              <LegendDot className="bg-stone-line" label="متاح" />
            </div>
          </div>

          <ol className="divide-y divide-stone-line/70">
            {HOURS.map((h) => {
              const label = `${String(h).padStart(2, "0")}:00`;
              const b = bookedByHour.get(h);
              const meta = b ? statusMeta(b.status) : null;
              return (
                <li key={h} className="flex items-stretch gap-3 px-5 py-3">
                  <div className="tabular w-14 shrink-0 pt-1 text-[11px] font-bold text-muted-foreground">
                    {label}
                  </div>
                  {b ? (
                    <Link
                      to="/bookings/$id"
                      params={{ id: b.id }}
                      className={cn(
                        "flex-1 rounded-2xl px-4 py-3 border-r-4 shadow-sm animate-slot transition active:scale-[0.99]",
                        b.status === "confirmed" && "bg-primary/8 border-primary",
                        b.status === "pending" &&
                          "bg-[color:var(--color-warn)]/10 border-[color:var(--color-warn)]",
                        b.status === "training" && "bg-ink text-white border-primary",
                        b.status === "maintenance" && "bg-muted border-stone-line",
                      )}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className={cn("truncate text-sm font-bold", b.status === "training" && "text-white")}>
                          {b.customer}
                        </p>
                        <span
                          className={cn(
                            "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold",
                            b.status === "training" ? "bg-white/10 text-white" : meta!.tone,
                          )}
                        >
                          {meta!.label}
                        </span>
                      </div>
                      <p
                        className={cn(
                          "tabular mt-1 text-[11px] font-medium",
                          b.status === "training" ? "text-white/60" : "text-muted-foreground",
                        )}
                      >
                        {b.start} — {b.end}
                        {b.price > 0 && <> • {b.price} ر.س</>}
                      </p>
                    </Link>
                  ) : (
                    <div className="flex-1 rounded-2xl border border-dashed border-stone-line px-4 py-3 text-right text-[11px] font-semibold text-muted-foreground">
                      متاح
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      </main>
    </AppShell>
  );
}

function IconBtn({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="grid size-9 place-items-center rounded-full border border-stone-line bg-card text-foreground transition active:scale-95"
    >
      {children}
    </button>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cn("size-2 rounded-full", className)} />
      {label}
    </span>
  );
}
