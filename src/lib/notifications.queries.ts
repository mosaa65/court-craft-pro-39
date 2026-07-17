import { queryOptions } from "@tanstack/react-query";
import { listNotificationsFn, unreadCountFn } from "./notifications.functions";

export type NotificationRow = {
  id: string;
  kind: string;
  title: string;
  body: string;
  booking_id: string | null;
  read: boolean;
  created_at: string;
};

export const notificationsQuery = queryOptions({
  queryKey: ["notifications"],
  queryFn: async () => (await listNotificationsFn()) as NotificationRow[],
  staleTime: 15_000,
  refetchInterval: 60_000,
});

export const unreadCountQuery = queryOptions({
  queryKey: ["notifications", "unread-count"],
  queryFn: async () => await unreadCountFn(),
  staleTime: 15_000,
  refetchInterval: 60_000,
});
