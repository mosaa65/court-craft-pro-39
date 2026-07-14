import { useMemo, useState, useEffect } from "react";
import { X, Check, User, Clock } from "lucide-react";
import { courts, todaysBookings, toHour } from "@/lib/mock";
import { cn } from "@/lib/utils";

const HOUR_OPTIONS = ["17:00", "18:00", "19:00", "20:00", "21:00", "22:00"];

export function BookingSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [courtId, setCourtId] = useState(courts[0].id);
  const [start, setStart] = useState<string | null>(null);
  const [customer, setCustomer] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (open) {
      setCourtId(courts[0].id);
      setStart(null);
      setCustomer("");
      setConfirmed(false);
    }
  }, [open]);

  const bookedSet = useMemo(() => {
    const set = new Set<string>();
    todaysBookings
      .filter((b) => b.courtId === courtId)
      .forEach((b) => {
        for (let h = Math.floor(toHour(b.start)); h < Math.ceil(toHour(b.end)); h++) {
          set.add(`${String(h).padStart(2, "0")}:00`);
        }
      });
    return set;
  }, [courtId]);

  const court = courts.find((c) => c.id === courtId)!;
  const canConfirm = Boolean(start && customer.trim().length >= 2);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        aria-label="إغلاق"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 animate-fade bg-ink/40 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="animate-sheet absolute inset-x-0 bottom-0 mx-auto max-w-[440px] rounded-t-[2rem] bg-card p-6 pb-10 shadow-[var(--shadow-elev-3)]"
      >
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-stone-line" />

        {confirmed ? (
          <Success court={court.name} start={start!} customer={customer} onDone={() => onOpenChange(false)} />
        ) : (
          <>
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">حجز سريع</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight">حجز جديد</h2>
              </div>
              <button
                onClick={() => onOpenChange(false)}
                aria-label="إغلاق"
                className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground transition-colors hover:bg-stone-line"
              >
                <X className="size-4" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Court picker */}
              <div>
                <SectionLabel index={1} title="اختر الملعب" />
                <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6">
                  {courts.map((c) => {
                    const selected = c.id === courtId;
                    return (
                      <button
                        key={c.id}
                        onClick={() => {
                          setCourtId(c.id);
                          setStart(null);
                        }}
                        className={cn(
                          "shrink-0 rounded-2xl border px-4 py-2.5 text-sm font-semibold transition-all",
                          selected
                            ? "border-primary bg-primary/5 text-primary shadow-sm"
                            : "border-stone-line bg-card text-muted-foreground",
                        )}
                      >
                        {c.sportLabel} — {c.name.split("—")[1]?.trim() ?? c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time slots */}
              <div>
                <SectionLabel index={2} title="الوقت المتاح اليوم" />
                <div className="grid grid-cols-3 gap-2">
                  {HOUR_OPTIONS.map((t) => {
                    const booked = bookedSet.has(t);
                    const selected = start === t;
                    return (
                      <button
                        key={t}
                        disabled={booked}
                        onClick={() => setStart(t)}
                        className={cn(
                          "tabular flex h-12 items-center justify-center rounded-xl border text-sm font-semibold transition-all",
                          booked && "border-stone-line bg-muted text-muted-foreground/50 line-through",
                          !booked && !selected && "border-stone-line bg-card text-foreground hover:border-primary/40",
                          selected && "border-transparent bg-ink text-white shadow-[var(--shadow-elev-2)]",
                        )}
                      >
                        <Clock className="ml-1 size-3.5 opacity-60" />
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Customer */}
              <div>
                <SectionLabel index={3} title="بيانات العميل" />
                <div className="relative">
                  <User className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    dir="rtl"
                    value={customer}
                    onChange={(e) => setCustomer(e.target.value)}
                    placeholder="اسم العميل ورقم الجوال"
                    className="h-12 w-full rounded-xl border border-stone-line bg-card px-4 pr-10 text-sm font-medium placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                  />
                </div>
              </div>

              {/* Confirm */}
              <button
                disabled={!canConfirm}
                onClick={() => setConfirmed(true)}
                className={cn(
                  "flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-base font-bold transition-all active:scale-[0.99]",
                  canConfirm
                    ? "bg-ink text-white shadow-[var(--shadow-elev-2)]"
                    : "bg-muted text-muted-foreground",
                )}
              >
                <span>تأكيد الحجز</span>
                {start && (
                  <span className="tabular flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
                    {court.pricePerHour} ر.س
                  </span>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function SectionLabel({ index, title }: { index: number; title: string }) {
  return (
    <div className="mb-3 flex items-center gap-2">
      <span className="tabular grid size-5 place-items-center rounded-full bg-ink text-[10px] font-bold text-white">
        {index}
      </span>
      <span className="text-xs font-bold uppercase tracking-wider text-foreground">{title}</span>
    </div>
  );
}

function Success({
  court,
  start,
  customer,
  onDone,
}: {
  court: string;
  start: string;
  customer: string;
  onDone: () => void;
}) {
  return (
    <div className="animate-rise py-4 text-center">
      <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-primary/15">
        <div className="grid size-11 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-pitch)]">
          <Check className="size-6" strokeWidth={3} />
        </div>
      </div>
      <h3 className="text-xl font-bold">تم تأكيد الحجز</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {customer} • {court}
      </p>
      <p className="tabular mt-4 inline-block rounded-full bg-muted px-4 py-2 text-sm font-semibold">
        اليوم — {start}
      </p>
      <button
        onClick={onDone}
        className="mt-6 h-12 w-full rounded-2xl bg-ink text-sm font-bold text-white transition active:scale-[0.99]"
      >
        تم
      </button>
    </div>
  );
}
