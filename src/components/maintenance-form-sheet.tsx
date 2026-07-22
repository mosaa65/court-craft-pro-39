import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Wrench, Check } from "lucide-react";
import { propertiesQuery } from "@/lib/properties.queries";
import { unitsQuery } from "@/lib/units.queries";
import { createMaintenanceFn } from "@/lib/maintenance.functions";
import type { MaintenancePriority } from "@/lib/types";
import { toast } from "sonner";

export function MaintenanceFormSheet({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: properties = [] } = useQuery(propertiesQuery(""));
  const { data: units = [] } = useQuery(unitsQuery({ search: "" }));

  const [propertyId, setPropertyId] = useState<string>(properties[0]?.id || "");
  const [unitId, setUnitId] = useState<string>(units[0]?.id || "");
  const [title, setTitle] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [priority, setPriority] = useState<MaintenancePriority>("medium");
  const [cost, setCost] = useState<string>("");

  const filteredUnits = units.filter((u) => u.propertyId === (propertyId || properties[0]?.id));

  const mutation = useMutation({
    mutationFn: async () => {
      const propId = propertyId || properties[0]?.id;
      const targetUnitId = unitId || filteredUnits[0]?.id;

      if (!propId || !targetUnitId) throw new Error("اختر العقار والوحدة");
      if (!title.trim()) throw new Error("أدخل عنوان بلاغ الصيانة");

      return await createMaintenanceFn({
        data: {
          propertyId: propId,
          unitId: targetUnitId,
          title: title.trim(),
          description: description.trim(),
          category: "general",
          priority,
          cost: parseFloat(cost) || 0,
          notes: "",
        },
      });
    },
    onSuccess: () => {
      toast.success("تم إرسال طلب الصيانة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["maintenance"] });
      onOpenChange(false);
      setTitle("");
      setDescription("");
      setCost("");
    },
    onError: (err: Error) => {
      toast.error(err.message || "حدث خطأ أثناء رفع البلاغ");
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl bg-background p-6 shadow-2xl animate-sheet border border-stone-line/80 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-stone-line">
          <div className="flex items-center gap-2.5">
            <div className="grid size-10 place-items-center rounded-2xl bg-amber-500/10 text-amber-600">
              <Wrench className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">تسجيل طلب / بلاغ صيانة</h2>
              <p className="text-xs text-muted-foreground">صيانة سباكة، كهرباء، تكييف، عزل...</p>
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
            <label className="block text-xs font-bold mb-1.5 text-foreground">عنوان المشكلة / البلاغ *</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="مثال: تسريب مياه بالحمام الرئيسي / تسريب مكيف"
              className="w-full h-12 rounded-2xl border border-stone-line bg-card px-4 text-sm font-bold placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">العقار</label>
              <select
                value={propertyId || properties[0]?.id || ""}
                onChange={(e) => {
                  setPropertyId(e.target.value);
                  const matching = units.filter((u) => u.propertyId === e.target.value);
                  if (matching.length) setUnitId(matching[0].id);
                }}
                className="w-full h-12 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              >
                {properties.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">الوحدة</label>
              <select
                value={unitId || filteredUnits[0]?.id || ""}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full h-12 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              >
                {filteredUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    وحدة {u.unitNumber}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">الأولوية</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as MaintenancePriority)}
                className="w-full h-11 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              >
                <option value="urgent">طارئة جداً</option>
                <option value="high">عالية</option>
                <option value="medium">متوسطة</option>
                <option value="low">منخفضة</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">التكلفة التقديرية (ر.س)</label>
              <input
                type="number"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="250"
                className="w-full h-11 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground">تفاصيل إضافية</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="وصف العطل بالتفصيل..."
              className="w-full rounded-2xl border border-stone-line bg-card p-3 text-xs font-medium focus:border-primary focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full h-12 rounded-2xl bg-amber-600 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
          >
            <Check className="size-4" />
            {mutation.isPending ? "جارِ الإرسال..." : "إرسال بلاغ الصيانة"}
          </button>
        </div>
      </div>
    </div>
  );
}
