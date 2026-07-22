import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { serverClient } from "./supabase-server";

export const listNotificationsFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ limit: z.number().default(50) }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: rows, error } = await sb
      .from("notifications")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(data.limit);

    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const markNotificationsReadFn = createServerFn({ method: "POST" }).handler(async () => {
  const sb = serverClient();
  const { error } = await sb.from("notifications").update({ read: true }).eq("read", false);
  if (error) throw new Error(error.message);
  return { ok: true };
});

export const getUnreadNotificationCountFn = createServerFn({ method: "POST" }).handler(async () => {
  const sb = serverClient();
  const { count, error } = await sb
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("read", false);

  if (error) throw new Error(error.message);
  return count ?? 0;
});
