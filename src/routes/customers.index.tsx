import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Search, Plus, User, Phone, ChevronLeft, MessageCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { tenantsQuery } from "@/lib/tenants.queries";
import { TenantFormSheet } from "@/components/tenant-form-sheet";
import { openWhatsApp } from "@/lib/types";

export const Route = createFileRoute("/customers/")({
  head: () => ({
    meta: [
      { title: "المستأجرين — سجل المستأجرين والعقود" },
      { name: "description", content: "قائمة المستأجرين مع إمكانية التقديم والبحث والتواصل عبر واتساب." },
    ],
  }),
  component: TenantsPage,
});

function TenantsPage() {
  const [search, setSearch] = useState("");
  const [addOpen, setAddOpen] = useState(false);
  const { data: tenants = [], isLoading } = useQuery(tenantsQuery(search));

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/85 px-6 pb-4 pt-8 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">إدارة</p>
            <h1 className="mt-1 text-xl font-bold tracking-tight">المستأجرين</h1>
          </div>
          <button
            onClick={() => setAddOpen(true)}
            className="flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-xs font-bold text-white shadow-md active:scale-95 transition"
          >
            <Plus className="size-4" /> مستأجر جديد
          </button>
        </div>

        <div className="relative mt-5">
          <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث بالاسم، الهوية، أو رقم الجوال..."
            className="h-12 w-full rounded-2xl border border-stone-line bg-card px-4 pr-11 text-sm font-medium placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      </header>

      <main className="space-y-3 px-5 pt-6">
        {isLoading ? (
          <p className="p-6 text-center text-xs text-muted-foreground">جارِ تحميل المستأجرين...</p>
        ) : tenants.length === 0 ? (
          <div className="card-elev flex flex-col items-center gap-2 p-10 text-center">
            <div className="grid size-14 place-items-center rounded-full bg-primary/10 text-primary">
              <User className="size-6" />
            </div>
            <p className="text-sm font-bold">لا يوجد مستأجرون مسجلون</p>
            <p className="text-xs text-muted-foreground">أضف بيانات المستأجر الأول لإبرام العقود وتأجير الوحدات.</p>
            <button
              onClick={() => setAddOpen(true)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
            >
              <Plus className="size-3.5" /> إضافة مستأجر جديد
            </button>
          </div>
        ) : (
          tenants.map((t, i) => (
            <div
              key={t.id}
              className="card-elev group flex items-center justify-between p-4 animate-rise transition active:scale-[0.99]"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <Link to="/customers/$id" params={{ id: t.id }} className="flex items-center gap-3 flex-1 min-w-0">
                <div className="grid size-12 place-items-center rounded-full bg-primary/10 text-primary text-base font-bold shrink-0">
                  {t.name.slice(0, 1)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold">{t.name}</p>
                  {t.phone && (
                    <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground" dir="ltr">
                      <Phone className="size-2.5" /> {t.phone}
                    </p>
                  )}
                </div>
              </Link>

              <div className="flex items-center gap-2 shrink-0">
                {t.phone && (
                  <button
                    onClick={() => openWhatsApp(t.phone, `مرحباً ${t.name}، تواصل من إدارة العقارات.`)}
                    className="grid size-9 place-items-center rounded-full bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20"
                    title="مراسلة عبر واتساب"
                  >
                    <MessageCircle className="size-4" />
                  </button>
                )}
                <Link to="/customers/$id" params={{ id: t.id }}>
                  <ChevronLeft className="size-4 text-muted-foreground group-hover:text-primary transition" />
                </Link>
              </div>
            </div>
          ))
        )}
      </main>

      <TenantFormSheet open={addOpen} onOpenChange={setAddOpen} />
    </AppShell>
  );
}
