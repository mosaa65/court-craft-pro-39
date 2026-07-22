import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { serverClient } from "./supabase-server";

export const listUnitsFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ propertyId: z.string().optional(), search: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    let q = sb.from("units").select("*, properties(name)").order("unit_number", { ascending: true });
    if (data.propertyId) {
      q = q.eq("property_id", data.propertyId);
    }
    if (data.search && data.search.trim()) {
      const s = data.search.trim().replace(/[%,]/g, " ");
      q = q.or(`unit_number.ilike.%${s}%`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getUnitFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: row, error } = await sb.from("units").select("*, properties(name)").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("NOT_FOUND");
    return row;
  });

const UnitUpsertInput = z.object({
  propertyId: z.string().uuid("يرجى اختيار العقار"),
  unitNumber: z.string().min(1, "رقم الوحدة مطلوب"),
  type: z.enum(["apartment", "room", "shop", "office", "studio", "floor", "villa"]),
  floor: z.number().int().default(0),
  area: z.number().nonnegative().default(0),
  rooms: z.number().int().nonnegative().default(1),
  bathrooms: z.number().int().nonnegative().default(1),
  furnished: z.enum(["furnished", "semi_furnished", "unfurnished"]).default("unfurnished"),
  rentPrice: z.number().nonnegative().default(0),
  depositAmount: z.number().nonnegative().default(0),
  status: z.enum(["available", "reserved", "rented", "under_maintenance", "unavailable"]).default("available"),
});

export const createUnitFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => UnitUpsertInput.parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: row, error } = await sb
      .from("units")
      .insert({
        property_id: data.propertyId,
        unit_number: data.unitNumber,
        type: data.type,
        floor: data.floor,
        area: data.area,
        rooms: data.rooms,
        bathrooms: data.bathrooms,
        furnished: data.furnished,
        rent_price: data.rentPrice,
        deposit_amount: data.depositAmount,
        status: data.status,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateUnitFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => UnitUpsertInput.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: row, error } = await sb
      .from("units")
      .update({
        property_id: data.propertyId,
        unit_number: data.unitNumber,
        type: data.type,
        floor: data.floor,
        area: data.area,
        rooms: data.rooms,
        bathrooms: data.bathrooms,
        furnished: data.furnished,
        rent_price: data.rentPrice,
        deposit_amount: data.depositAmount,
        status: data.status,
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteUnitFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { error } = await sb.from("units").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
