import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, Building2, Plus, Check } from "lucide-react";
import { createPropertyFn, updatePropertyFn } from "@/lib/properties.functions";
import type { Property, PropertyType } from "@/lib/types";
import { propertyTypeLabel } from "@/lib/types";
import { toast } from "sonner";

export function PropertyFormSheet({
  open,
  onOpenChange,
  property,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  property?: Property | null;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(property?.name || "");
  const [type, setType] = useState<PropertyType>(property?.type || "building");
  const [city, setCity] = useState(property?.city || "الرياض");
  const [district, setDistrict] = useState(property?.district || "");
  const [floorsCount, setFloorsCount] = useState<string>(String(property?.floorsCount || 1));
  const [totalArea, setTotalArea] = useState<string>(String(property?.totalArea || ""));
  const [imageUrl, setImageUrl] = useState(property?.imageUrl || "");
  const [description, setDescription] = useState(property?.description || "");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("يرجى إدخال اسم العقار");
      if (property?.id) {
        return await updatePropertyFn({
          data: {
            id: property.id,
            name: name.trim(),
            type,
            city: city.trim(),
            district: district.trim(),
            floorsCount: parseInt(floorsCount) || 1,
            totalArea: parseFloat(totalArea) || 0,
            imageUrl: imageUrl.trim() || null,
            description: description.trim(),
            amenities: property.amenities || [],
            status: property.status || "active",
          },
        });
      } else {
        return await createPropertyFn({
          data: {
            name: name.trim(),
            type,
            city: city.trim(),
            district: district.trim(),
            floorsCount: parseInt(floorsCount) || 1,
            totalArea: parseFloat(totalArea) || 0,
            imageUrl: imageUrl.trim() || null,
            description: description.trim(),
            amenities: [],
            status: "active",
          },
        });
      }
    },
    onSuccess: () => {
      toast.success(property?.id ? "تم تحديث بيانات العقار" : "تم إضافة العقار بنجاح");
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "حدث خطأ أثناء حفظ العقار");
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-[500px] rounded-t-3xl sm:rounded-3xl bg-background p-6 shadow-2xl animate-sheet border border-stone-line/80 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-stone-line">
          <div className="flex items-center gap-2.5">
            <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Building2 className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{property?.id ? "تعديل عقار" : "إضافة عقار جديد"}</h2>
              <p className="text-xs text-muted-foreground">أدخل تفاصيل وموقع العقار</p>
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
            <label className="block text-xs font-bold mb-1.5 text-foreground">اسم العقار *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: برج الياسمين / مجمع الربيع"
              className="w-full h-12 rounded-2xl border border-stone-line bg-card px-4 text-sm font-bold placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">نوع العقار</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PropertyType)}
                className="w-full h-12 rounded-2xl border border-stone-line bg-card px-3 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
              >
                {(["building", "villa", "apartment_complex", "commercial", "land"] as const).map((t) => (
                  <option key={t} value={t}>
                    {propertyTypeLabel(t)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">المدينة</label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="الرياض"
                className="w-full h-12 rounded-2xl border border-stone-line bg-card px-4 text-sm font-bold placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">الحي</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="حطين"
                className="w-full h-11 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">الطوابق</label>
              <input
                type="number"
                value={floorsCount}
                onChange={(e) => setFloorsCount(e.target.value)}
                className="w-full h-11 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">المساحة (م²)</label>
              <input
                type="number"
                value={totalArea}
                onChange={(e) => setTotalArea(e.target.value)}
                placeholder="450"
                className="w-full h-11 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground">رابط صورة العقار (اختياري)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://..."
              className="w-full h-11 rounded-2xl border border-stone-line bg-card px-4 text-xs font-medium focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground">الوصف والملاحظات</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="تفاصيل الإدارة أو المرافق..."
              className="w-full rounded-2xl border border-stone-line bg-card p-3 text-xs font-medium focus:border-primary focus:outline-none"
            />
          </div>

          <button
            type="button"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
          >
            <Check className="size-4" />
            {mutation.isPending ? "جارِ الحفظ..." : property?.id ? "حفظ التعديلات" : "إضافة العقار"}
          </button>
        </div>
      </div>
    </div>
  );
}
