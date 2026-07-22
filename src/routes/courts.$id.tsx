import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Plus, Building2, Home, Trash2, Edit, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { propertyQuery } from "@/lib/properties.queries";
import { unitsQuery } from "@/lib/units.queries";
import { deletePropertyFn } from "@/lib/properties.functions";
import { deleteUnitFn } from "@/lib/units.functions";
import { UnitFormSheet } from "@/components/unit-form-sheet";
import { PropertyFormSheet } from "@/components/property-form-sheet";
import { ContractFormSheet } from "@/components/contract-form-sheet";
import { toArabicDigits, unitStatusMeta, unitTypeLabel, propertyTypeLabel } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/courts/$id")({
  head: () => ({
    meta: [{ title: "تفاصيل العقار — إدارة الوحدات" }],
  }),
  component: PropertyDetailPage,
});

function PropertyDetailPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: property, isLoading } = useQuery(propertyQuery(id));
  const { data: units = [] } = useQuery(unitsQuery({ propertyId: id }));

  const [addUnitOpen, setAddUnitOpen] = useState(false);
  const [editPropOpen, setEditPropOpen] = useState(false);
  const [contractOpen, setContractOpen] = useState(false);
  const [selectedUnitIdForLease, setSelectedUnitIdForLease] = useState<string>("");

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!confirm("هل أنت تأكد من حذف هذا العقار وجميع وحداته؟")) return;
      await deletePropertyFn({ data: { id } });
    },
    onSuccess: () => {
      toast.success("تم حذف العقار بنجاح");
      queryClient.invalidateQueries({ queryKey: ["properties"] });
      window.history.back();
    },
  });

  const deleteUnitMutation = useMutation({
    mutationFn: async (unitId: string) => {
      if (!confirm("هل أنت تأكد من حذف هذه الوحدة؟")) return;
      await deleteUnitFn({ data: { id: unitId } });
    },
    onSuccess: () => {
      toast.success("تم حذف الوحدة بنجاح");
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="p-8 text-center text-xs text-muted-foreground">جارِ التحميل...</div>
      </AppShell>
    );
  }

  if (!property) {
    return (
      <AppShell>
        <div className="p-8 text-center text-xs text-muted-foreground">العقار غير موجود</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/85 px-6 pb-4 pt-8 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/courts"
              className="grid size-10 place-items-center rounded-full bg-muted text-ink"
            >
              <ArrowRight className="size-4" />
            </Link>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                {propertyTypeLabel(property.type)} • {property.city}
              </p>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight">{property.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setEditPropOpen(true)}
              className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
            >
              <Edit className="size-4" />
            </button>
            <button
              onClick={() => deleteMutation.mutate()}
              className="grid size-9 place-items-center rounded-full bg-destructive/10 text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="space-y-6 px-5 pt-4">
        {/* Banner */}
        <section className="card-elev overflow-hidden">
          {property.imageUrl ? (
            <img src={property.imageUrl} alt={property.name} className="aspect-[16/9] w-full object-cover" />
          ) : (
            <div className="aspect-[16/9] w-full bg-gradient-to-br from-ink to-stone-800 flex items-center justify-center text-white/30">
              <Building2 className="size-16" />
            </div>
          )}
          <div className="p-4 space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">الحي والموقع:</span>
              <span className="font-bold">{property.district || property.city}</span>
            </div>
            <div className="flex justify-between items-center text-xs">
              <span className="text-muted-foreground">عدد الطوابق والمساحة:</span>
              <span className="font-bold">{toArabicDigits(property.floorsCount)} طوابق • {toArabicDigits(property.totalArea)} م²</span>
            </div>
            {property.description && (
              <p className="text-xs text-muted-foreground pt-2 border-t border-stone-line/70">
                {property.description}
              </p>
            )}
          </div>
        </section>

        {/* Units Section Header */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">وحدات العقار ({toArabicDigits(units.length)})</h2>
              <p className="text-xs text-muted-foreground">الشقق، المحلات، والمكاتب المتاحة والمؤجرة</p>
            </div>
            <button
              onClick={() => setAddUnitOpen(true)}
              className="flex items-center gap-1.5 rounded-full bg-primary px-3.5 py-2 text-xs font-bold text-primary-foreground shadow-md active:scale-95 transition"
            >
              <Plus className="size-3.5" /> وحدة جديدة
            </button>
          </div>

          {units.length === 0 ? (
            <div className="card-elev p-8 text-center text-xs text-muted-foreground">
              لا توجد وحدات مضافة بعد في هذا العقار. اضغط زر "وحدة جديدة" لإضافة شقة أو محل.
            </div>
          ) : (
            <div className="space-y-2.5">
              {units.map((u) => {
                const meta = unitStatusMeta(u.status);
                return (
                  <div key={u.id} className="card-elev p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary font-bold text-sm">
                        <Home className="size-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold">وحدة {u.unitNumber}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${meta.tone}`}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {unitTypeLabel(u.type)} • طابق {toArabicDigits(u.floor)} • {toArabicDigits(u.rooms)} غرف
                        </p>
                      </div>
                    </div>

                    <div className="text-left shrink-0 space-y-1">
                      <p className="tabular text-sm font-bold">
                        {toArabicDigits(u.rentPrice)} <span className="text-[10px] text-muted-foreground">ر.س</span>
                      </p>
                      {u.status === "available" ? (
                        <button
                          onClick={() => {
                            setSelectedUnitIdForLease(u.id);
                            setContractOpen(true);
                          }}
                          className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[10px] font-bold text-white shadow"
                        >
                          تأجير الآن
                        </button>
                      ) : (
                        <button
                          onClick={() => deleteUnitMutation.mutate(u.id)}
                          className="text-[10px] font-bold text-destructive hover:underline"
                        >
                          حذف
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <UnitFormSheet open={addUnitOpen} onOpenChange={setAddUnitOpen} propertyId={id} />
      <PropertyFormSheet open={editPropOpen} onOpenChange={setEditPropOpen} property={property} />
      <ContractFormSheet open={contractOpen} onOpenChange={setContractOpen} defaultUnitId={selectedUnitIdForLease} />
    </AppShell>
  );
}
