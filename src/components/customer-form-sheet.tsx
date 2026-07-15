import { useEffect, useState } from "react";
import { X, User, Phone, Notebook, Loader2, AlertCircle, Trash2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { createCustomerFn, updateCustomerFn, deleteCustomerFn } from "@/lib/customers.functions";
import type { Customer } from "@/lib/mock";
import { cn } from "@/lib/utils";

export function CustomerFormSheet({
  open,
  onOpenChange,
  editing,
  onSaved,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  editing?: Customer | null;
  onSaved?: (c: Customer) => void;
}) {
  const mode = editing ? "edit" : "create";
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    setName(editing?.name ?? "");
    setPhone(editing?.phone ?? "");
    setNotes(editing?.notes ?? "");
  }, [open, editing]);

  const qc = useQueryClient();
  const createFn = useServerFn(createCustomerFn);
  const updateFn = useServerFn(updateCustomerFn);
  const deleteFn = useServerFn(deleteCustomerFn);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = { name: name.trim(), phone: phone.trim(), notes: notes.trim() };
      if (mode === "edit" && editing) {
        return await updateFn({ data: { id: editing.id, ...payload } });
      }
      return await createFn({ data: payload });
    },
    onSuccess: (row) => {
      qc.invalidateQueries({ queryKey: ["customers"] });
      qc.invalidateQueries({ queryKey: ["customer"] });
      toast.success(mode === "edit" ? "تم تحديث العميل" : "تم إضافة العميل");
      onSaved?.({
        id: (row as { id: string }).id,
        name: (row as { name: string }).name,
        phone: (row as { phone: string }).phone,
        notes: (row as { notes: string }).notes,
        createdAt: (row as { created_at: string }).created_at,
      });
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
      qc.invalidateQueries({ queryKey: ["customers"] });
      toast.success("تم حذف العميل");
      onOpenChange(false);
    },
    onError: (err: Error) => toast.error(err.message || "تعذّر الحذف"),
  });

  if (!open) return null;
  const canSave = name.trim().length >= 2;

  return (
    <div className="fixed inset-0 z-[70]" dir="rtl">
      <button
        aria-label="إغلاق"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 animate-fade bg-ink/50 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="animate-sheet absolute inset-x-0 bottom-0 mx-auto max-h-[92vh] max-w-[440px] overflow-y-auto rounded-t-[2rem] bg-card p-6 pb-10 shadow-[var(--shadow-elev-3)]"
      >
        <div className="mx-auto mb-5 h-1.5 w-12 rounded-full bg-stone-line" />

        <div className="mb-5 flex items-start justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              عملاء
            </p>
            <h2 className="mt-1 text-2xl font-bold tracking-tight">
              {mode === "edit" ? "تعديل عميل" : "عميل جديد"}
            </h2>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="grid size-9 place-items-center rounded-full bg-muted"
            aria-label="إغلاق"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="relative">
            <User className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="اسم العميل"
              className="h-12 w-full rounded-xl border border-stone-line bg-card px-4 pr-10 text-sm font-medium focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <div className="relative">
            <Phone className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              dir="ltr"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="05xxxxxxxx"
              className="h-12 w-full rounded-xl border border-stone-line bg-card px-4 pr-10 text-sm font-medium focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
          <div className="relative">
            <Notebook className="pointer-events-none absolute right-4 top-4 size-4 text-muted-foreground" />
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="ملاحظات (اختياري)"
              rows={3}
              className="w-full resize-none rounded-xl border border-stone-line bg-card px-4 pr-10 py-3 text-sm font-medium focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
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
              canSave && !saveMutation.isPending
                ? "bg-ink text-white shadow-[var(--shadow-elev-2)]"
                : "bg-muted text-muted-foreground",
            )}
          >
            {saveMutation.isPending ? <Loader2 className="size-5 animate-spin" /> : mode === "edit" ? "حفظ التعديلات" : "إضافة العميل"}
          </button>
          {mode === "edit" && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm("حذف هذا العميل؟")) deleteMutation.mutate();
              }}
              className="grid size-13 min-h-[52px] w-13 min-w-[52px] place-items-center rounded-2xl border border-destructive/30 bg-destructive/5 text-destructive"
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
