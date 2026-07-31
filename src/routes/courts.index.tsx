import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Plus, ChevronLeft, Building2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { propertiesQuery } from "@/lib/properties.queries";
import { unitsQuery } from "@/lib/units.queries";
import { PropertyFormSheet } from "@/components/property-form-sheet";
import { toArabicDigits, propertyTypeLabel } from "@/lib/types";

export const Route = createFileRoute("/courts/")({
  head: () => ({
    meta: [
      { title: "العقارات — إدارة العقارات المجمعات" },
      { name: "description", content: "قائمة العقارات والعمائر والفلل والمجمعات السكنية والتجارية." },
    ],
  }),
  component: PropertiesPage,
});

function PropertiesPage() {
  const [q, setQ] = useState("");
  const [addOpen, setAddOpen] = useState(false);

  const { data: properties = [], isLoading } = useQuery(propertiesQuery(q));
  const { data: units = [] } = useQuery(unitsQuery({}));

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/85 px-6 pb-4 pt-8 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
              المحفظة العقارية
            </p>
            <h1 className="mt-1 text-xl font-bold tracking-tight">العقارات والعمائر</h1>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-xs font-bold text-white shadow-md active:scale-95 transition"
          >
            <Plus className="size-4" /> عقار جديد
          </button>
        </div>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث باسم العقار، المدينة، أو الحي..."
            className="h-12 w-full rounded-2xl border border-stone-line bg-card px-4 pr-11 text-sm font-medium placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </header>

      <main className="space-y-4 px-5 pt-6">
        {isLoading ? (
          <p className="p-6 text-center text-xs text-muted-foreground">جارِ تحميل العقارات...</p>
        ) : properties.length === 0 ? (
          <div className="card-elev flex flex-col items-center gap-3 p-10 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
              <Building2 className="size-7" />
            </div>
            <p className="text-sm font-bold">لا يوجد عقارات بعد</p>
            <p className="text-xs text-muted-foreground">أضف عقارك الأول لبدء إضافة الوحدات وتأجيرها.</p>
            <button
              onClick={() => setAddOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
            >
              <Plus className="size-3.5" /> إضافة عقار جديد
            </button>
          </div>
        ) : (
          properties.map((p, i) => {
            const propUnits = units.filter((u) => u.propertyId === p.id);
            const rentedCount = propUnits.filter((u) => u.status === "rented").length;
            const availableCount = propUnits.filter((u) => u.status === "available").length;

            return (
              <Link
                to="/courts/$id"
                params={{ id: p.id }}
                key={p.id}
                className="card-elev block overflow-hidden animate-rise transition active:scale-[0.99]"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="relative">
                  {p.imageUrl ? (
                    <img src={p.imageUrl} alt={p.name} loading="lazy" className="aspect-[16/9] w-full object-cover" />
                  ) : (
                    <div className="aspect-[16/9] w-full bg-gradient-to-br from-ink to-stone-800 flex items-center justify-center text-white/40">
                      <Building2 className="size-16" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/20 to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 flex items-end justify-between p-4 text-white">
                    <div>
                      <span className="rounded-full bg-white/85 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-ink">
                        {propertyTypeLabel(p.type)}
                      </span>
                      <h3 className="mt-2 text-lg font-bold leading-tight">{p.name}</h3>
                      <p className="mt-0.5 text-xs text-white/80">
                        {p.city} {p.district ? `• حي ${p.district}` : ""}
                      </p>
                    </div>
                    <div className="text-left">
                      <p className="tabular text-xl font-bold">{toArabicDigits(propUnits.length)}</p>
                      <p className="text-[10px] font-medium text-white/70">وحدة إجمالية</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center">
                  <div className="grid flex-1 grid-cols-3 divide-x divide-stone-line/70 divide-x-reverse">
                    <Stat label="الوحدات المؤجرة" value={toArabicDigits(rentedCount)} />
                    <Stat label="الوحدات المتاحة" value={toArabicDigits(availableCount)} />
                    <Stat label="عدد الطوابق" value={toArabicDigits(p.floorsCount)} />
                  </div>
                  <ChevronLeft className="ml-4 size-4 text-muted-foreground" />
                </div>
              </Link>
            );
          })
        )}
      </main>

      <PropertyFormSheet open={addOpen} onOpenChange={setAddOpen} />
    </AppShell>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-3 py-3 text-center">
      <p className="tabular text-sm font-bold">{value}</p>
      <p className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
    </div>
  );
}
