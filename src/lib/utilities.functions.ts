import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { serverClient } from "./supabase-server";

export const listUtilitiesFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ unitId: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    let q = sb
      .from("utility_readings")
      .select("*, units(unit_number, properties(name))")
      .order("reading_date", { ascending: false });

    if (data.unitId) q = q.eq("unit_id", data.unitId);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const CreateUtilityInput = z.object({
  unitId: z.string().uuid("اختر الوحدة"),
  type: z.enum(["electricity", "water"]),
  previousReading: z.number().nonnegative(),
  currentReading: z.number().nonnegative(),
  pricePerUnit: z.number().nonnegative(),
  readingDate: z.string().min(1),
  billedToTenant: z.boolean().default(true),
  notes: z.string().default(""),
});

export const createUtilityReadingFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreateUtilityInput.parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const consumed = Math.max(0, data.currentReading - data.previousReading);
    const totalAmount = Math.round(consumed * data.pricePerUnit * 100) / 100;

    const { data: row, error } = await sb
      .from("utility_readings")
      .insert({
        unit_id: data.unitId,
        type: data.type,
        previous_reading: data.previousReading,
        current_reading: data.currentReading,
        price_per_unit: data.pricePerUnit,
        total_amount: totalAmount,
        reading_date: data.readingDate,
        billed_to_tenant: data.billedToTenant,
        notes: data.notes,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return row;
  });
