import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { Search, X, Filter, ChevronRight, ChevronLeft, CalendarDays } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { BookingCard } from "@/components/booking-card";
import { BookingSkeletonList } from "@/components/booking-skeleton";
import { bookingsQuery, courtsQuery, localDateKey } from "@/lib/bookings.queries";
import { formatDate, toArabicDigits, type BookingStatus } from "@/lib/mock";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/bookings")({
  head: () => ({
    meta: [
      { title: "الحجوزات — إدارة الملاعب" },
      { name: "description", content: "قائمة كل الحجوزات مع بحث وتصفية حسب التاريخ والملعب والحالة والمدة." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(courtsQuery);
  },
  component: BookingsPage,
});

type Duration = "all" | "short" | "hour" | "long";
type DateMode = "day" | "all";

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "الكل" },
  { value: "confirmed", label: "مؤكد" },
  { value: "pending", label: "بانتظار" },
  { value: "training", label: "تدريب" },
  { value: "maintenance", label: "صيانة" },
  { value: "cancelled", label: "ملغى" },
];

const DURATION_OPTIONS: { value: Duration; label: string }[] = [
  { value: "all", label: "أي مدة" },
  { value: "short", label: "أقل من ساعة" },
  { value: "hour", label: "ساعة" },
  { value: "long", label: "أكثر من ساعة" },
];

function BookingsPage() {
  const { data: courts } = useSuspenseQuery(courtsQuery);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<string>("all");
  const [courtId, setCourtId] = useState<string>("");
  const [duration, setDuration] = useState<Duration>("all");

  const [dateMode, setDateMode] = useState<DateMode>("day");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());

  const dateKey = localDateKey(selectedDate);
  const isToday = dateKey === localDateKey();
  const yesterday = dateKey === localDateKey(new Date(Date.now() - 86400000));
  const tomorrow = dateKey === localDateKey(new Date(Date.now() + 86400000));

  const filter = useMemo(
    () => ({
      date: dateMode === "day" ? dateKey : undefined,
      status,
      courtId: courtId || undefined,
      search: search.trim() || undefined,
      duration,
    }),
    [dateMode, dateKey, status, courtId, search, duration],
  );

  const { data: bookings, isLoading, isFetching } = useQuery(bookingsQuery(filter));
  const courtById = (id: string) => courts.find((c) => c.id === id);

  const activeFilters =
    (status !== "all" ? 1 : 0) + (courtId ? 1 : 0) + (duration !== "all" ? 1 : 0);

  const shiftDate = (delta: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + delta);
    setSelectedDate(d);
    setDateMode("day");
  };

  const quickPick = (offset: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    setSelectedDate(d);
    setDateMode("day");
  };

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/85 px-6 pb-4 pt-8 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              الحجوزات
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight">
              {dateMode === "all" ? "كل التواريخ" : formatDate(selectedDate, { weekday: "long", day: true, month: true })}
            </h1>
          </div>
          {activeFilters > 0 && (
            <button
              onClick={() => {
                setStatus("all");
                setCourtId("");
                setDuration("all");
              }}
              className="flex items-center gap-1 rounded-full border border-stone-line bg-card px-3 py-1.5 text-[11px] font-bold text-muted-foreground"
            >
              <X className="size-3" /> تصفية ({activeFilters})
            </button>
          )}
        </div>

        {/* Date navigator */}
        <div className="mt-4 flex items-center gap-2">
          <button
            onClick={() => shiftDate(-1)}
            aria-label="اليوم السابق"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-stone-line bg-card text-foreground"
          >
            <ChevronRight className="size-4" />
          </button>

          <div className="no-scrollbar flex flex-1 gap-1.5 overflow-x-auto">
            <DateChip active={yesterday} onClick={() => quickPick(-1)}>أمس</DateChip>
            <DateChip active={isToday && dateMode === "day"} onClick={() => quickPick(0)}>اليوم</DateChip>
            <DateChip active={tomorrow} onClick={() => quickPick(1)}>غدًا</DateChip>
            <label className={cn(
              "shrink-0 cursor-pointer rounded-full border px-3 py-2 text-[11px] font-bold transition",
              dateMode === "day" && !isToday && !yesterday && !tomorrow
                ? "border-primary bg-primary/10 text-primary"
                : "border-stone-line bg-card text-muted-foreground",
            )}>
              <span className="flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                <span className="tabular">{toArabicDigits(selectedDate.getDate())}/{toArabicDigits(selectedDate.getMonth() + 1)}</span>
              </span>
              <input
                type="date"
                value={dateKey}
                onChange={(e) => {
                  if (e.target.value) {
                    setSelectedDate(new Date(e.target.value + "T00:00:00"));
                    setDateMode("day");
                  }
                }}
                className="sr-only"
              />
            </label>
            <DateChip active={dateMode === "all"} onClick={() => setDateMode("all")}>الكل</DateChip>
          </div>

          <button
            onClick={() => shiftDate(1)}
            aria-label="اليوم التالي"
            className="grid size-10 shrink-0 place-items-center rounded-full border border-stone-line bg-card text-foreground"
          >
            <ChevronLeft className="size-4" />
          </button>
        </div>

        <div className="relative mt-3">
          <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            dir="rtl"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث باسم العميل أو رقم الجوال"
            className="h-12 w-full rounded-2xl border border-stone-line bg-card px-4 pr-11 text-sm font-medium placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
        </div>
      </header>

      <main className="space-y-4 px-5 pt-4">
        {/* Status chips */}
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          {STATUS_OPTIONS.map((s) => (
            <Chip key={s.value} active={status === s.value} onClick={() => setStatus(s.value)}>
              {s.label}
            </Chip>
          ))}
        </div>

        {/* Court chips */}
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5">
          <Chip active={courtId === ""} onClick={() => setCourtId("")}>كل الملاعب</Chip>
          {courts.map((c) => (
            <Chip key={c.id} active={courtId === c.id} onClick={() => setCourtId(c.id)}>
              {c.sportLabel}
            </Chip>
          ))}
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <Filter className="size-3.5 text-muted-foreground" />
          {DURATION_OPTIONS.map((d) => (
            <Chip key={d.value} small active={duration === d.value} onClick={() => setDuration(d.value)}>
              {d.label}
            </Chip>
          ))}
        </div>

        {isLoading ? (
          <BookingSkeletonList count={6} />
        ) : bookings && bookings.length > 0 ? (
          <div className={cn("space-y-3", isFetching && "opacity-70 transition")}>
            {bookings.map((b, i) => (
              <div
                key={b.id}
                className="animate-rise opacity-0 [animation-fill-mode:forwards]"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <BookingCard booking={b} court={courtById(b.courtId)} showDate={dateMode === "all"} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </main>
    </AppShell>
  );
}

function Chip({ active, onClick, children, small }: { active: boolean; onClick: () => void; children: React.ReactNode; small?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border font-bold transition-all",
        small ? "px-3 py-1 text-[10px]" : "px-4 py-2 text-xs",
        active ? "border-primary bg-primary/10 text-primary" : "border-stone-line bg-card text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

function DateChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-full border px-4 py-2 text-[11px] font-bold transition",
        active ? "border-primary bg-primary/10 text-primary" : "border-stone-line bg-card text-muted-foreground",
      )}
    >
      {children}
    </button>
  );
}

function EmptyState() {
  return (
    <div className="card-elev flex flex-col items-center gap-2 p-10 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-muted">
        <Search className="size-5 text-muted-foreground" />
      </div>
      <p className="text-sm font-bold">لا توجد حجوزات مطابقة</p>
      <p className="text-xs text-muted-foreground">جرّب تغيير التاريخ أو التصفية.</p>
    </div>
  );
}

export type { BookingStatus };
