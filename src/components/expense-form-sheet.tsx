import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Receipt, Check } from "lucide-react";
import { propertiesQuery } from "@/lib/properties.queries";
import { createExpenseFn } from "@/lib/expenses.functions";
import type { ExpenseCategory } from "@/lib/types";
import { expenseCategoryLabel } from "@/lib/types";
import { toast } from "sonner";

export function ExpenseFormSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: properties = [] } = useQuery(propertiesQuery(""));

  const [propertyId, setPropertyId] = useState<string>("");
  const [category, setCategory] = useState<ExpenseCategory>("maintenance");
  const [amount, setAmount] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [vendor, setVendor] = useState<string>("");
  const [expenseDate, setExpenseDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState<string>("");

  const mutation = useMutation({
    mutationFn: async () => {
      const numAmount = parseFloat(amount);
      if (!numAmount || numAmount <= 0) throw new Error("يرجى إدخال مبلغ المصروف");
      if (!description.trim()) throw new Error("يرجى كتابة بيان المصروف");

      return await createExpenseFn({
        data: {
          propertyId: propertyId || null,
          unitId: null,
          category,
          amount: numAmount,
          description: description.trim(),
          expenseDate,
          vendor: vendor.trim(),
          notes: notes.trim(),
        },
      });
    },
    onSuccess: () => {
      toast.success("تم تسجيل المصروف بنجاح");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      onOpenChange(false);
      setAmount("");
      setDescription("");
    },
    onError: (err: Error) => {
      toast.error(err.message || "حدث خطأ أثناء حفظ المصروف");
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl bg-background p-6 shadow-2xl animate-sheet border border-stone-line/80 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-stone-line">
          <div className="flex items-center gap-2.5">
            <div className="grid size-10 place-items-center rounded-2xl bg-destructive/10 text-destructive">
              <Receipt className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">إضافة مصروف جديد</h2>
              <p className="text-xs text-muted-foreground">صيانة، كهرباء، مياه، خدمات، رسوم...</p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground">بيان المصروف *</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="مثال: فاتورة كهرباء العمومية / تصليح المصعد"
              className="w-full h-12 rounded-2xl border border-stone-line bg-card px-4 text-sm font-bold placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">المبلغ (ر.س) *</label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="450"
                className="w-full h-12 rounded-2xl border border-stone-line bg-card px-4 text-sm font-bold tabular focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">التصنيف</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
                className="w-full h-12 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              >
                {(["maintenance", "electricity", "water", "cleaning", "services", "fees", "other"] as const).map((c) => (
                  <option key={c} value={c}>
                    {expenseCategoryLabel(c)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">مرتبط بعقار (اختياري)</label>
              <select
                value={propertyId}
                onChange={(e) => setPropertyId(e.target.value)}
                className="w-full h-11 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">عقار عام / بدون تخصيص</option>
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">تاريخ المصروف</label>
              <input
                type="date"
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full h-11 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground">المورد / الفني / الجهة</label>
            <input
              type="text"
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              placeholder="شركة الكهرباء / سباك..."
              className="w-full h-11 rounded-2xl border border-stone-line bg-card px-4 text-xs font-medium focus:border-primary focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full h-12 rounded-2xl bg-destructive text-destructive-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
          >
            <Check className="size-4" />
            {mutation.isPending ? "جارِ الحفظ..." : "تسجيل المصروف"}
          </button>
        </div>
      </div>
    </div>
  );
}
