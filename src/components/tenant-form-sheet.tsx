import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { X, User, Check } from "lucide-react";
import { createTenantFn, updateTenantFn } from "@/lib/tenants.functions";
import type { Tenant } from "@/lib/types";
import { toast } from "sonner";

export function TenantFormSheet({
  open,
  onOpenChange,
  tenant,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant?: Tenant | null;
}) {
  const queryClient = useQueryClient();
  const [name, setName] = useState(tenant?.name || "");
  const [phone, setPhone] = useState(tenant?.phone || "");
  const [email, setEmail] = useState(tenant?.email || "");
  const [idNumber, setIdNumber] = useState(tenant?.idNumber || "");
  const [idType, setIdType] = useState(tenant?.idType || "national_id");
  const [address, setAddress] = useState(tenant?.address || "");
  const [notes, setNotes] = useState(tenant?.notes || "");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!name.trim()) throw new Error("اسم المستأجر مطلوب");
      if (tenant?.id) {
        return await updateTenantFn({
          data: {
            id: tenant.id,
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            idNumber: idNumber.trim(),
            idType,
            address: address.trim(),
            nationality: tenant.nationality || "",
            emergencyContact: tenant.emergencyContact || "",
            emergencyPhone: tenant.emergencyPhone || "",
            notes: notes.trim(),
          },
        });
      } else {
        return await createTenantFn({
          data: {
            name: name.trim(),
            phone: phone.trim(),
            email: email.trim(),
            idNumber: idNumber.trim(),
            idType,
            address: address.trim(),
            nationality: "",
            emergencyContact: "",
            emergencyPhone: "",
            notes: notes.trim(),
          },
        });
      }
    },
    onSuccess: () => {
      toast.success(tenant?.id ? "تم تحديث بيانات المستأجر" : "تم إضافة المستأجر بنجاح");
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      onOpenChange(false);
    },
    onError: (err: Error) => {
      toast.error(err.message || "حدث خطأ أثناء الحفظ");
    },
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-0 sm:p-4">
      <div className="w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl bg-background p-6 shadow-2xl animate-sheet border border-stone-line/80 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-stone-line">
          <div className="flex items-center gap-2.5">
            <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
              <User className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold">{tenant?.id ? "تعديل بيانات مستأجر" : "إضافة مستأجر جديد"}</h2>
              <p className="text-xs text-muted-foreground">البيانات الشخصية ووسائل التواصل</p>
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
            <label className="block text-xs font-bold mb-1.5 text-foreground">الاسم الكامل *</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثال: عبد الله أحمد القحطاني"
              className="w-full h-12 rounded-2xl border border-stone-line bg-card px-4 text-sm font-bold placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">رقم الجوال *</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="05XXXXXXXX"
                dir="ltr"
                className="w-full h-12 rounded-2xl border border-stone-line bg-card px-4 text-sm font-bold tabular placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">نوع الهوية</label>
              <select
                value={idType}
                onChange={(e) => setIdType(e.target.value)}
                className="w-full h-12 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
              >
                <option value="national_id">هوية وطنية</option>
                <option value="iqama">إقامة</option>
                <option value="passport">جواز سفر</option>
                <option value="commercial_reg">سجل تجاري</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">رقم الهوية / الإقامة</label>
              <input
                type="text"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                placeholder="10XXXXXXXX"
                dir="ltr"
                className="w-full h-11 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold focus:border-primary focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1.5 text-foreground">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@domain.com"
                dir="ltr"
                className="w-full h-11 rounded-2xl border border-stone-line bg-card px-3 text-xs font-bold focus:border-primary focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground">العنوان</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="الرياض، حي النفل..."
              className="w-full h-11 rounded-2xl border border-stone-line bg-card px-4 text-xs font-medium focus:border-primary focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground">ملاحظات</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="أية ملاحظات إضافية..."
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
            {mutation.isPending ? "جارِ الحفظ..." : tenant?.id ? "حفظ التعديلات" : "إضافة المستأجر"}
          </button>
        </div>
      </div>
    </div>
  );
}
