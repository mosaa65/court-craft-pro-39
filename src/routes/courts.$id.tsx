import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Pencil, Plus, CalendarDays, Coins, TrendingUp } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CourtFormSheet } from "@/components/court-form-sheet";
import { BookingSheet } from "@/components/booking-sheet";
import { BookingCard } from "@/components/booking-card";
import { courtQuery, bookingsQuery, localDateKey } from "@/lib/bookings.queries";
import { toArabicDigits } from "@/lib/mock";

export const Route = createFileRoute("/courts/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `ملعب — ${params.id.slice(0, 12)}` },
      { name: "description", content: "تفاصيل الملعب والحجوزات القادمة والإحصائيات." },
    ],
  }),
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(courtQuery(params.id));
    context.queryClient.ensureQueryData(bookingsQuery({ courtId: params.id, date: localDateKey() }));
  },
  component: CourtDetailPage,
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="px-6 pt-12 text-center">
        <p className="text-sm font-bold text-destructive">تعذّر تحميل الملعب</p>
        <p className="mt-1 text-xs text-muted-foreground">{error.message}</p>
        <Link to="/courts" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-white">
          العودة للملاعب
        </Link>
      </div>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell><div className="px-6 pt-12 text-center text-sm text-muted-foreground">الملعب غير موجود.</div></AppShell>
  ),
});

function CourtDetailPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { data: court } = useSuspenseQuery(courtQuery(id));
  const { data: todayBookings = [] } = useQuery(bookingsQuery({ courtId: id, date: localDateKey() }));
  const { data: upcoming = [] } = useQuery(bookingsQuery({ courtId: id }));

  const [editOpen, setEditOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);

  const active = todayBookings.filter((b) => b.status !== "cancelled");
  const revenueToday = active.reduce((s, b) => s + b.price, 0);
  const occupancy = Math.round((active.length / 14) * 100);
  const upcomingActive = upcoming.filter((b) => b.status !== "cancelled" && new Date(b.startAt) >= new Date()).slice(0, 6);

  return (
    <AppShell>
      <div className="relative">
        <img src={court.image} alt={court.name} className="aspect-[16/10] w-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink/50 via-ink/10 to-background" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <button
            onClick={() => router.history.back()}
            aria-label="رجوع"
            className="grid size-10 place-items-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur"
          >
            <ArrowRight className="size-4" />
          </button>
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-[11px] font-bold text-ink shadow-md backdrop-blur"
          >
            <Pencil className="size-3.5" /> تعديل
          </button>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">{court.sportLabel}</p>
          <h1 className="mt-1 text-2xl font-bold leading-tight">{court.name}</h1>
          <p className="mt-1 text-xs text-white/80">{court.surface}</p>
        </div>
      </div>

      <main className="space-y-4 px-5 pt-5">
        <section className="grid grid-cols-3 gap-2">
          <MiniKpi icon={<CalendarDays className="size-4" />} label="حجوزات اليوم" value={toArabicDigits(active.length)} />
          <MiniKpi icon={<TrendingUp className="size-4" />} label="نسبة الإشغال" value={`${toArabicDigits(occupancy)}٪`} />
          <MiniKpi icon={<Coins className="size-4" />} label="إيراد اليوم" value={`${toArabicDigits(revenueToday)}`} suffix="ر.س" />
        </section>

        <section className="card-elev flex items-center justify-between p-5">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">السعر بالساعة</p>
            <p className="tabular mt-1 text-2xl font-bold">
              {toArabicDigits(court.pricePerHour)} <span className="text-xs font-medium text-muted-foreground">ر.س</span>
            </p>
          </div>
          <button
            onClick={() => setBookOpen(true)}
            className="flex items-center gap-2 rounded-full bg-primary px-4 py-2.5 text-xs font-bold text-primary-foreground shadow-[var(--shadow-pitch)] active:scale-95"
          >
            <Plus className="size-4" /> حجز على هذا الملعب
          </button>
        </section>

        <section>
          <h2 className="mb-3 mt-2 text-sm font-bold">الحجوزات القادمة</h2>
          {upcomingActive.length === 0 ? (
            <div className="card-elev p-6 text-center text-xs text-muted-foreground">لا توجد حجوزات قادمة على هذا الملعب.</div>
          ) : (
            <div className="space-y-2">
              {upcomingActive.map((b) => <BookingCard key={b.id} booking={b} court={court} showDate />)}
            </div>
          )}
        </section>
      </main>

      <CourtFormSheet open={editOpen} onOpenChange={setEditOpen} editing={court} />
      <BookingSheet open={bookOpen} onOpenChange={setBookOpen} initialCourtId={court.id} />
    </AppShell>
  );
}

function MiniKpi({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: string; suffix?: string }) {
  return (
    <div className="card-elev p-3">
      <div className="text-muted-foreground">{icon}</div>
      <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="tabular mt-1 text-base font-bold">
        {value}
        {suffix && <span className="mr-1 text-[10px] font-medium text-muted-foreground">{suffix}</span>}
      </p>
    </div>
  );
}
