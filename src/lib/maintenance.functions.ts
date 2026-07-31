import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { serverClient } from "./supabase-server";

export const listMaintenanceFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ propertyId: z.string().optional(), status: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    let q = sb
      .from("maintenance_requests")
      .select("*, properties(name), units(unit_number), tenants(name)")
      .order("created_at", { ascending: false });

    if (data.propertyId) q = q.eq("property_id", data.propertyId);
    if (data.status && data.status !== "all") q = q.eq("status", data.status as never);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const CreateMaintenanceInput = z.object({
  propertyId: z.string().uuid("اختر العقار"),
  unitId: z.string().uuid("اختر الوحدة"),
  tenantId: z.string().uuid().nullable().optional(),
  title: z.string().min(2, "عنوان الطلب مطلوب"),
  description: z.string().default(""),
  category: z.string().default("general"),
  priority: z.enum(["urgent", "high", "medium", "low"]).default("medium"),
  cost: z.number().nonnegative().default(0),
  notes: z.string().default(""),
});

export const createMaintenanceFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreateMaintenanceInput.parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: row, error } = await sb
      .from("maintenance_requests")
      .insert({
        property_id: data.propertyId,
        unit_id: data.unitId,
        tenant_id: data.tenantId ?? null,
        title: data.title,
        description: data.description,
        category: data.category,
        priority: data.priority,
        status: "new",
        cost: data.cost,
        notes: data.notes,
      })
      .select("*")
      .single();

    if (error) throw new Error(error.message);
    return row;
  });

export const updateMaintenanceStatusFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["new", "in_progress", "completed", "cancelled"]), cost: z.number().optional() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const updateData: { status: "new" | "in_progress" | "completed" | "cancelled"; cost?: number } = { status: data.status };
    if (data.cost !== undefined) updateData.cost = data.cost;

    const { data: row, error } = await sb
      .from("maintenance_requests")
      .update(updateData)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });
