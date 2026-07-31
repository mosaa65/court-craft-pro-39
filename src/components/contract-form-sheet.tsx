import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, FileText, Check, Calendar } from "lucide-react";
import { unitsQuery } from "@/lib/units.queries";
import { tenantsQuery } from "@/lib/tenants.queries";
import { createContractFn } from "@/lib/contracts.functions";
import type { PaymentCycle, PaymentTiming } from "@/lib/types";
import { paymentCycleLabel } from "@/lib/types";
import { toast } from "sonner";

export function ContractFormSheet({
  open,
  onOpenChange,
  defaultUnitId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultUnitId?: string;
}) {
  const queryClient = useQueryClient();
  const { data: availableUnits = [] } = useQuery(unitsQuery({ search: "" }));
  const { data: tenants = [] } = useQuery(tenantsQuery(""));

  const filteredUnits = availableUnits.filter((u) => u.status === "available" || u.id === defaultUnitId);

  const [tenantId, setTenantId] = useState<string>(tenants[0]?.id || "");
  const [unitId, setUnitId] = useState<string>(defaultUnitId || filteredUnits[0]?.id || "");

  const today = new Date().toISOString().split("T")[0];
  const nextYear = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(nextYear);
  const [durationMonths, setDurationMonths] = useState<string>("12");
  const [rentAmount, setRentAmount] = useState<string>("");
  const [depositAmount, setDepositAmount] = useState<string>("");
  const [paymentCycle, setPaymentCycle] = useState<PaymentCycle>("monthly");
  const [paymentTiming, setPaymentTiming] = useState<PaymentTiming>("advance");
  const [notes, setNotes] = useState<string>("");

  const selectedUnit = availableUnits.find((u) => u.id === (unitId || defaultUnitId));

  const mutation = useMutation({
    mutationFn: async () => {
      const selectedTenant = tenantId || tenants[0]?.id;
      const targetUnitId = unitId || defaultUnitId || filteredUnits[0]?.id;

      if (!selectedTenant) throw new Error("يرجى اختيار أو إضافة مستأجر أولاً");
      if (!targetUnitId) throw new Error("يرجى اختيار الوحدة المراد تأجيرها");

      const rent = parseFloat(rentAmount) || selectedUnit?.rentPrice || 0;
      if (rent <= 0) throw new Error("يرجى إدخال قيمة الإيجار");

      return await createContractFn({
        data: {
          tenantId: selectedTenant,
          unitId: targetUnitId,
          startDate,
          endDate,
          durationMonths: parseInt(durationMonths) || 12,
          rentAmount: rent,
          depositAmount: parseFloat(depositAmount) || 0,
          paymentCycle,
          paymentTiming,
          notes,
        },
      });
    },
    onSuccess: (res) => {
      toast.success(`تم إنشاء العقد بنجاح رقم: ${res.contract_number}`);
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
      queryClient.invalidateQueries({ queryKey: ["dues"] });
      queryClient.invalidateQueries({ queryKey: ["units"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "حدث خطأ أثناء إبرام العقد");
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-[520px] rounded-t-3xl sm:rounded-3xl bg-background p-6 shadow-2xl animate-sheet border border-stone-line/80 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-stone-line">
          <div className="flex items-center gap-2.5">
            <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
              <FileText className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">إبرام عقد إيجار جديد</h2>
              <p className="text-xs text-muted-foreground">ربط المستأجر بالوحدة وتوليد جدول الاستحقاقات تلقائياً</p>
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
            <label className="block text-xs font-bold mb-1.5 text-foreground">المستأجر *</label>
            {tenants.length === 0 ? (
              <p className="text-xs text-destructive">لا يوجد مستأجرون مسجلون. يرجى إضافة مستأجر أولاً من الإدارة.</p>
            ) : (
              <select
                value={tenantId || tenants[0]?.id || ""}
                onChange={(e) => setTenantId(e.target.value)}
                className="w-full h-12 rounded-2xl border border-stone-line bg-card px-3 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
              >
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.phone || "بدون جوال"})
                  </option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground">الوحدة المتاحة للتأجير *</label>
            {filteredUnits.length === 0 ? (
              <p className="text-xs text-destructive">لا توجد وحدات متاحة حالياً للتأجير.</p>
            ) : (
              <select
                value={unitId || defaultUnitId || filteredUnits[0]?.id || ""}
                onChange={(e) => {
                  setUnitId(e.target.value);
                  const u = availableUnits.find((item) => item.id === e.target.value);
                  if (u) setRentAmount(String(u.rentPrice));
                }}
                className="w-full h-12 rounded-2xl border border-stone-line bg-card px-3 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
              >
                {filteredUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.propertyName} — وحدة {u.unitNumber} ({u.rentPrice} ر.س)
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">تاريخ بداية العقد</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full h-12 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">تاريخ نهاية العقد</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full h-12 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">إجمالي مبلغ الإيجار (ر.س) *</label>
              <input
                type="number"
                value={rentAmount}
                onChange={(e) => setRentAmount(e.target.value)}
                placeholder={selectedUnit ? String(selectedUnit.rentPrice) : "35000"}
                className="w-full h-12 rounded-2xl border border-stone-line bg-card px-4 text-sm font-bold tabular focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">مبلغ التأمين (ر.س)</label>
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="2000"
                className="w-full h-12 rounded-2xl border border-stone-line bg-card px-4 text-sm font-bold tabular focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground">دورية السداد (جدولة الدفعات)</label>
            <select
              value={paymentCycle}
              onChange={(e) => setPaymentCycle(e.target.value as PaymentCycle)}
              className="w-full h-12 rounded-2xl border border-stone-line bg-card px-3 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
            >
              {(["monthly", "quarterly", "semi_annual", "annual"] as const).map((pc) => (
                <option key={pc} value={pc}>
                  {paymentCycleLabel(pc)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground">ملاحظات العقد</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="شروط خاصة، التجديد التلقائي..."
              className="w-full rounded-2xl border border-stone-line bg-card p-3 text-xs font-medium focus:border-primary focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending || tenants.length === 0 || filteredUnits.length === 0}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 active:scale-95 transition"
          >
            <Check className="size-4" />
            {mutation.isPending ? "جارِ إبرام العقد وتوليد الاستحقاقات..." : "إبرام العقد وتوليد الدفعات"}
          </button>
        </div>
      </div>
    </div>
  );
}
