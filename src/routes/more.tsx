import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Users, Settings, Building2, Wallet, Bell, HelpCircle, ChevronLeft, CheckCircle2 } from "lucide-react";
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

type MorePanel = "branch" | "staff" | "system" | "support";

const linkItems = [
  { icon: Wallet, label: "المدفوعات والفواتير", hint: "تحصيل، إرسال، وتسوية", to: "/finance" as const },
  { icon: Bell, label: "الإشعارات والرسائل", hint: "سجل الإرسال والتنبيهات", to: "/notifications" as const },
];

const panelItems: { icon: typeof Building2; label: string; hint: string; panel: MorePanel }[] = [
  { icon: Building2, label: "الفرع الحالي", hint: "فرع الياسمين", panel: "branch" },
  { icon: Users, label: "الموظفون", hint: "٦ أعضاء", panel: "staff" },
  { icon: Settings, label: "إعدادات النظام", hint: "العملة واللغة وساعات العمل", panel: "system" },
  { icon: HelpCircle, label: "الدعم والمساعدة", hint: "قنوات التواصل والملاحظات", panel: "support" },
];

function MorePage() {
  const [panel, setPanel] = useState<MorePanel>("branch");

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
            {linkItems.map((it) => (
              <li key={it.label}>
                <Link to={it.to} className="flex w-full items-center gap-4 px-4 py-4 text-right transition hover:bg-muted/50">
                  <span className="grid size-10 place-items-center rounded-xl bg-muted text-foreground">
                    <it.icon className="size-[18px]" strokeWidth={1.8} />
                  </span>
                  <span className="flex-1">
                    <p className="text-sm font-bold">{it.label}</p>
                    {it.hint && <p className="mt-0.5 text-xs text-muted-foreground">{it.hint}</p>}
                  </span>
                  <ChevronLeft className="size-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
            {panelItems.map((it) => (
              <li key={it.label}>
                <button
                  type="button"
                  onClick={() => setPanel(it.panel)}
                  className="flex w-full items-center gap-4 px-4 py-4 text-right transition hover:bg-muted/50"
                >
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

        <SettingsPanel panel={panel} />

        <p className="pt-4 text-center text-[11px] text-muted-foreground">
          الإصدار ١٫٠ — MVP • جميع الحقوق محفوظة
        </p>
      </main>
    </AppShell>
  );
}

function SettingsPanel({ panel }: { panel: MorePanel }) {
  const content = {
    branch: {
      title: "الفرع الحالي",
      lines: ["فرع الياسمين", "العملة: ريال سعودي", "اللغة: العربية", "الحالة: نشط"],
    },
    staff: {
      title: "الموظفون والصلاحيات",
      lines: ["٦ أعضاء مسجلين", "المالك: مدير الفرع", "صلاحيات التشغيل مفعّلة"],
    },
    system: {
      title: "إعدادات النظام",
      lines: ["نظام الوقت: ١٢ ساعة", "حالة الدفع: نقدي / تحويل / بطاقة", "الفواتير مرتبطة بالحجوزات مباشرة"],
    },
    support: {
      title: "الدعم والمساعدة",
      lines: ["راجع سجل الإشعارات لمعرفة نتائج الإرسال", "الرسائل تعتمد على قناة الربط الخارجية", "يمكنك إدارة التحصيل من المالية والفواتير"],
    },
  }[panel];

  return (
    <section className="card-elev p-5">
      <div className="flex items-center gap-2">
        <CheckCircle2 className="size-4 text-primary" />
        <h2 className="text-sm font-bold">{content.title}</h2>
      </div>
      <div className="mt-4 space-y-2">
        {content.lines.map((line) => (
          <div key={line} className="flex items-center justify-between rounded-2xl bg-muted/60 px-3 py-2 text-xs">
            <span>{line}</span>
            <span className="size-1.5 rounded-full bg-primary" />
          </div>
        ))}
      </div>
    </section>
  );
}
