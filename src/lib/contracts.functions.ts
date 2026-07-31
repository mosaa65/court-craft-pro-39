import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { serverClient } from "./supabase-server";

export const listContractsFn = createServerFn({ method: "POST" })
  .inputValidator(
    (d: unknown) =>
      z
        .object({
          tenantId: z.string().optional(),
          unitId: z.string().optional(),
          status: z.string().optional(),
          search: z.string().optional(),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    const sb = serverClient();
    let q = sb
      .from("contracts")
      .select("*, tenants(name, phone), units(unit_number, properties(name))")
      .order("created_at", { ascending: false });

    if (data.tenantId) q = q.eq("tenant_id", data.tenantId);
    if (data.unitId) q = q.eq("unit_id", data.unitId);
    if (data.status && data.status !== "all") q = q.eq("status", data.status as never);
    if (data.search && data.search.trim()) {
      const s = data.search.trim().replace(/[%,]/g, " ");
      q = q.or(`contract_number.ilike.%${s}%`);
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const getContractFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: row, error } = await sb
      .from("contracts")
      .select("*, tenants(name, phone), units(unit_number, properties(name))")
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("NOT_FOUND");
    return row;
  });

const CreateContractInput = z.object({
  tenantId: z.string().uuid("يرجى اختيار المستأجر"),
  unitId: z.string().uuid("يرجى اختيار الوحدة"),
  startDate: z.string().min(1, "تاريخ البداية مطلوب"),
  endDate: z.string().min(1, "تاريخ النهاية مطلوب"),
  durationMonths: z.number().int().min(1).default(12),
  rentAmount: z.number().positive("مبلغ الإيجار مطلوب"),
  depositAmount: z.number().nonnegative().default(0),
  paymentCycle: z.enum(["monthly", "quarterly", "semi_annual", "annual", "custom"]).default("monthly"),
  paymentTiming: z.enum(["advance", "arrears"]).default("advance"),
  customMonths: z.number().int().positive().nullable().optional(),
  autoRenew: z.boolean().default(false),
  notes: z.string().default(""),
});

export const createContractFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreateContractInput.parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();

    // 1. Check if unit is already rented
    const { data: unit, error: unitErr } = await sb.from("units").select("status, unit_number").eq("id", data.unitId).single();
    if (unitErr || !unit) throw new Error("الوحدة غير موجودة");
    if (unit.status === "rented") {
      throw new Error("الوحدة مؤجرة بالفعل ولديه عقد نشط");
    }

    // 2. Generate contract number e.g. CNT-2026-0001
    const contractNumber = `CNT-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // 3. Create contract
    const { data: contract, error: contractErr } = await sb
      .from("contracts")
      .insert({
        contract_number: contractNumber,
        tenant_id: data.tenantId,
        unit_id: data.unitId,
        start_date: data.startDate,
        end_date: data.endDate,
        duration_months: data.durationMonths,
        rent_amount: data.rentAmount,
        deposit_amount: data.depositAmount,
        payment_cycle: data.paymentCycle,
        payment_timing: data.paymentTiming,
        custom_months: data.customMonths ?? null,
        status: "active",
        auto_renew: data.autoRenew,
        notes: data.notes,
      })
      .select("*")
      .single();

    if (contractErr) throw new Error(contractErr.message);

    // 4. Update unit status to rented
    await sb.from("units").update({ status: "rented" }).eq("id", data.unitId);

    // 5. Generate Dues Schedule Automatically!
    const stepMonths =
      data.paymentCycle === "monthly" ? 1 :
      data.paymentCycle === "quarterly" ? 3 :
      data.paymentCycle === "semi_annual" ? 6 :
      data.paymentCycle === "annual" ? 12 :
      (data.customMonths || 1);

    const totalDuesCount = Math.max(1, Math.floor(data.durationMonths / stepMonths));
    const dueAmount = Math.round((data.rentAmount / totalDuesCount) * 100) / 100;

    const duesToInsert = [];
    const startObj = new Date(data.startDate);

    for (let i = 0; i < totalDuesCount; i++) {
      const dueDateObj = new Date(startObj);
      dueDateObj.setMonth(dueDateObj.getMonth() + i * stepMonths);
      const dueDateStr = dueDateObj.toISOString().split("T")[0];

      duesToInsert.push({
        contract_id: contract.id,
        due_date: dueDateStr,
        amount: dueAmount,
        paid_amount: 0,
        status: "pending",
        title: `دفعة إيجار (${i + 1} من ${totalDuesCount})`,
      });
    }

    if (duesToInsert.length > 0) {
      await sb.from("dues").insert(duesToInsert);
    }

    // 6. Create Notification
    const { data: tenant } = await sb.from("tenants").select("name").eq("id", data.tenantId).maybeSingle();
    await sb.from("notifications").insert({
      kind: "contract_created",
      title: "عقد جديد",
      body: `تم إبرام العقد ${contractNumber} للمستأجر ${tenant?.name ?? ""} بقيمة ${data.rentAmount.toLocaleString("ar-SA")} ر.س`,
      contract_id: contract.id,
      tenant_id: data.tenantId,
    });

    return contract;
  });

export const updateContractStatusFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid(), status: z.enum(["active", "expired", "terminated", "cancelled", "renewed"]) }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: row, error } = await sb
      .from("contracts")
      .update({ status: data.status })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    // If terminated or cancelled or expired, set unit back to available
    if (["expired", "terminated", "cancelled"].includes(data.status)) {
      await sb.from("units").update({ status: "available" }).eq("id", row.unit_id);
    }

    return row;
  });

export const deleteContractFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: c } = await sb.from("contracts").select("unit_id").eq("id", data.id).single();
    const { error } = await sb.from("contracts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    if (c?.unit_id) {
      await sb.from("units").update({ status: "available" }).eq("id", c.unit_id);
    }
    return { ok: true };
  });
