import { useState } from "react";
import { X, Filter, Building2, User, RefreshCw } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { propertiesQuery } from "@/lib/properties.queries";
import { tenantsQuery } from "@/lib/tenants.queries";

export function AdvancedFilterSheet({
  open,
  onOpenChange,
  propertyId,
  tenantId,
  onApply,
  onReset,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  propertyId: string;
  tenantId: string;
  onApply: (filters: { propertyId: string; tenantId: string }) => void;
  onReset: () => void;
}) {
  const { data: properties = [] } = useQuery(propertiesQuery(""));
  const { data: tenants = [] } = useQuery(tenantsQuery(""));

  const [selectedProperty, setSelectedProperty] = useState(propertyId);
  const [selectedTenant, setSelectedTenant] = useState(tenantId);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-[440px] rounded-t-3xl sm:rounded-3xl bg-background p-6 shadow-2xl animate-sheet border border-stone-line/80 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-stone-line">
          <div className="flex items-center gap-2.5">
            <div className="grid size-10 place-items-center rounded-2xl bg-ink text-white">
              <Filter className="size-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">التصفية والفلاتر المتقدمة</h2>
              <p className="text-xs text-muted-foreground">تخصيص العرض بحسب العقار والمستأجر</p>
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
          {/* Property Filter */}
          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground flex items-center gap-1.5">
              <Building2 className="size-3.5 text-primary" /> تصفية حسب العقار:
            </label>
            <select
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="w-full h-12 rounded-2xl border border-stone-line bg-card px-4 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">جميع العقارات</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.city})
                </option>
              ))}
            </select>
          </div>

          {/* Tenant Filter */}
          <div>
            <label className="block text-xs font-bold mb-1.5 text-foreground flex items-center gap-1.5">
              <User className="size-3.5 text-primary" /> تصفية حسب المستأجر:
            </label>
            <select
              value={selectedTenant}
              onChange={(e) => setSelectedTenant(e.target.value)}
              className="w-full h-12 rounded-2xl border border-stone-line bg-card px-4 text-sm font-bold text-foreground focus:border-primary focus:outline-none"
            >
              <option value="">جميع المستأجرين</option>
              {tenants.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-3 border-t border-stone-line">
            <button
              onClick={() => {
                onApply({ propertyId: selectedProperty, tenantId: selectedTenant });
                onOpenChange(false);
              }}
              className="flex-1 h-12 rounded-2xl bg-ink text-white font-bold text-xs flex items-center justify-center gap-2 shadow active:scale-95 transition"
            >
              تطبيق الفلترة المحددة
            </button>
            <button
              onClick={() => {
                setSelectedProperty("");
                setSelectedTenant("");
                onReset();
                onOpenChange(false);
              }}
              className="h-12 px-4 rounded-2xl bg-muted text-muted-foreground hover:text-foreground font-bold text-xs flex items-center gap-1.5 transition"
            >
              <RefreshCw className="size-3.5" /> إعادة ضبط
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
