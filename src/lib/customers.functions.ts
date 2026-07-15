import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { serverClient } from "./bookings.server";

const CustomerRow = z.object({});

export const listCustomersFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ search: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    let q = sb.from("customers").select("*").order("name", { ascending: true });
    if (data.search && data.search.trim()) {
      const s = data.search.trim().replace(/[%,]/g, " ");
      q = q.or(`name.ilike.%${s}%,phone.ilike.%${s}%,notes.ilike.%${s}%`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getCustomerFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: row, error } = await sb.from("customers").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("NOT_FOUND");
    return row;
  });

const UpsertInput = z.object({
  name: z.string().min(2, "الاسم قصير جداً"),
  phone: z.string().default(""),
  notes: z.string().default(""),
});

export const createCustomerFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => UpsertInput.parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: row, error } = await sb
      .from("customers")
      .insert({ name: data.name.trim(), phone: data.phone.trim(), notes: data.notes.trim() })
      .select("*")
      .single();
    if (error) throw new Error(error.message.includes("uq_customers_phone") ? "هذا الرقم مسجّل مسبقًا" : error.message);
    return row;
  });

export const updateCustomerFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => UpsertInput.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: row, error } = await sb
      .from("customers")
      .update({ name: data.name.trim(), phone: data.phone.trim(), notes: data.notes.trim() })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteCustomerFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { error } = await sb.from("customers").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// silence unused
void CustomerRow;
