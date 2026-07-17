import { createFileRoute } from "@tanstack/react-router";
import { Users, Settings, Building2, Wallet, Bell, HelpCircle, ChevronLeft } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/more")({
  head: () => ({
    meta: [
      { title: "المزيد — الإعدادات" },
      { name: "description", content: "الإعدادات والفروع والمدفوعات." },
    ],
  }),
  component: MorePage,
});

const items = [
  { icon: Building2, label: "الفرع الحالي", hint: "فرع الياسمين" },
  { icon: Users, label: "الموظفون", hint: "٦ أعضاء" },
  { icon: Wallet, label: "المدفوعات", hint: "يدوي: نقدي / تحويل / بطاقة" },
  { icon: Bell, label: "الإشعارات", hint: "مفعّلة (واتساب + SMS)" },
  { icon: Settings, label: "إعدادات النظام", hint: "" },
  { icon: HelpCircle, label: "الدعم والمساعدة", hint: "" },
];

function MorePage() {
  return (
    <AppShell>
      <header className="px-6 pb-4 pt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          الحساب
        </p>
        <h1 className="mt-1 text-xl font-bold tracking-tight">المزيد</h1>
      </header>

      <main className="space-y-6 px-5 pt-2">
        <section className="ink-card flex items-center gap-4 p-5">
          <div className="grid size-14 place-items-center rounded-2xl bg-white/10 text-lg font-bold">م</div>
          <div className="flex-1">
            <p className="text-sm font-bold">مدير الفرع</p>
            <p className="text-xs text-white/60">manager@arena.sa</p>
          </div>
          <span className="rounded-full bg-primary/20 px-2.5 py-1 text-[10px] font-bold text-primary">
            نشط
          </span>
        </section>

        <section className="card-elev overflow-hidden">
          <ul className="divide-y divide-stone-line/70">
            {items.map((it) => (
              <li key={it.label}>
                <button className="flex w-full items-center gap-4 px-4 py-4 text-right transition hover:bg-muted/50">
                  <span className="grid size-10 place-items-center rounded-xl bg-muted text-foreground">
                    <it.icon className="size-[18px]" strokeWidth={1.8} />
                  </span>
                  <span className="flex-1">
                    <p className="text-sm font-bold">{it.label}</p>
                    {it.hint && <p className="mt-0.5 text-xs text-muted-foreground">{it.hint}</p>}
                  </span>
                  <ChevronLeft className="size-4 text-muted-foreground" />
                </button>
              </li>
            ))}
          </ul>
        </section>

        <p className="pt-4 text-center text-[11px] text-muted-foreground">
          الإصدار ١٫٠ — MVP • جميع الحقوق محفوظة
        </p>
      </main>
    </AppShell>
  );
}
