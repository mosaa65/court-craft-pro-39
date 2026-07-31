import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Building2, Users, FileText, Wallet, Wrench, Zap, Settings, ChevronLeft, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { propertiesQuery } from "@/lib/properties.queries";
import { tenantsQuery } from "@/lib/tenants.queries";
import { contractsQuery } from "@/lib/contracts.queries";
import { toArabicDigits } from "@/lib/types";

export const Route = createFileRoute("/manage")({
  head: () => ({
    meta: [
      { title: "الإدارة — مركز إدارة العقارات والمستأجرين" },
      { name: "description", content: "مركز الإدارة: العقارات والوحدات والمستأجرين والعقود والمالية والصيانة." },
    ],
  }),
  component: ManagePage,
});

function ManagePage() {
  const { data: properties = [] } = useQuery(propertiesQuery(""));
  const { data: tenants = [] } = useQuery(tenantsQuery(""));
  const { data: contracts = [] } = useQuery(contractsQuery({}));

  const activeContractsCount = contracts.filter((c) => c.status === "active").length;

  return (
    <AppShell>
      <header className="px-6 pb-4 pt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">مركز الإدارة المحترفة</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">إدارة أملاكك</h1>
        <p className="mt-1 text-xs text-muted-foreground">أدوات متكاملة لإدارة محفظتك العقارية وسجلات العقود والمستأجرين.</p>
      </header>

      <main className="space-y-3.5 px-5 pt-4">
        <HubCard
          to="/courts"
          icon={<Building2 className="size-6" />}
          title="العقارات والعمائر"
          subtitle={`${toArabicDigits(properties.length)} عقار مسجّل في النظام`}
          accent="primary"
        />

        <HubCard
          to="/customers"
          icon={<Users className="size-6" />}
          title="المستأجرين"
          subtitle={`${toArabicDigits(tenants.length)} مستأجر مسجّل`}
          accent="ink"
          cta="إضافة مستأجر"
          ctaIcon={<Plus className="size-3.5" />}
        />

        <HubCard
          to="/bookings"
          icon={<FileText className="size-6" />}
          title="عقود الإيجار"
          subtitle={`${toArabicDigits(activeContractsCount)} عقد إيجار نشط`}
          accent="primary"
        />

        <HubCard
          to="/finance"
          icon={<Wallet className="size-6" />}
          title="المالية والاستحقاقات والمصروفات"
          subtitle="سندات القبض، المصروفات، والتحصيل"
          accent="primary"
        />

        <HubCard
          to="/more"
          icon={<Settings className="size-6" />}
          title="الإعدادات والمزيد"
          subtitle="إعدادات المنشأة، الإشعارات، وتخصيص النظام"
          accent="muted"
        />
      </main>
    </AppShell>
  );
}

function HubCard({
  to,
  icon,
  title,
  subtitle,
  accent,
  cta,
  ctaIcon,
}: {
  to: "/courts" | "/customers" | "/bookings" | "/finance" | "/more";
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent: "primary" | "ink" | "muted";
  cta?: string;
  ctaIcon?: React.ReactNode;
}) {
  const accentClass =
    accent === "primary" ? "bg-primary/10 text-primary"
    : accent === "ink" ? "bg-ink text-white"
    : "bg-muted text-foreground";

  return (
    <Link to={to} className="card-elev group block overflow-hidden transition active:scale-[0.99]">
      <div className="flex items-center gap-4 p-5">
        <div className={`grid size-14 place-items-center rounded-2xl ${accentClass} shrink-0`}>
          {icon}
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
          {cta && (
            <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-[11px] font-bold text-primary">
              {ctaIcon}{cta}
            </span>
          )}
        </div>
        <ChevronLeft className="size-4 text-muted-foreground transition group-hover:-translate-x-0.5 group-hover:text-primary" />
      </div>
    </Link>
  );
}
