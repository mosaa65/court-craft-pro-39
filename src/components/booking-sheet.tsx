import { useMemo, useState, useEffect } from "react";
import { X, Check, User, Clock, AlertCircle, Loader2, Phone, Notebook } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { HOURS, toArabicDigits, type Booking, type BookingStatus } from "@/lib/mock";
import { bookingsQuery, courtsQuery, localDateKey } from "@/lib/bookings.queries";
import { createBookingFn, updateBookingFn } from "@/lib/bookings.functions";

type Mode = "create" | "edit";

export function BookingSheet({
  open,
  onOpenChange,
  editing,
  initialCourtId,
  initialDate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: Booking | null;
  initialCourtId?: string;
  initialDate?: string; // yyyy-mm-dd
}) {
  const mode: Mode = editing ? "edit" : "create";
  const dateKey = initialDate ?? (editing ? editing.startAt.slice(0, 10) : localDateKey());

  const { data: courts = [] } = useQuery(courtsQuery);
  const { data: bookings = [] } = useQuery(bookingsQuery({ date: dateKey }));

  const [courtId, setCourtId] = useState<string>("");
  const [start, setStart] = useState<string | null>(null);
  const [duration, setDuration] = useState<number>(60);
  const [customer, setCustomer] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<BookingStatus>("confirmed");
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setCourtId(editing.courtId);
      setStart(editing.start);
      setDuration(
        Math.max(30, Math.round((new Date(editing.endAt).getTime() - new Date(editing.startAt).getTime()) / 60000)),
      );
      setCustomer(editing.customer);
      setPhone(editing.phone);
      setNotes(editing.notes);
      setStatus(editing.status);
    } else {
      setCourtId(initialCourtId ?? courts[0]?.id ?? "");
      setStart(null);
      setDuration(60);
      setCustomer("");
      setPhone("");
      setNotes("");
      setStatus("confirmed");
    }
    setConfirmed(false);
  }, [open, editing, initialCourtId, courts]);

  const bookedSet = useMemo(() => {
    const set = new Set<string>();
    bookings
      .filter((b) => b.courtId === courtId && b.status !== "cancelled" && b.id !== editing?.id)
      .forEach((b) => {
        const sh = new Date(b.startAt).getHours();
        const eh = new Date(b.endAt).getHours() + (new Date(b.endAt).getMinutes() > 0 ? 1 : 0);
        for (let h = sh; h < eh; h++) set.add(`${String(h).padStart(2, "0")}:00`);
      });
    return set;
  }, [bookings, courtId, editing?.id]);

  const court = courts.find((c) => c.id === courtId);
  const canConfirm = Boolean(court && start && customer.trim().length >= 2);

  const qc = useQueryClient();
  const createFn = useServerFn(createBookingFn);
  const updateFn = useServerFn(updateBookingFn);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!court || !start) throw new Error("بيانات ناقصة");
      const [hh, mm] = start.split(":").map(Number);
      const startDate = new Date(dateKey + "T00:00:00");
      startDate.setHours(hh, mm, 0, 0);
      const endDate = new Date(startDate.getTime() + duration * 60000);
      const price = Math.round((court.pricePerHour * duration) / 60);
      const payload = {
        courtId: court.id,
        customerName: customer.trim(),
        customerPhone: phone.trim(),
        startAt: startDate.toISOString(),
        endAt: endDate.toISOString(),
        status,
        price,
        notes: notes.trim(),
      };
      if (mode === "edit" && editing) {
        return await updateFn({ data: { id: editing.id, ...payload } });
      }
      return await createFn({ data: payload });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["booking"] });
      toast.success(mode === "edit" ? "تم تحديث الحجز" : "تم تأكيد الحجز");
      setConfirmed(true);
    },
    onError: (err: Error) => {
      toast.error(err.message || "تعذّر حفظ الحجز");
    },
  });

  if (!open) return null;

  const HOUR_OPTIONS = HOURS.map((h) => `${String(h).padStart(2, "0")}:00`);

  return (
    <div className="fixed inset-0 z-50" dir="rtl">
      <button
        aria-label="إغلاق"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 animate-fade bg-ink/40 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="animate-sheet absolute inset-x-0 bottom-0 mx-auto max-h-[92vh] max-w-[440px] overflow-y-auto rounded-t-[2rem] bg-card p-6 pb-10 shadow-[var(--shadow-elev-3)]"
      >
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-stone-line" />

        {confirmed && court && start ? (
          <Success
            title={mode === "edit" ? "تم تحديث الحجز" : "تم تأكيد الحجز"}
            court={court.name}
            start={start}
            customer={customer}
            onDone={() => onOpenChange(false)}
          />
        ) : (
          <>
            <div className="mb-6 flex items-start justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  {mode === "edit" ? "تعديل" : "حجز سريع"}
                </p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight">
                  {mode === "edit" ? "تعديل الحجز" : "حجز جديد"}
                </h2>
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
              <div>
                <SectionLabel index={1} title="اختر الملعب" />
                <div className="no-scrollbar -mx-6 flex gap-2 overflow-x-auto px-6">
                  {courts.map((c) => {
                    const selected = c.id === courtId;
                    return (
                      <button
                        key={c.id}
                        type="button"
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

              <div>
                <SectionLabel index={2} title="وقت البداية" />
                <div className="grid grid-cols-4 gap-2">
                  {HOUR_OPTIONS.map((t) => {
                    const booked = bookedSet.has(t);
                    const selected = start === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        disabled={booked}
                        onClick={() => setStart(t)}
                        className={cn(
                          "tabular flex h-11 items-center justify-center rounded-xl border text-xs font-semibold transition-all",
                          booked && "border-stone-line bg-muted text-muted-foreground/50 line-through",
                          !booked && !selected && "border-stone-line bg-card text-foreground hover:border-primary/40",
                          selected && "border-transparent bg-ink text-white shadow-[var(--shadow-elev-2)]",
                        )}
                      >
                        <Clock className="ml-1 size-3 opacity-60" />
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <SectionLabel index={3} title="المدة" />
                <div className="grid grid-cols-4 gap-2">
                  {[30, 60, 90, 120].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setDuration(m)}
                      className={cn(
                        "h-11 rounded-xl border text-xs font-bold transition",
                        duration === m
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-stone-line bg-card text-muted-foreground",
                      )}
                    >
                      {toArabicDigits(m)} د
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <SectionLabel index={4} title="بيانات العميل" />
                <div className="space-y-2">
                  <div className="relative">
                    <User className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      dir="rtl"
                      value={customer}
                      onChange={(e) => setCustomer(e.target.value)}
                      placeholder="اسم العميل"
                      className="h-12 w-full rounded-xl border border-stone-line bg-card px-4 pr-10 text-sm font-medium placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input
                      dir="ltr"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="05xxxxxxxx"
                      className="h-12 w-full rounded-xl border border-stone-line bg-card px-4 pr-10 text-sm font-medium placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                  <div className="relative">
                    <Notebook className="pointer-events-none absolute right-4 top-4 size-4 text-muted-foreground" />
                    <textarea
                      dir="rtl"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="ملاحظات (اختياري)"
                      rows={2}
                      className="w-full resize-none rounded-xl border border-stone-line bg-card px-4 pr-10 py-3 text-sm font-medium placeholder:text-muted-foreground/70 focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
                    />
                  </div>
                </div>
              </div>

              {mode === "edit" && (
                <div>
                  <SectionLabel index={5} title="الحالة" />
                  <div className="grid grid-cols-3 gap-2">
                    {(["confirmed", "pending", "training", "maintenance"] as BookingStatus[]).map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setStatus(s)}
                        className={cn(
                          "h-10 rounded-xl border text-[11px] font-bold transition",
                          status === s
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-stone-line bg-card text-muted-foreground",
                        )}
                      >
                        {s === "confirmed" ? "مؤكد" : s === "pending" ? "بانتظار" : s === "training" ? "تدريب" : "صيانة"}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {mutation.isError && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs font-semibold text-destructive">
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{(mutation.error as Error).message}</span>
                </div>
              )}

              <button
                type="button"
                disabled={!canConfirm || mutation.isPending}
                onClick={() => mutation.mutate()}
                className={cn(
                  "flex h-14 w-full items-center justify-center gap-3 rounded-2xl text-base font-bold transition-all active:scale-[0.99]",
                  canConfirm && !mutation.isPending
                    ? "bg-ink text-white shadow-[var(--shadow-elev-2)]"
                    : "bg-muted text-muted-foreground",
                )}
              >
                {mutation.isPending ? (
                  <Loader2 className="size-5 animate-spin" />
                ) : (
                  <>
                    <span>{mode === "edit" ? "حفظ التعديلات" : "تأكيد الحجز"}</span>
                    {court && start && (
                      <span className="tabular flex items-center gap-1 rounded-full bg-primary/20 px-2.5 py-0.5 text-xs font-bold text-primary">
                        {Math.round((court.pricePerHour * duration) / 60)} ر.س
                      </span>
                    )}
                  </>
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
  title,
  court,
  start,
  customer,
  onDone,
}: {
  title: string;
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
      <h3 className="text-xl font-bold">{title}</h3>
      <p className="mt-1 text-sm text-muted-foreground">
        {customer} • {court}
      </p>
      <p className="tabular mt-4 inline-block rounded-full bg-muted px-4 py-2 text-sm font-semibold">
        {start}
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
