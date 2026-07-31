import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Pencil, Phone, Plus, Notebook, CalendarDays, Coins } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CustomerFormSheet } from "@/components/customer-form-sheet";
import { BookingSheet } from "@/components/booking-sheet";
import { BookingCard } from "@/components/booking-card";
import { customerQuery } from "@/lib/customers.queries";
import { bookingsQuery, courtsQuery } from "@/lib/bookings.queries";
import { toArabicDigits } from "@/lib/mock";

export const Route = createFileRoute("/customers/$id")({
  head: () => ({
    meta: [
      { title: "عميل — تفاصيل" },
      { name: "description", content: "بيانات العميل وسجل الحجوزات." },
    ],
  }),
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(customerQuery(params.id));
    context.queryClient.ensureQueryData(courtsQuery);
  },
  component: CustomerDetailPage,
  errorComponent: ({ error }) => (
    <AppShell>
      <div className="px-6 pt-12 text-center">
        <p className="text-sm font-bold text-destructive">تعذّر تحميل العميل</p>
        <p className="mt-1 text-xs text-muted-foreground">{error.message}</p>
        <Link to="/customers" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-bold text-white">
          العودة للعملاء
        </Link>
      </div>
    </AppShell>
  ),
  notFoundComponent: () => (
    <AppShell><div className="px-6 pt-12 text-center text-sm text-muted-foreground">العميل غير موجود.</div></AppShell>
  ),
});

function CustomerDetailPage() {
  const { id } = Route.useParams();
  const router = useRouter();
  const { data: customer } = useSuspenseQuery(customerQuery(id));
  const { data: courts = [] } = useSuspenseQuery(courtsQuery);
  const { data: bookings = [] } = useQuery(bookingsQuery({ phone: customer.phone || "___none___" }));

  const [editOpen, setEditOpen] = useState(false);
  const [bookOpen, setBookOpen] = useState(false);

  const active = bookings.filter((b) => b.status !== "cancelled");
  const totalSpent = active.reduce((s, b) => s + b.price, 0);
  const upcoming = active.filter((b) => new Date(b.startAt) >= new Date()).slice(0, 5);
  const past = active.filter((b) => new Date(b.startAt) < new Date()).slice(0, 5);
  const courtById = (cid: string) => courts.find((c) => c.id === cid);

  return (
    <AppShell>
      <header className="relative px-6 pb-6 pt-8 bg-gradient-to-b from-ink to-ink text-white">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.history.back()}
            aria-label="رجوع"
            className="grid size-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur"
          >
            <ArrowRight className="size-4" />
          </button>
          <button
            onClick={() => setEditOpen(true)}
            className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur"
          >
            <Pencil className="size-3.5" /> تعديل
          </button>
        </div>
        <div className="mt-5 flex items-center gap-4">
          <div className="grid size-16 place-items-center rounded-full bg-primary/25 text-2xl font-bold text-primary">
            {customer.name.slice(0, 1)}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-2xl font-bold">{customer.name}</h1>
            {customer.phone && (
              <a href={`tel:${customer.phone}`} className="mt-1 flex items-center gap-1.5 text-xs text-white/80" dir="ltr">
                <Phone className="size-3" /> {customer.phone}
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="space-y-4 px-5 pt-5">
        <section className="grid grid-cols-2 gap-2">
          <MiniKpi icon={<CalendarDays className="size-4" />} label="إجمالي الحجوزات" value={toArabicDigits(active.length)} />
          <MiniKpi icon={<Coins className="size-4" />} label="إجمالي المبلغ" value={toArabicDigits(totalSpent)} suffix="ر.س" />
        </section>

        <button
          onClick={() => setBookOpen(true)}
          className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground shadow-[var(--shadow-pitch)] active:scale-[0.99]"
        >
          <Plus className="size-5" /> حجز جديد لهذا العميل
        </button>

        {customer.notes && (
          <section className="card-elev p-5">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Notebook className="size-4" />
              <p className="text-[10px] font-semibold uppercase tracking-widest">ملاحظات</p>
            </div>
            <p className="mt-2 text-sm leading-relaxed">{customer.notes}</p>
          </section>
        )}

        <section>
          <h2 className="mb-3 text-sm font-bold">الحجوزات القادمة</h2>
          {upcoming.length === 0 ? (
            <div className="card-elev p-5 text-center text-xs text-muted-foreground">لا توجد حجوزات قادمة.</div>
          ) : (
            <div className="space-y-2">
              {upcoming.map((b) => <BookingCard key={b.id} booking={b} court={courtById(b.courtId)} showDate />)}
            </div>
          )}
        </section>

        {past.length > 0 && (
          <section>
            <h2 className="mb-3 mt-4 text-sm font-bold">الحجوزات السابقة</h2>
            <div className="space-y-2">
              {past.map((b) => <BookingCard key={b.id} booking={b} court={courtById(b.courtId)} showDate />)}
            </div>
          </section>
        )}
      </main>

      <CustomerFormSheet open={editOpen} onOpenChange={setEditOpen} editing={customer} />
      <BookingSheet
        open={bookOpen}
        onOpenChange={setBookOpen}
        initialCustomer={{ name: customer.name, phone: customer.phone }}
      />
    </AppShell>
  );
}

function MiniKpi({ icon, label, value, suffix }: { icon: React.ReactNode; label: string; value: string; suffix?: string }) {
  return (
    <div className="card-elev p-4">
      <div className="text-muted-foreground">{icon}</div>
      <p className="mt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="tabular mt-1 text-lg font-bold">
        {value}
        {suffix && <span className="mr-1 text-[10px] font-medium text-muted-foreground">{suffix}</span>}
      </p>
    </div>
  );
}
