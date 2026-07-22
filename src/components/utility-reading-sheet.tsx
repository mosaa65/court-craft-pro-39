import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Zap, Check, MessageCircle } from "lucide-react";
import { unitsQuery } from "@/lib/units.queries";
import { createUtilityReadingFn } from "@/lib/utilities.functions";
import type { UtilityType } from "@/lib/types";
import { openWhatsApp, openSMS } from "@/lib/types";
import { toast } from "sonner";

export function UtilityReadingSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: units = [] } = useQuery(unitsQuery({ search: "" }));

  const [unitId, setUnitId] = useState<string>(units[0]?.id || "");
  const [type, setType] = useState<UtilityType>("electricity");
  const [previousReading, setPreviousReading] = useState<string>("0");
  const [currentReading, setCurrentReading] = useState<string>("");
  const [pricePerUnit, setPricePerUnit] = useState<string>("0.18"); // tariff rate per kWh or m3
  const [readingDate, setReadingDate] = useState<string>(new Date().toISOString().split("T")[0]);

  const prev = parseFloat(previousReading) || 0;
  const curr = parseFloat(currentReading) || 0;
  const price = parseFloat(pricePerUnit) || 0;
  const consumed = Math.max(0, curr - prev);
  const totalAmount = Math.round(consumed * price * 100) / 100;

  const selectedUnit = units.find((u) => u.id === (unitId || units[0]?.id));

  const mutation = useMutation({
    mutationFn: async () => {
      const targetUnitId = unitId || units[0]?.id;
      if (!targetUnitId) throw new Error("اختر الوحدة");
      if (curr <= 0) throw new Error("أدخل القراءة الحالية");

      return await createUtilityReadingFn({
        data: {
          unitId: targetUnitId,
          type,
          previousReading: prev,
          currentReading: curr,
          pricePerUnit: price,
          readingDate,
          billedToTenant: true,
          notes: `استهلاك ${consumed} وحدات`,
        },
      });
    },
    onSuccess: () => {
      toast.success(`تم حفظ القراءة وحساب المستحق: ${totalAmount} ر.س`);
      queryClient.invalidateQueries({ queryKey: ["utilities"] });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "حدث خطأ أثناء الحفظ");
    },
  });

  if (!open) return null;

  const handleSendBillToTenant = () => {
    if (!selectedUnit) return;
    const msg = `مرحباً عزيزنا المستأجر في الوحدة (${selectedUnit.unitNumber})، تم تسجيل قراءة عداد ${type === "electricity" ? "الكهرباء" : "المياه"}.\n- القراءة السابقة: ${prev}\n- القراءة الحالية: ${curr}\n- الاستهلاك: ${consumed}\n- الإجمالي المستحق: ${totalAmount} ر.س.`;
    openWhatsApp("", msg);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl bg-background p-6 shadow-2xl animate-sheet border border-stone-line/80 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-stone-line">
          <div className="flex items-center gap-2.5">
            <div className="grid size-10 place-items-center rounded-2xl bg-amber-500/10 text-amber-600">
              <Zap className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">قراءة العداد والحساب (كهرباء / مياه)</h2>
              <p className="text-xs text-muted-foreground">حساب استهلاك العداد تلقائياً وإخطار المستأجر</p>
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
            <label className="block text-xs font-bold mb-1.5 text-foreground">اختر الوحدة والعداد</label>
            <select
              value={unitId || units[0]?.id || ""}
              onChange={(e) => setUnitId(e.target.value)}
              className="w-full h-12 rounded-2xl border border-stone-line bg-card px-3 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.propertyName} — وحدة {u.unitNumber}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">نوع العداد</label>
              <select
                value={type}
                onChange={(e) => {
                  const t = e.target.value as UtilityType;
                  setType(t);
                  setPricePerUnit(t === "electricity" ? "0.18" : "6.0");
                }}
                className="w-full h-12 rounded-2xl border border-stone-line bg-card px-3 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
              >
                <option value="electricity">كهرباء (كيلوواط)</option>
                <option value="water">مياه (متر مكعب)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">تاريخ القراءة</label>
              <input
                type="date"
                value={readingDate}
                onChange={(e) => setReadingDate(e.target.value)}
                className="w-full h-12 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">القراءة السابقة</label>
              <input
                type="number"
                value={previousReading}
                onChange={(e) => setPreviousReading(e.target.value)}
                placeholder="1000"
                className="w-full h-11 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">القراءة الحالية *</label>
              <input
                type="number"
                value={currentReading}
                onChange={(e) => setCurrentReading(e.target.value)}
                placeholder="1450"
                className="w-full h-11 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">سعر التعريفة</label>
              <input
                type="number"
                step="0.01"
                value={pricePerUnit}
                onChange={(e) => setPricePerUnit(e.target.value)}
                placeholder="0.18"
                className="w-full h-11 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="rounded-2xl bg-amber-500/10 border border-amber-500/20 p-4 text-xs space-y-2">
            <div className="flex justify-between font-bold text-foreground">
              <span>كمية الاستهلاك:</span>
              <span className="tabular">{consumed} {type === "electricity" ? "ك.و.س" : "م³"}</span>
            </div>
            <div className="flex justify-between font-bold text-amber-600 text-sm border-t border-amber-500/15 pt-2">
              <span>المبلغ المستحق:</span>
              <span className="tabular text-base">{totalAmount.toLocaleString("ar-SA")} ر.س</span>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={() => mutation.mutate()}
              disabled={mutation.isPending}
              className="flex-1 h-12 rounded-2xl bg-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
            >
              <Check className="size-4" />
              {mutation.isPending ? "جارِ الحفظ..." : "حفظ القراءة"}
            </button>
            <button
              type="button"
              onClick={handleSendBillToTenant}
              className="h-12 px-3 rounded-2xl bg-emerald-500/10 text-emerald-600 font-bold text-xs flex items-center gap-1 hover:bg-emerald-500/20 active:scale-95 transition"
            >
              <MessageCircle className="size-4" />
              إرسال فاتورة
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
