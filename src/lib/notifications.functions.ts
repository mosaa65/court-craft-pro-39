import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { serverClient } from "./bookings.server";

export type NotificationKind =
  | "booking_created"
  | "booking_cancelled"
  | "payment_received"
  | "invoice_sent"
  | "invoice_overdue";

export const listNotificationsFn = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverClient();
  const { data, error } = await sb
    .from("notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const unreadCountFn = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverClient();
  const { count, error } = await sb
    .from("notifications")
    .select("id", { head: true, count: "exact" })
    .eq("read", false);
  if (error) throw new Error(error.message);
  return count ?? 0;
});

export const markNotificationReadFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { error } = await sb.from("notifications").update({ read: true }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const markAllNotificationsReadFn = createServerFn({ method: "POST" }).handler(async () => {
  const sb = serverClient();
  const { error } = await sb.from("notifications").update({ read: true }).eq("read", false);
  if (error) throw new Error(error.message);
  return { ok: true };
});

export const deleteNotificationFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { error } = await sb.from("notifications").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
