import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowRight, BellOff, CheckCheck, Trash2, CalendarPlus, XCircle, Coins, MessageCircle, Clock } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { notificationsQuery } from "@/lib/notifications.queries";
import {
  markNotificationReadFn,
  markAllNotificationsReadFn,
  deleteNotificationFn,
} from "@/lib/notifications.functions";
import { toArabicDigits } from "@/lib/mock";
import { toast } from "sonner";

export const Route = createFileRoute("/notifications")({
  head: () => ({
    meta: [
      { title: "الإشعارات — نظام إدارة الملاعب" },
      { name: "description", content: "كل التنبيهات المهمة عن الحجوزات والمدفوعات." },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(notificationsQuery),
  component: NotificationsPage,
});

function iconFor(kind: string) {
  if (kind === "booking_created") return <CalendarPlus className="size-4" />;
  if (kind === "booking_cancelled") return <XCircle className="size-4" />;
  if (kind === "payment_received") return <Coins className="size-4" />;
  if (kind === "invoice_sent") return <MessageCircle className="size-4" />;
  if (kind === "invoice_overdue") return <Clock className="size-4" />;
  return <BellOff className="size-4" />;
}

function toneFor(kind: string) {
  if (kind === "payment_received") return "bg-primary/10 text-primary";
  if (kind === "booking_cancelled") return "bg-destructive/10 text-destructive";
  if (kind === "invoice_sent") return "bg-ink/10 text-ink";
  if (kind === "invoice_overdue") return "bg-[color:var(--color-warn)]/15 text-[color:oklch(0.55_0.15_70)]";
  return "bg-primary/10 text-primary";
}

function relTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return "الآن";
  const m = Math.floor(s / 60);
  if (m < 60) return `منذ ${toArabicDigits(m)} د`;
  const h = Math.floor(m / 60);
  if (h < 24) return `منذ ${toArabicDigits(h)} س`;
  const d = Math.floor(h / 24);
  return `منذ ${toArabicDigits(d)} يوم`;
}

function NotificationsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const { data: items } = useSuspenseQuery(notificationsQuery);
  const unread = items.filter((n) => !n.read).length;

  async function markAll() {
    await markAllNotificationsReadFn();
    qc.invalidateQueries({ queryKey: ["notifications"] });
    toast.success("تم تعليم كل الإشعارات كمقروءة");
  }
  async function markOne(id: string) {
    await markNotificationReadFn({ data: { id } });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }
  async function remove(id: string) {
    await deleteNotificationFn({ data: { id } });
    qc.invalidateQueries({ queryKey: ["notifications"] });
  }

  return (
    <AppShell>
      <header className="sticky top-0 z-30 border-b border-stone-line/70 bg-background/85 px-6 pb-4 pt-8 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.history.back()}
            aria-label="رجوع"
            className="grid size-10 place-items-center rounded-full bg-muted text-ink"
          >
            <ArrowRight className="size-4" />
          </button>
          <div className="flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">مركز التنبيهات</p>
            <h1 className="mt-0.5 text-xl font-bold tracking-tight">
              الإشعارات
              {unread > 0 && (
                <span className="mr-2 inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                  {toArabicDigits(unread)} جديد
                </span>
              )}
            </h1>
          </div>
          {unread > 0 && (
            <button
              onClick={markAll}
              className="flex items-center gap-1 rounded-full bg-ink px-3 py-2 text-[11px] font-bold text-white"
            >
              <CheckCheck className="size-3.5" /> قراءة الكل
            </button>
          )}
        </div>
      </header>

      <main className="px-5 pt-4">
        {items.length === 0 ? (
          <div className="card-elev flex flex-col items-center gap-2 p-10 text-center">
            <BellOff className="size-8 text-muted-foreground" />
            <p className="text-sm font-bold">لا توجد إشعارات بعد</p>
            <p className="text-xs text-muted-foreground">ستظهر هنا التنبيهات الجديدة تلقائياً.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {items.map((n) => {
              const inner = (
                <div
                  className={
                    "card-elev flex items-start gap-3 p-4 transition " + (n.read ? "" : "ring-1 ring-primary/25")
                  }
                >
                  <div className={"grid size-10 shrink-0 place-items-center rounded-xl " + toneFor(n.kind)}>
                    {iconFor(n.kind)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold">{n.title}</p>
                      {!n.read && <span className="size-1.5 rounded-full bg-primary" />}
                    </div>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">{n.body}</p>
                    <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {relTime(n.created_at)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      remove(n.id);
                    }}
                    aria-label="حذف"
                    className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              );
              return (
                <li key={n.id}>
                  {n.booking_id ? (
                    <Link
                      to="/bookings/$id"
                      params={{ id: n.booking_id }}
                      onClick={() => !n.read && markOne(n.id)}
                    >
                      {inner}
                    </Link>
                  ) : (
                    <button className="w-full text-right" onClick={() => !n.read && markOne(n.id)}>
                      {inner}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </AppShell>
  );
}
