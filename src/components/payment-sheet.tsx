import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, DollarSign, CheckCircle2, AlertTriangle, Building2, User } from "lucide-react";
import { duesQuery } from "@/lib/dues.queries";
import { createPaymentFn } from "@/lib/payments.functions";
import { toArabicDigits, paymentMethodLabel } from "@/lib/types";
import { toast } from "sonner";

export function PaymentSheet({
  open,
  onOpenChange,
  defaultDueId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultDueId?: string;
}) {
  const queryClient = useQueryClient();
  const { data: dues = [], isLoading } = useQuery(duesQuery({ status: "pending" }));
  const [selectedDueId, setSelectedDueId] = useState<string>(defaultDueId || "");
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState<"transfer" | "cash" | "card" | "cheque" | "other">("transfer");
  const [notes, setNotes] = useState<string>("");

  useEffect(() => {
    if (defaultDueId) {
      setSelectedDueId(defaultDueId);
      const d = dues.find((item) => item.id === defaultDueId);
      if (d) setAmount(String(d.amount - d.paidAmount));
    }
  }, [defaultDueId, dues]);

  const selectedDue = dues.find((d) => d.id === selectedDueId);
  const remaining = selectedDue ? selectedDue.amount - selectedDue.paidAmount : 0;
  const numericAmount = parseFloat(amount) || 0;
  const isExcessAmount = selectedDue && numericAmount > remaining && remaining > 0;

  const isValid = Boolean(selectedDue && numericAmount > 0);

  const mutation = useMutation({
    mutationFn: async () => {
      if (!selectedDue) throw new Error("يرجى اختيار المستأجر والاستحقاق المراد سداده");
      if (!numericAmount || numericAmount <= 0) throw new Error("يرجى إدخال مبلغ سداد صحيح أكبر من 0");

      return await createPaymentFn({
        data: {
          dueId: selectedDue.id,
          contractId: selectedDue.contractId,
          tenantId: selectedDue.tenantId || "",
          amount: numericAmount,
          paymentMethod: method,
          notes,
        },
      });
    },
    onSuccess: (res) => {
      toast.success(`تم تسجيل عملية السداد بنجاح! سند رقم: ${res.receipt_number}`);
      queryClient.invalidateQueries({ queryKey: ["dues"] });
      queryClient.invalidateQueries({ queryKey: ["payments"] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      onOpenChange(false);
      setSelectedDueId("");
      setAmount("");
      setNotes("");
    },
    onError: (err: Error) => {
      toast.error(err.message || "حدث خطأ أثناء تسجيل السداد");
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl bg-background p-6 shadow-2xl animate-sheet border border-stone-line/80 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-stone-line">
          <div className="flex items-center gap-2.5">
            <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <DollarSign className="size-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold">تسجيل سداد / تحصيل</h2>
              <p className="text-xs text-muted-foreground">تحصيل الدفعات وإصدار سندات القبض</p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          {/* Tenant Picker */}
          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground">اختر المستأجر الاستحقاق</label>
            {isLoading ? (
              <p className="text-xs text-muted-foreground">جارِ تحميل المستأجرين والاستحقاقات...</p>
            ) : dues.length === 0 ? (
              <div className="rounded-2xl bg-muted/60 p-4 text-center text-xs text-muted-foreground">
                لا توجد استحقاقات معلقة حالياً للسداد
              </div>
            ) : (
              <select
                value={selectedDueId}
                onChange={(e) => {
                  const id = e.target.value;
                  setSelectedDueId(id);
                  const d = dues.find((item) => item.id === id);
                  if (d) {
                    setAmount(String(d.amount - d.paidAmount));
                  } else {
                    setAmount("");
                  }
                }}
                className="w-full h-12 rounded-2xl border border-stone-line bg-card px-4 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
              >
                <option value="">اختر المستأجر...</option>
                {dues.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.tenantName || "مستأجر"} ({toArabicDigits(d.amount - d.paidAmount)} ر.س)
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Selected Due Details Card */}
          {selectedDue && (
            <div className="rounded-2xl bg-gold-soft/50 border border-primary/30 p-4 text-xs space-y-2 animate-fade-in shadow-sm">
              <div className="flex items-center justify-between font-bold text-foreground">
                <span className="flex items-center gap-1.5 text-primary">
                  <User className="size-4" /> المستأجر:
                </span>
                <span className="text-sm">{selectedDue.tenantName || "غير محدد"}</span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground pt-1 border-t border-primary/10">
                <span className="flex items-center gap-1.5">
                  <Building2 className="size-3.5" /> العقار والوحدة:
                </span>
                <span className="font-semibold text-foreground">{selectedDue.propertyName} — وحدة {selectedDue.unitNumber}</span>
              </div>
              <div className="flex items-center justify-between font-extrabold text-primary pt-1.5 border-t border-primary/15">
                <span>المبلغ المستحق المتبقي:</span>
                <span className="text-base tabular">{toArabicDigits(remaining)} ر.س</span>
              </div>
            </div>
          )}

          {/* Amount Field */}
          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground">مبلغ التحصيل السداد (ر.س)</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={remaining ? String(remaining) : "أدخل المبلغ..."}
              className="w-full h-12 rounded-2xl border border-stone-line bg-card px-4 text-base font-bold tabular placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Excess Amount Callout Warning */}
          {isExcessAmount && (
            <div className="rounded-2xl bg-amber-500/10 border border-amber-500/30 p-3.5 text-xs text-amber-700 dark:text-amber-400 flex items-start gap-2.5 animate-fade-in">
              <AlertTriangle className="size-5 shrink-0 text-amber-500 mt-0.5" />
              <div>
                <p className="font-bold">تنبيه: المبلغ أكبر من القسط المستحق!</p>
                <p className="mt-0.5 text-[11px] opacity-90">
                  المبلغ المدخل ({toArabicDigits(numericAmount)} ر.س) يتجاوز القسط الحالي ({toArabicDigits(remaining)} ر.س). سيتم قبول العملية وتسجيل الزيادة كدفعة مقدماً.
                </p>
              </div>
            </div>
          )}

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground">طريقة الدفع</label>
            <div className="grid grid-cols-3 gap-2">
              {(["transfer", "cash", "card", "cheque", "other"] as const).map((m) => (
                <button
                  type="button"
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`h-11 rounded-xl text-xs font-bold transition border ${
                    method === m
                      ? "border-primary bg-primary text-primary-foreground shadow-sm"
                      : "border-stone-line bg-card text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {paymentMethodLabel(m)}
                </button>
              ))}
            </div>
          </div>

          {/* Notes / Receipt Ref */}
          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground">ملاحظات / رقم المرجع بالحوالة</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="مثال: تحويل بنكي حساب الراجحي..."
              className="w-full h-11 rounded-2xl border border-stone-line bg-card px-4 text-xs font-medium placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          {/* Full-width Footer Submit Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={!isValid || mutation.isPending}
              className="w-full h-13 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-40 disabled:cursor-not-allowed active:scale-95 transition"
            >
              <CheckCircle2 className="size-5" />
              {mutation.isPending ? "جاري إصدار السند..." : "تأكيد التحصيل وإصدار سند القبض"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
