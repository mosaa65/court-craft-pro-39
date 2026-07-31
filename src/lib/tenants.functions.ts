import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { serverClient } from "./supabase-server";

export const listTenantsFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ search: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    let q = sb.from("tenants").select("*").order("name", { ascending: true });
    if (data.search && data.search.trim()) {
      const s = data.search.trim().replace(/[%,]/g, " ");
      q = q.or(`name.ilike.%${s}%,phone.ilike.%${s}%,id_number.ilike.%${s}%`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getTenantFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: row, error } = await sb.from("tenants").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("NOT_FOUND");
    return row;
  });

const TenantUpsertInput = z.object({
  name: z.string().min(2, "الاسم قصير جداً"),
  phone: z.string().default(""),
  email: z.string().default(""),
  idNumber: z.string().default(""),
  idType: z.string().default("national_id"),
  address: z.string().default(""),
  nationality: z.string().default(""),
  emergencyContact: z.string().default(""),
  emergencyPhone: z.string().default(""),
  notes: z.string().default(""),
});

export const createTenantFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => TenantUpsertInput.parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: row, error } = await sb
      .from("tenants")
      .insert({
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email.trim(),
        id_number: data.idNumber.trim(),
        id_type: data.idType,
        address: data.address.trim(),
        nationality: data.nationality.trim(),
        emergency_contact: data.emergencyContact.trim(),
        emergency_phone: data.emergencyPhone.trim(),
        notes: data.notes.trim(),
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateTenantFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => TenantUpsertInput.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: row, error } = await sb
      .from("tenants")
      .update({
        name: data.name.trim(),
        phone: data.phone.trim(),
        email: data.email.trim(),
        id_number: data.idNumber.trim(),
        id_type: data.idType,
        address: data.address.trim(),
        nationality: data.nationality.trim(),
        emergency_contact: data.emergencyContact.trim(),
        emergency_phone: data.emergencyPhone.trim(),
        notes: data.notes.trim(),
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteTenantFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { error } = await sb.from("tenants").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
