import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { LayoutGrid, Users, Settings, ChevronLeft, Plus, Wallet } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { bookingsQuery, courtsQuery, localDateKey } from "@/lib/bookings.queries";
import { customersQuery } from "@/lib/customers.queries";
import { toArabicDigits } from "@/lib/mock";

export const Route = createFileRoute("/manage")({
  head: () => ({
    meta: [
      { title: "الإدارة — الملاعب والعملاء والمالية" },
      { name: "description", content: "مركز الإدارة: الملاعب، العملاء، المالية، والإعدادات في مكان واحد." },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(courtsQuery);
    context.queryClient.ensureQueryData(bookingsQuery({ date: localDateKey() }));
  },
  component: ManagePage,
});

function ManagePage() {
  const { data: courts } = useSuspenseQuery(courtsQuery);
  const { data: customers = [] } = useQuery(customersQuery(""));
  const { data: todaysBookings = [] } = useQuery(bookingsQuery({ date: localDateKey() }));
  const todayRevenue = todaysBookings
    .filter((b) => b.status !== "cancelled" && b.status !== "maintenance" && b.status !== "pending")
    .reduce((s, b) => s + b.price, 0);

  return (
    <AppShell>
      <header className="px-6 pb-4 pt-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">مركز الإدارة</p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight">الإدارة</h1>
        <p className="mt-1 text-xs text-muted-foreground">كل ما تحتاج لإدارة أعمالك في مكان واحد.</p>
      </header>

      <main className="space-y-4 px-5 pt-4">
        <HubCard
          to="/courts"
          icon={<LayoutGrid className="size-6" />}
          title="الملاعب"
          subtitle={`${toArabicDigits(courts.length)} ملعب نشط`}
          accent="primary"
          previewImages={courts.slice(0, 4).map((c) => c.image)}
        />

        <HubCard
          to="/customers"
          icon={<Users className="size-6" />}
          title="العملاء"
          subtitle={`${toArabicDigits(customers.length)} عميل مسجّل`}
          accent="ink"
          cta="إضافة عميل"
          ctaIcon={<Plus className="size-3.5" />}
        />

        <HubCard
          to="/finance"
          icon={<Wallet className="size-6" />}
          title="المالية والفواتير"
          subtitle={`إيراد اليوم: ${toArabicDigits(todayRevenue)} ر.س`}
          accent="primary"
        />

        <HubCard
          to="/more"
          icon={<Settings className="size-6" />}
          title="الإعدادات والمزيد"
          subtitle="الفرع، الموظفون، الإشعارات"
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
  previewImages,
  cta,
  ctaIcon,
}: {
  to: "/courts" | "/customers" | "/more" | "/finance";
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  accent: "primary" | "ink" | "muted";
  previewImages?: string[];
  cta?: string;
  ctaIcon?: React.ReactNode;
}) {
  const accentClass =
    accent === "primary" ? "bg-primary/10 text-primary"
    : accent === "ink" ? "bg-ink text-white"
    : "bg-muted text-foreground";

  return (
    <Link to={to} className="card-elev group block overflow-hidden transition active:scale-[0.99]">
      <div className="flex items-start gap-4 p-5">
        <div className={`grid size-14 place-items-center rounded-2xl ${accentClass}`}>
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
      {previewImages && previewImages.length > 0 && (
        <div className="grid grid-cols-4 gap-0.5 border-t border-stone-line/70">
          {previewImages.map((img, i) => (
            <img key={i} src={img} alt="" className="aspect-[4/3] w-full object-cover" />
          ))}
        </div>
      )}
    </Link>
  );
}
