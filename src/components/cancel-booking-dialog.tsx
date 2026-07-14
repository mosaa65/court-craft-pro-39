import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { AlertTriangle, Loader2 } from "lucide-react";
import { cancelBookingFn } from "@/lib/bookings.functions";

export function CancelBookingDialog({
  open,
  onOpenChange,
  bookingId,
  onCancelled,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  bookingId: string;
  onCancelled?: () => void;
}) {
  const qc = useQueryClient();
  const cancelFn = useServerFn(cancelBookingFn);
  const mutation = useMutation({
    mutationFn: () => cancelFn({ data: { id: bookingId } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["booking", bookingId] });
      toast.success("تم إلغاء الحجز");
      onOpenChange(false);
      onCancelled?.();
    },
    onError: (err: Error) => {
      toast.error(err.message || "تعذّر إلغاء الحجز");
    },
  });

  if (!open) return null;

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
          هل أنت متأكد من إلغاء هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء.
        </p>
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
