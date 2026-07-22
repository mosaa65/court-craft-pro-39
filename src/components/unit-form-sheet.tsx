import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Home, Check } from "lucide-react";
import { propertiesQuery } from "@/lib/properties.queries";
import { createUnitFn, updateUnitFn } from "@/lib/units.functions";
import type { Unit, UnitType, FurnishedType, UnitStatus } from "@/lib/types";
import { unitTypeLabel, unitStatusMeta } from "@/lib/types";
import { toast } from "sonner";

export function UnitFormSheet({
  open,
  onOpenChange,
  propertyId,
  unit,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId?: string;
  unit?: Unit | null;
}) {
  const queryClient = useQueryClient();
  const { data: properties = [] } = useQuery(propertiesQuery(""));

  const [selectedPropertyId, setSelectedPropertyId] = useState(unit?.propertyId || propertyId || "");
  const [unitNumber, setUnitNumber] = useState(unit?.unitNumber || "");
  const [type, setType] = useState<UnitType>(unit?.type || "apartment");
  const [floor, setFloor] = useState<string>(String(unit?.floor || 1));
  const [area, setArea] = useState<string>(String(unit?.area || ""));
  const [rooms, setRooms] = useState<string>(String(unit?.rooms || 2));
  const [bathrooms, setBathrooms] = useState<string>(String(unit?.bathrooms || 1));
  const [furnished, setFurnished] = useState<FurnishedType>(unit?.furnished || "unfurnished");
  const [rentPrice, setRentPrice] = useState<string>(String(unit?.rentPrice || ""));
  const [depositAmount, setDepositAmount] = useState<string>(String(unit?.depositAmount || ""));
  const [status, setStatus] = useState<UnitStatus>(unit?.status || "available");

  const mutation = useMutation({
    mutationFn: async () => {
      const propId = selectedPropertyId || properties[0]?.id;
      if (!propId) throw new Error("يرجى اختيار العقار التابع له الوحدة");
      if (!unitNumber.trim()) throw new Error("رقم الوحدة مطلوب");

      if (unit?.id) {
        return await updateUnitFn({
          data: {
            id: unit.id,
            propertyId: propId,
            unitNumber: unitNumber.trim(),
            type,
            floor: parseInt(floor) || 0,
            area: parseFloat(area) || 0,
            rooms: parseInt(rooms) || 1,
            bathrooms: parseInt(bathrooms) || 1,
            furnished,
            rentPrice: parseFloat(rentPrice) || 0,
            depositAmount: parseFloat(depositAmount) || 0,
            status,
          },
        });
      } else {
        return await createUnitFn({
          data: {
            propertyId: propId,
            unitNumber: unitNumber.trim(),
            type,
            floor: parseInt(floor) || 0,
            area: parseFloat(area) || 0,
            rooms: parseInt(rooms) || 1,
            bathrooms: parseInt(bathrooms) || 1,
            furnished,
            rentPrice: parseFloat(rentPrice) || 0,
            depositAmount: parseFloat(depositAmount) || 0,
            status,
          },
        });
      }
    },
    onSuccess: () => {
      toast.success(unit?.id ? "تم تحديث بيانات الوحدة" : "تم إضافة الوحدة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["units"] });
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "حدث خطأ أثناء حفظ الوحدة");
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl bg-background p-6 shadow-2xl animate-sheet border border-stone-line/80 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-stone-line">
          <div className="flex items-center gap-2.5">
            <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Home className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{unit?.id ? "تعديل وحدة" : "إضافة وحدة جديدة"}</h2>
              <p className="text-xs text-muted-foreground">تفاصيل ورقم الوحدة وسعر الإيجار</p>
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
            <label className="block text-xs font-bold mb-1.5 text-foreground">العقار التابع له *</label>
            <select
              value={selectedPropertyId || properties[0]?.id || ""}
              onChange={(e) => setSelectedPropertyId(e.target.value)}
              className="w-full h-12 rounded-2xl border border-stone-line bg-card px-3 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
            >
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.city})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">رقم الوحدة *</label>
              <input
                type="text"
                value={unitNumber}
                onChange={(e) => setUnitNumber(e.target.value)}
                placeholder="مثال: A-101 / شقة ١٢"
                className="w-full h-12 rounded-2xl border border-stone-line bg-card px-4 text-sm font-bold placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">نوع الوحدة</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as UnitType)}
                className="w-full h-12 rounded-2xl border border-stone-line bg-card px-3 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
              >
                {(["apartment", "shop", "office", "studio", "villa", "floor", "room"] as const).map((t) => (
                  <option key={t} value={t}>
                    {unitTypeLabel(t)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">الطابق</label>
              <input
                type="number"
                value={floor}
                onChange={(e) => setFloor(e.target.value)}
                className="w-full h-11 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">الغرف</label>
              <input
                type="number"
                value={rooms}
                onChange={(e) => setRooms(e.target.value)}
                className="w-full h-11 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">دورات المياه</label>
              <input
                type="number"
                value={bathrooms}
                onChange={(e) => setBathrooms(e.target.value)}
                className="w-full h-11 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">المساحة (م²)</label>
              <input
                type="number"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="120"
                className="w-full h-11 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">التأثيث</label>
              <select
                value={furnished}
                onChange={(e) => setFurnished(e.target.value as FurnishedType)}
                className="w-full h-11 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              >
                <option value="unfurnished">غير مفروشة</option>
                <option value="semi_furnished">شبه مفروشة</option>
                <option value="furnished">مفروشة بالكامل</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">سعر الإيجار السنوي/الشهري (ر.س) *</label>
              <input
                type="number"
                value={rentPrice}
                onChange={(e) => setRentPrice(e.target.value)}
                placeholder="35000"
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
            <label className="block text-xs font-bold mb-1.5 text-foreground">حالة الوحدة</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as UnitStatus)}
              className="w-full h-11 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
            >
              {(["available", "reserved", "rented", "under_maintenance", "unavailable"] as const).map((s) => (
                <option key={s} value={s}>
                  {unitStatusMeta(s).label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
          >
            <Check className="size-4" />
            {mutation.isPending ? "جارِ الحفظ..." : unit?.id ? "حفظ التعديلات" : "إضافة الوحدة"}
          </button>
        </div>
      </div>
    </div>
  );
}
