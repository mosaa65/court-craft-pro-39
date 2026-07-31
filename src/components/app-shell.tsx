import { Link, useRouterState } from "@tanstack/react-router";
import { Home, CalendarDays, LayoutGrid, DollarSign, ReceiptText } from "lucide-react";
import { useState, type ReactNode } from "react";
import { PaymentSheet } from "./payment-sheet";
import { cn } from "@/lib/utils";

type Tab = {
  to: "/" | "/calendar" | "/bookings" | "/manage";
  label: string;
  icon: typeof Home;
  exact?: boolean;
  matchPrefixes?: string[];
};

const tabs: Tab[] = [
  { to: "/", label: "الرئيسية", icon: Home, exact: true },
  { to: "/calendar", label: "التقويم", icon: CalendarDays },
  { to: "/bookings", label: "الاستحقاقات", icon: ReceiptText, matchPrefixes: ["/bookings"] },
  { to: "/manage", label: "الإدارة", icon: LayoutGrid, matchPrefixes: ["/manage", "/courts", "/customers", "/finance", "/more"] },
];

export function AppShell({ children }: { children: ReactNode }) {
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div dir="rtl" className="min-h-screen bg-background text-foreground font-sans pb-32 selection:bg-primary/20">
      <div className="mx-auto w-full max-w-[440px]">{children}</div>

      <nav
        aria-label="التنقل الرئيسي"
        className="fixed bottom-4 left-1/2 z-40 flex h-16 w-[94%] max-w-[420px] -translate-x-1/2 items-center justify-between rounded-full bg-ink/95 px-2 shadow-[0_20px_60px_-15px_oklch(0.15_0.04_258/0.35)] backdrop-blur-xl"
      >
        {tabs.slice(0, 2).map((t) => (
          <TabButton key={t.to} tab={t} pathname={pathname} />
        ))}

        <button
          type="button"
          onClick={() => setPaymentSheetOpen(true)}
          aria-label="تسجيل سداد"
          className="grid size-14 -translate-y-6 place-items-center rounded-full bg-primary text-primary-foreground shadow-[var(--shadow-gold)] ring-4 ring-background transition-transform active:scale-95"
          title="سداد / تحصيل دفعة"
        >
          <DollarSign className="size-6" strokeWidth={2.5} />
        </button>

        {tabs.slice(2).map((t) => (
          <TabButton key={t.to} tab={t} pathname={pathname} />
        ))}
      </nav>

      <PaymentSheet open={paymentSheetOpen} onOpenChange={setPaymentSheetOpen} />
    </div>
  );
}

function TabButton({ tab, pathname }: { tab: Tab; pathname: string }) {
  const active = tab.exact
    ? pathname === tab.to
    : (tab.matchPrefixes ?? [tab.to]).some((p) => pathname === p || pathname.startsWith(p + "/") || pathname === p);
  const Icon = tab.icon;
  return (
    <Link
      to={tab.to}
      className={cn(
        "flex h-12 w-14 flex-col items-center justify-center gap-0.5 rounded-2xl transition-colors",
        active ? "text-primary" : "text-white/60 hover:text-white",
      )}
    >
      <Icon className="size-[18px]" strokeWidth={active ? 2.4 : 1.8} />
      <span className="text-[9px] font-semibold tracking-wide">{tab.label}</span>
    </Link>
  );
}
