import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { serverClient } from "./supabase-server";

export const listPropertiesFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ search: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    let q = sb.from("properties").select("*").order("created_at", { ascending: false });
    if (data.search && data.search.trim()) {
      const s = data.search.trim().replace(/[%,]/g, " ");
      q = q.or(`name.ilike.%${s}%,city.ilike.%${s}%,district.ilike.%${s}%`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getPropertyFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: row, error } = await sb.from("properties").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("NOT_FOUND");
    return row;
  });

const PropertyUpsertInput = z.object({
  name: z.string().min(2, "اسم العقار قصير جداً"),
  type: z.enum(["building", "villa", "apartment_complex", "commercial", "land"]),
  description: z.string().default(""),
  city: z.string().default(""),
  district: z.string().default(""),
  location: z.string().default(""),
  floorsCount: z.number().int().nonnegative().default(1),
  totalArea: z.number().nonnegative().default(0),
  yearBuilt: z.number().int().optional().nullable(),
  amenities: z.array(z.string()).default([]),
  status: z.enum(["active", "inactive", "under_maintenance"]).default("active"),
  imageUrl: z.string().nullable().optional(),
});

export const createPropertyFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PropertyUpsertInput.parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: row, error } = await sb
      .from("properties")
      .insert({
        name: data.name,
        type: data.type,
        description: data.description,
        city: data.city,
        district: data.district,
        location: data.location,
        floors_count: data.floorsCount,
        total_area: data.totalArea,
        year_built: data.yearBuilt ?? null,
        amenities: data.amenities,
        status: data.status,
        image_url: data.imageUrl ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updatePropertyFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => PropertyUpsertInput.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: row, error } = await sb
      .from("properties")
      .update({
        name: data.name,
        type: data.type,
        description: data.description,
        city: data.city,
        district: data.district,
        location: data.location,
        floors_count: data.floorsCount,
        total_area: data.totalArea,
        year_built: data.yearBuilt ?? null,
        amenities: data.amenities,
        status: data.status,
        image_url: data.imageUrl ?? null,
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deletePropertyFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { error } = await sb.from("properties").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
