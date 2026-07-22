import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { ArrowRight, Bell, CheckCheck, FileText, Coins, AlertCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { notificationsQuery } from "@/lib/notifications.queries";
import { markNotificationsReadFn } from "@/lib/notifications.functions";
import { formatDate } from "@/lib/types";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "الإشعارات والتنبيهات — إدارة أملاكك" },
      { name: "description", content: "سجل الإشعارات والتنبيهات للعقود والاستحقاقات." },
    ],
  }),
  component: NotificationsPage,
});

function NotificationsPage() {
  const queryClient = useQueryClient();
  const { data: notifications = [], isLoading } = useQuery(notificationsQuery);

  const markMutation = useMutation({
    mutationFn: async () => {
      await markNotificationsReadFn();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
  });

  useEffect(() => {
    markMutation.mutate();
  }, []);

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/85 px-6 pb-4 pt-8 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/"
              className="grid size-10 place-items-center rounded-full bg-muted text-ink"
            >
              <ArrowRight className="size-4" />
            </Link>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">التنبيهات</p>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight">سجل الإشعارات</h1>
            </div>
          </div>

          <button
            onClick={() => markMutation.mutate()}
            className="flex items-center gap-1 text-xs font-bold text-primary hover:underline"
          >
            <CheckCheck className="size-3.5" /> تحديد كـ مقروء
          </button>
        </div>
      </header>

      <main className="space-y-3 px-5 pt-4">
        {isLoading ? (
          <p className="p-6 text-center text-xs text-muted-foreground">جارِ تحميل الإشعارات...</p>
        ) : notifications.length === 0 ? (
          <div className="card-elev p-10 text-center text-xs text-muted-foreground">
            لا توجد إشعارات حالياً.
          </div>
        ) : (
          notifications.map((n) => (
            <div key={n.id} className="card-elev p-4 flex items-start gap-3 animate-rise">
              <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary shrink-0 mt-0.5">
                {n.kind.includes("contract") ? (
                  <FileText className="size-5" />
                ) : n.kind.includes("payment") ? (
                  <Coins className="size-5" />
                ) : (
                  <Bell className="size-5" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-foreground">{n.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">
                  {formatDate(n.createdAt, { day: true, month: true })}
                </p>
              </div>
            </div>
          ))
        )}
      </main>
    </AppShell>
  );
}
