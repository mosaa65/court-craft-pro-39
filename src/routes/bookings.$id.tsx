import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowRight,
  Pencil,
  Trash2,
  Phone,
  MapPin,
  Clock,
  Coins,
  StickyNote,
  Calendar as CalendarIcon,
  Repeat,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CancelBookingDialog } from "@/components/cancel-booking-dialog";
import { BookingSheet } from "@/components/booking-sheet";
import { BookingPaymentCard } from "@/components/booking-payment-card";
import { bookingQuery, courtsQuery } from "@/lib/bookings.queries";
import {
  formatDate,
  formatDuration,
  durationMinutes,
  statusMeta,
  toArabicDigits,
  formatTime12,
} from "@/lib/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bookings/$id")({
  head: ({ params }) => ({
    meta: [
      { title: `تفاصيل الحجز — ${params.id.slice(0, 8)}` },
      { name: "description", content: "تفاصيل الحجز الكاملة مع إمكانية التعديل والإلغاء." },
    ],
  }),
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(bookingQuery(params.id));
    context.queryClient.ensureQueryData(courtsQuery);
  },
  component: BookingDetailPage,
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="px-6 pt-12 text-center">
        <p className="text-sm font-bold text-destructive">تعذّر تحميل الحجز</p>
        <p className="mt-1 text-xs text-muted-foreground">{error.message}</p>
        <Link to="/bookings" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-white">
          العودة للحجوزات
        </Link>
      </div>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell>
      <div className="px-6 pt-12 text-center text-sm text-muted-foreground">الحجز غير موجود.</div>
    </AppShell>
  ),
});

function BookingDetailPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { data: booking } = useSuspenseQuery(bookingQuery(id));
  const { data: courts } = useSuspenseQuery(courtsQuery);
  const court = courts.find((c) => c.id === booking.courtId);
  const meta = statusMeta(booking.status);
  const startDate = new Date(booking.startAt);
  const durMin = durationMinutes(booking.startAt, booking.endAt);

  const [editOpen, setEditOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);

  return (
    <AppShell>
      <div className="relative">
        {court?.image ? (
          <img src={court.image} alt={court.name} className="aspect-[16/10] w-full object-cover" />
        ) : (
          <div className="aspect-[16/10] w-full bg-muted" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-ink/60 via-ink/10 to-background" />
        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
          <button
            onClick={() => router.history.back()}
            className="grid size-10 place-items-center rounded-full bg-white/90 text-ink shadow-md backdrop-blur"
            aria-label="رجوع"
          >
            <ArrowRight className="size-4" />
          </button>
          <div className="flex items-center gap-2">
            {booking.recurrenceGroupId && (
              <span className="flex items-center gap-1 rounded-full bg-primary/90 px-3 py-1 text-[10px] font-bold text-primary-foreground backdrop-blur">
                <Repeat className="size-3" /> أسبوعي
              </span>
            )}
            <span className={cn("rounded-full px-3 py-1 text-[11px] font-bold backdrop-blur", meta.tone)}>
              {meta.label}
            </span>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 p-5 text-white">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/70">
            حجز #{id.slice(0, 8)}
          </p>
          <h1 className="mt-1 text-2xl font-bold leading-tight">{booking.customer}</h1>
          <p className="mt-1 text-xs text-white/80">{court?.name ?? booking.courtId}</p>
        </div>
      </div>

      <main className="space-y-4 px-5 pt-5">
        <section className="card-elev p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <CalendarIcon className="size-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">التاريخ</p>
              <p className="text-sm font-bold">
                {formatDate(startDate, { weekday: "long", day: true, month: true, year: true })}
              </p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            <MiniStat icon={<Clock className="size-4" />} label="الوقت" value={`${formatTime12(booking.start)} — ${formatTime12(booking.end)}`} />
            <MiniStat icon={<Clock className="size-4" />} label="المدة" value={formatDuration(durMin)} />
            <MiniStat icon={<Coins className="size-4" />} label="السعر" value={`${toArabicDigits(booking.price)} ر.س`} />
          </div>
        </section>

        {court && (
          <Link to="/courts/$id" params={{ id: court.id }} className="card-elev flex items-center gap-3 p-5 transition active:scale-[0.99]">
            <div className="grid size-11 place-items-center rounded-2xl bg-ink/5 text-ink">
              <MapPin className="size-5" />
            </div>
            <div className="flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">الملعب</p>
              <p className="text-sm font-bold">{court.name}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{court.surface}</p>
            </div>
            <div className="text-left">
              <p className="tabular text-lg font-bold">{court.pricePerHour}</p>
              <p className="text-[10px] font-medium text-muted-foreground">ر.س / ساعة</p>
            </div>
          </Link>
        )}

        <section className="card-elev p-5">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">العميل</p>
          <p className="mt-1 text-base font-bold">{booking.customer}</p>
          {booking.phone && (
            <a
              href={`tel:${booking.phone}`}
              className="mt-3 flex items-center gap-2 rounded-xl bg-muted px-3 py-2 text-sm font-semibold"
              dir="ltr"
            >
              <Phone className="size-4 text-primary" />
              {booking.phone}
            </a>
          )}
        </section>

        {booking.notes && (
          <section className="card-elev p-5">
            <div className="flex items-center gap-2">
              <StickyNote className="size-4 text-muted-foreground" />
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">ملاحظات</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed">{booking.notes}</p>
          </section>
        )}

        {booking.status !== "cancelled" && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <button
              onClick={() => setEditOpen(true)}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl bg-ink text-sm font-bold text-white transition active:scale-[0.99]"
            >
              <Pencil className="size-4" /> تعديل
            </button>
            <button
              onClick={() => setCancelOpen(true)}
              className="flex h-12 items-center justify-center gap-2 rounded-2xl border border-destructive/30 bg-destructive/5 text-sm font-bold text-destructive transition active:scale-[0.99]"
            >
              <Trash2 className="size-4" /> إلغاء الحجز
            </button>
          </div>
        )}
      </main>

      <BookingSheet open={editOpen} onOpenChange={setEditOpen} editing={booking} />
      <CancelBookingDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        bookingId={booking.id}
        recurrenceGroupId={booking.recurrenceGroupId}
        startAt={booking.startAt}
      />
    </AppShell>
  );
}

function MiniStat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-muted/50 p-3">
      <div className="flex items-center gap-1 text-muted-foreground">{icon}</div>
      <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-xs font-bold">{value}</p>
    </div>
  );
}
