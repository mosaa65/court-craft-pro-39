import { queryOptions } from "@tanstack/react-query";
import { listNotificationsFn, getUnreadNotificationCountFn } from "./notifications.functions";
import type { Notification } from "./types";

export type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  body: string;
  contract_id: string | null;
  due_id: string | null;
  tenant_id: string | null;
  read: boolean;
  created_at: string;
};

export function mapNotification(r: NotificationRow): Notification {
  return {
    id: r.id,
    kind: r.kind,
    title: r.title,
    body: r.body ?? "",
    contractId: r.contract_id ?? null,
    dueId: r.due_id ?? null,
    tenantId: r.tenant_id ?? null,
    read: Boolean(r.read),
    createdAt: r.created_at,
  };
}

export const notificationsQuery = queryOptions({
  queryKey: ["notifications"],
  queryFn: async () =>
    (await listNotificationsFn({ data: { limit: 50 } })).map((r) => mapNotification(r as NotificationRow)),
  staleTime: 15_000,
});

export const unreadCountQuery = queryOptions({
  queryKey: ["notifications", "unread-count"],
  queryFn: async () => await getUnreadNotificationCountFn(),
  staleTime: 10_000,
});
