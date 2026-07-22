import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { serverClient } from "./supabase-server";

export const listDuesFn = createServerFn({ method: "POST" })
  .inputValidator(
    (d: unknown) =>
      z
        .object({
          contractId: z.string().optional(),
          status: z.string().optional(),
          tenantId: z.string().optional(),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    const sb = serverClient();
    let q = sb
      .from("dues")
      .select("*, contracts(contract_number, tenant_id, unit_id, tenants(id, name, phone), units(unit_number, properties(id, name, image_url)))")
      .order("due_date", { ascending: true });

    if (data.contractId) q = q.eq("contract_id", data.contractId);
    if (data.status && data.status !== "all") q = q.eq("status", data.status as never);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const updateDueFn = createServerFn({ method: "POST" })
  .inputValidator(
    (d: unknown) =>
      z
        .object({
          id: z.string().uuid(),
          amount: z.number().nonnegative(),
          dueDate: z.string().min(1),
          title: z.string().default(""),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: row, error } = await sb
      .from("dues")
      .update({
        amount: data.amount,
        due_date: data.dueDate,
        title: data.title,
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
