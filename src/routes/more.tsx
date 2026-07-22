import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Users, Settings, Building2, Wallet, Bell, HelpCircle, ChevronLeft, CheckCircle2, ShieldCheck, PhoneCall } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/more")({
  head: () => ({
    meta: [
      { title: "المزيد — الإعدادات والمنشأة" },
      { name: "description", content: "إعدادات المنشأة وتخصيص إشعارات الرسائل والدعم الفني." },
    ],
  }),
  component: MorePage,
});

type MorePanel = "company" | "staff" | "system" | "support";

const linkItems = [
  { icon: Wallet, label: "الإدارة المالية والمحصلات", hint: "تحصيل، سندات قبض، ومصروفات", to: "/finance" as const },
  { icon: Bell, label: "الإشعارات وسجل الرسائل", hint: "التنبيهات ورسائل المستأجرين", to: "/notifications" as const },
];

const panelItems: { icon: typeof Building2; label: string; hint: string; panel: MorePanel }[] = [
  { icon: Building2, label: "معلومات المنشأة/المالك", hint: "مؤسسة إدارة الأملاك", panel: "company" },
  { icon: Users, label: "المستأجرون والعملاء", hint: "سجل مستأجري العقارات", panel: "staff" },
  { icon: Settings, label: "إعدادات النظام والعملة", hint: "الريال السعودي والتاريخ الهجري/الميلادي", panel: "system" },
  { icon: HelpCircle, label: "الدعم والمساعدة", hint: "قنوات الدعم وتوجيهات الاستخدام", panel: "support" },
];

function MorePage() {
  const [panel, setPanel] = useState<MorePanel>("company");

  return (
    <AppShell>
      <header className="px-6 pb-4 pt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
          الحساب والمنشأة
        </p>
        <h1 className="mt-1 text-xl font-bold tracking-tight">المزيد والإعدادات</h1>
      </header>

      <main className="space-y-6 px-5 pt-2">
        <section className="ink-card flex items-center gap-4 p-5">
          <div className="grid size-14 place-items-center rounded-2xl bg-white/10 text-lg font-bold">ع</div>
          <div className="flex-1">
            <p className="text-sm font-bold">إدارة الأملاك والعقارات</p>
            <p className="text-xs text-white/60">admin@realestate.sa</p>
          </div>
          <span className="rounded-full bg-primary/20 px-2.5 py-1 text-[10px] font-bold text-primary">
            نسخة احترافية
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
          نظام إدارة العقارات والإيجارات 2.0 • جميع الحقوق محفوظة
        </p>
      </main>
    </AppShell>
  );
}

function SettingsPanel({ panel }: { panel: MorePanel }) {
  const content = {
    company: {
      title: "معلومات المنشأة والمالك",
      lines: ["المالك الرئيسي: إدارة الأملاك", "العملة: ريال سعودي (ر.س)", "تأطير العقارات: السكني والتجاري", "حالة النظام: نشط ومربوط بـ Supabase"],
    },
    staff: {
      title: "المستأجرون والصلاحيات",
      lines: ["سجل مستأجرين مدمج مع الواتساب والرسائل", "إمكانية البحث بالهوية والجوال", "تتبع العقود والاستحقاقات المالية لكل مستأجر"],
    },
    system: {
      title: "إعدادات أتمتة الدفعات",
      lines: ["إنشاء تلقائي للاستحقاقات عند إبرام أي عقد", "سندات قبض آلية برقم تسلسلي موحد", "قراءات العدادات وحساب الاستهلاك الفعلي (كهرباء/مياه)"],
    },
    support: {
      title: "الدعم والمساعدة",
      lines: ["إرسال التنبيهات عبر روابط WhatsApp مباشرة", "طباعة المعاينات لسندات القبض والعقود", "قاعدة بيانات Supabase مخصصة آمنة 100%"],
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
