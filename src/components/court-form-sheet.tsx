import { useEffect, useState } from "react";
import { X, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { createCourtFn, updateCourtFn, deleteCourtFn } from "@/lib/bookings.functions";
import { SPORT_OPTIONS, type Court, SPORT_IMAGES } from "@/lib/mock";
import { cn } from "@/lib/utils";

export function CourtFormSheet({
  open,
  onOpenChange,
  editing,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: Court | null;
}) {
  const mode = editing ? "edit" : "create";
  const [id, setId] = useState("");
  const [name, setName] = useState("");
  const [sport, setSport] = useState<Court["sport"]>("padel");
  const [surface, setSurface] = useState("");
  const [pricePerHour, setPricePerHour] = useState<number>(80);

  useEffect(() => {
    if (!open) return;
    if (editing) {
      setId(editing.id);
      setName(editing.name);
      setSport(editing.sport);
      setSurface(editing.surface);
      setPricePerHour(editing.pricePerHour);
    } else {
      setId("");
      setName("");
      setSport("padel");
      setSurface("");
      setPricePerHour(80);
    }
  }, [open, editing]);

  const qc = useQueryClient();
  const createFn = useServerFn(createCourtFn);
  const updateFn = useServerFn(updateCourtFn);
  const deleteFn = useServerFn(deleteCourtFn);

  const sportOpt = SPORT_OPTIONS.find((s) => s.value === sport)!;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        id: mode === "create" ? (id.trim() || `court-${Date.now()}`) : id,
        name: name.trim(),
        sport,
        sportLabel: sportOpt.label,
        surface: surface.trim(),
        pricePerHour,
        imageKey: sportOpt.imageKey,
      };
      if (mode === "edit") return await updateFn({ data: payload });
      return await createFn({ data: payload });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courts"] });
      qc.invalidateQueries({ queryKey: ["court"] });
      toast.success(mode === "edit" ? "تم تحديث الملعب" : "تم إضافة الملعب");
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message || "تعذّر الحفظ"),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!editing) return;
      return await deleteFn({ data: { id: editing.id } });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["courts"] });
      toast.success("تم حذف الملعب");
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message || "تعذّر الحذف — قد يكون فيه حجوزات مرتبطة"),
  });

  if (!open) return null;
  const canSave = name.trim().length >= 2 && pricePerHour >= 0;

  return (
    <div className="fixed inset-0 z-[70]" dir="rtl">
      <button aria-label="إغلاق" onClick={() => onOpenChange(false)} className="absolute inset-0 animate-fade bg-ink/50 backdrop-blur-[2px]" />
      <div
        role="dialog"
        aria-modal="true"
        className="animate-sheet absolute inset-x-0 bottom-0 mx-auto max-h-[92vh] max-w-[440px] overflow-y-auto rounded-t-[2rem] bg-card p-6 pb-10 shadow-[var(--shadow-elev-3)]"
      >
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-stone-line" />
        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">ملاعب</p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              {mode === "edit" ? "تعديل ملعب" : "ملعب جديد"}
            </h2>
          </div>
          <button onClick={() => onOpenChange(false)} className="grid size-9 place-items-center rounded-full bg-muted" aria-label="إغلاق">
            <X className="size-4" />
          </button>
        </div>

        <div className="mb-5 aspect-[16/9] w-full overflow-hidden rounded-2xl border border-stone-line">
          <img src={SPORT_IMAGES[sportOpt.imageKey]} alt={sportOpt.label} className="h-full w-full object-cover" />
        </div>

        <div className="space-y-3">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم الملعب (مثال: ملعب البادل الأخضر — ١)"
            className="h-12 w-full rounded-xl border border-stone-line bg-card px-4 text-sm font-medium focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
          />

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">الرياضة</p>
            <div className="grid grid-cols-4 gap-2">
              {SPORT_OPTIONS.map((s) => (
                <button
                  key={s.value}
                  type="button"
                  onClick={() => setSport(s.value)}
                  className={cn(
                    "h-11 rounded-xl border text-xs font-bold transition",
                    sport === s.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-stone-line bg-card text-muted-foreground",
                  )}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <input
            value={surface}
            onChange={(e) => setSurface(e.target.value)}
            placeholder="نوع الأرضية (عشب صناعي، خشب، ...)"
            className="h-12 w-full rounded-xl border border-stone-line bg-card px-4 text-sm font-medium focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
          />

          <div className="relative">
            <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground">ر.س / ساعة</span>
            <input
              type="number"
              min={0}
              value={pricePerHour}
              onChange={(e) => setPricePerHour(Number(e.target.value))}
              className="tabular h-12 w-full rounded-xl border border-stone-line bg-card px-4 pl-24 text-sm font-bold focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
              dir="ltr"
            />
          </div>
        </div>

        {saveMutation.isError && (
          <div className="mt-3 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-xs font-semibold text-destructive">
            <AlertCircle className="mt-0.5 size-4 shrink-0" />
            <span>{(saveMutation.error as Error).message}</span>
          </div>
        )}

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            disabled={!canSave || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className={cn(
              "flex h-13 min-h-[52px] flex-1 items-center justify-center rounded-2xl text-sm font-bold transition active:scale-[0.99]",
              canSave && !saveMutation.isPending ? "bg-ink text-white shadow-[var(--shadow-elev-2)]" : "bg-muted text-muted-foreground",
            )}
          >
            {saveMutation.isPending ? <Loader2 className="size-5 animate-spin" /> : mode === "edit" ? "حفظ التعديلات" : "إضافة الملعب"}
          </button>
          {mode === "edit" && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("حذف هذا الملعب؟ (سيفشل إذا فيه حجوزات مرتبطة)")) deleteMutation.mutate();
              }}
              className="grid size-13 min-h-[52px] min-w-[52px] place-items-center rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive"
              aria-label="حذف"
            >
              <Trash2 className="size-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
