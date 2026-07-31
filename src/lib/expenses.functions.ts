import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { serverClient } from "./supabase-server";

export const listExpensesFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ propertyId: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    let q = sb
      .from("expenses")
      .select("*, properties(name), units(unit_number)")
      .order("expense_date", { ascending: false });

    if (data.propertyId) q = q.eq("property_id", data.propertyId);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const CreateExpenseInput = z.object({
  propertyId: z.string().uuid().nullable().optional(),
  unitId: z.string().uuid().nullable().optional(),
  category: z.enum(["maintenance", "electricity", "water", "cleaning", "services", "fees", "other"]),
  amount: z.number().positive("المبلغ يجب أن يكون أكبر من 0"),
  description: z.string().min(1, "البيان مطلوب"),
  expenseDate: z.string().min(1, "تاريخ المصروف مطلوب"),
  vendor: z.string().default(""),
  notes: z.string().default(""),
});

export const createExpenseFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreateExpenseInput.parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: row, error } = await sb
      .from("expenses")
      .insert({
        property_id: data.propertyId ?? null,
        unit_id: data.unitId ?? null,
        category: data.category,
        amount: data.amount,
        description: data.description,
        expense_date: data.expenseDate,
        vendor: data.vendor,
        notes: data.notes,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return row;
  });

export const deleteExpenseFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { error } = await sb.from("expenses").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
