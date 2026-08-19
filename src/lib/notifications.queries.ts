import { queryOptions } from "@tanstack/react-query";
import { listNotificationsFn, unreadCountFn } from "./notifications.functions";
import { hasOfflineStorage, readOfflineRows, saveOfflineRows } from "./offline-store";

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
  queryFn: async () => {
    try {
      const rows = (await listNotificationsFn()) as NotificationRow[];
      await saveOfflineRows("notifications", rows, true);
      return rows;
    } catch (error) {
      const rows = await readOfflineRows<NotificationRow>("notifications");
      if (!hasOfflineStorage()) throw error;
      return rows.sort((a, b) => b.created_at.localeCompare(a.created_at));
    }
  },
  staleTime: 15_000,
  refetchInterval: 60_000,
  networkMode: "always",
  retry: false,
});

export const unreadCountQuery = queryOptions({
  queryKey: ["notifications", "unread-count"],
  queryFn: async () => {
    try {
      return await unreadCountFn();
    } catch {
      return (await readOfflineRows<NotificationRow>("notifications")).filter((row) => !row.read).length;
    }
  },
  staleTime: 15_000,
  refetchInterval: 60_000,
  networkMode: "always",
  retry: false,
});
