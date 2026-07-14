import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { courts, todaysBookings } from "@/lib/mock";

export const Route = createFileRoute("/courts")({
  head: () => ({
    meta: [
      { title: "الملاعب — إدارة الملاعب الرياضية" },
      { name: "description", content: "جميع الملاعب وحالتها الحالية والأسعار." },
    ],
  }),
  component: CourtsPage,
});

function CourtsPage() {
  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/85 px-6 pb-4 pt-8 backdrop-blur-md">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          الفرع الرئيسي
        </p>
        <h1 className="mt-1 text-xl font-bold tracking-tight">الملاعب</h1>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="ابحث عن ملعب أو رياضة"
            className="h-12 w-full rounded-2xl border border-stone-line bg-card px-4 pr-11 text-sm font-medium placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
        </div>
      </header>

      <main className="space-y-4 px-5 pt-6">
        {courts.map((c, i) => {
          const bookingCount = todaysBookings.filter((b) => b.courtId === c.id).length;
          const busy = bookingCount > 1;
          return (
            <article
              key={c.id}
              className="card-elev overflow-hidden animate-rise"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className="relative">
                <img
                  src={c.image}
                  alt={c.name}
                  loading="lazy"
                  width={1200}
                  height={750}
                  className="aspect-[16/9] w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 text-white">
                  <div>
                    <span
                      className={
                        "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider " +
                        (busy ? "bg-primary text-primary-foreground" : "bg-white/85 text-ink")
                      }
                    >
                      {busy ? "مشغول" : "متاح الآن"}
                    </span>
                    <h3 className="mt-2 text-lg font-bold leading-tight">{c.name}</h3>
                    <p className="mt-0.5 text-xs text-white/70">{c.surface}</p>
                  </div>
                  <div className="text-left">
                    <p className="tabular text-xl font-bold">{c.pricePerHour}</p>
                    <p className="text-[10px] font-medium text-white/70">ر.س / ساعة</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 divide-x divide-stone-line/70 divide-x-reverse">
                <Stat label="حجوزات اليوم" value={String(bookingCount)} />
                <Stat label="الفترات المتاحة" value={String(14 - bookingCount)} />
                <Stat label="السعر" value={`${c.pricePerHour} ر.س`} />
              </div>
            </article>
          );
        })}
      </main>
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-3 text-center">
      <p className="tabular text-sm font-bold">{value}</p>
      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
