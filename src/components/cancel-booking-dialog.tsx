import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { useState } from "react";
import { AlertTriangle, Loader2, Repeat } from "lucide-react";
import { cancelBookingFn, cancelRecurrenceFn } from "@/lib/bookings.functions";
import { cn } from "@/lib/utils";

export function CancelBookingDialog({
  open,
  onOpenChange,
  bookingId,
  recurrenceGroupId,
  startAt,
  onCancelled,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  bookingId: string;
  recurrenceGroupId?: string | null;
  startAt?: string;
  onCancelled?: () => void;
}) {
  const qc = useQueryClient();
  const cancelFn = useServerFn(cancelBookingFn);
  const cancelRecurrence = useServerFn(cancelRecurrenceFn);
  const [scope, setScope] = useState<"one" | "all">("one");

  const mutation = useMutation({
    mutationFn: async () => {
      if (scope === "all" && recurrenceGroupId && startAt) {
        return await cancelRecurrence({ data: { groupId: recurrenceGroupId, fromISO: startAt } });
      }
      return await cancelFn({ data: { id: bookingId } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["booking", bookingId] });
      qc.invalidateQueries({ queryKey: ["notifications"] });
      toast.success(scope === "all" ? "تم إلغاء كل الحجوزات المتكررة" : "تم إلغاء الحجز");
      onOpenChange(false);
      onCancelled?.();
    },
    onError: (err: Error) => toast.error(err.message || "تعذّر إلغاء الحجز"),
  });

  if (!open) return null;
  const hasRecurrence = Boolean(recurrenceGroupId);

  return (
    <div className="fixed inset-0 z-[60]" dir="rtl">
      <button
        aria-label="إغلاق"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 animate-fade bg-ink/50 backdrop-blur-[2px]"
      />
      <div
        role="alertdialog"
        aria-modal="true"
        className="animate-sheet absolute inset-x-4 top-1/2 mx-auto max-w-[380px] -translate-y-1/2 rounded-3xl bg-card p-6 shadow-[var(--shadow-elev-3)]"
      >
        <div className="mx-auto mb-4 grid size-14 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-6" />
        </div>
        <h3 className="text-center text-lg font-bold">إلغاء الحجز</h3>
        <p className="mt-2 text-center text-sm text-muted-foreground">
          {hasRecurrence
            ? "هذا حجز متكرر أسبوعيًا. اختر ما تريد إلغاءه:"
            : "هل أنت متأكد من إلغاء هذا الحجز؟"}
        </p>

        {hasRecurrence && (
          <div className="mt-4 space-y-2">
            {(
              [
                { v: "one" as const, label: "هذا الحجز فقط", hint: "لن يتأثر باقي الأسابيع" },
                { v: "all" as const, label: "كل الحجوزات القادمة", hint: "من هذا الأسبوع فما بعد" },
              ]
            ).map((o) => (
              <button
                key={o.v}
                type="button"
                onClick={() => setScope(o.v)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl border p-3 text-right transition",
                  scope === o.v ? "border-primary bg-primary/5" : "border-stone-line bg-card",
                )}
              >
                <div className={cn(
                  "grid size-9 place-items-center rounded-lg",
                  scope === o.v ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}>
                  <Repeat className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">{o.label}</p>
                  <p className="text-[11px] text-muted-foreground">{o.hint}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="h-11 rounded-xl border border-stone-line bg-card text-sm font-bold"
          >
            رجوع
          </button>
          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="flex h-11 items-center justify-center gap-2 rounded-xl bg-destructive text-sm font-bold text-destructive-foreground disabled:opacity-70"
          >
            {mutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "نعم، إلغاء"}
          </button>
        </div>
      </div>
    </div>
  );
}
