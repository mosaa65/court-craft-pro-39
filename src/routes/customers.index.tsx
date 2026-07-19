import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Plus, User, Phone, ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { CustomerFormSheet } from "@/components/customer-form-sheet";
import { customersQuery } from "@/lib/customers.queries";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "العملاء — إدارة العملاء الدائمين" },
      { name: "description", content: "قائمة العملاء الدائمين مع البحث والإضافة السريعة." },
    ],
  }),
  component: CustomersPage,
});

function CustomersPage() {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const { data: customers = [], isLoading } = useQuery(customersQuery(search));

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/85 px-6 pb-4 pt-8 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">إدارة</p>
            <h1 className="mt-1 text-xl font-bold tracking-tight">العملاء</h1>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-xs font-bold text-white shadow-[var(--shadow-elev-2)] active:scale-95"
          >
            <Plus className="size-4" /> عميل جديد
          </button>
        </div>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم أو الهاتف"
            className="h-12 w-full rounded-2xl border border-stone-line bg-card px-4 pr-11 text-sm font-medium placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
          />
        </div>
      </header>

      <main className="space-y-3 px-5 pt-6">
        {isLoading ? (
          <p className="p-6 text-center text-xs text-muted-foreground">جارِ التحميل...</p>
        ) : customers.length === 0 ? (
          <div className="card-elev flex flex-col items-center gap-2 p-10 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
              <User className="size-6" />
            </div>
            <p className="text-sm font-bold">لا يوجد عملاء بعد</p>
            <p className="text-xs text-muted-foreground">أضف عميلك الأول لبدء الحجوزات السريعة.</p>
            <button
              onClick={() => setAddOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
            >
              <Plus className="size-3.5" /> إضافة عميل
            </button>
          </div>
        ) : (
          customers.map((c, i) => (
            <Link
              key={c.id}
              to="/customers/$id"
              params={{ id: c.id }}
              className="card-elev group flex items-center gap-3 p-4 animate-rise transition active:scale-[0.99]"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary text-sm font-bold">
                {c.name.slice(0, 1)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{c.name}</p>
                {c.phone && (
                  <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground" dir="ltr">
                    <Phone className="size-2.5" /> {c.phone}
                  </p>
                )}
              </div>
              <ChevronLeft className="size-4 text-muted-foreground transition group-hover:-translate-x-0.5 group-hover:text-primary" />
            </Link>
          ))
        )}
      </main>

      <CustomerFormSheet open={addOpen} onOpenChange={setAddOpen} />
    </AppShell>
  );
}
