import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { serverClient } from "./supabase-server";

export const listPaymentsFn = createServerFn({ method: "POST" })
  .inputValidator(
    (d: unknown) =>
      z
        .object({
          contractId: z.string().optional(),
          tenantId: z.string().optional(),
          dueId: z.string().optional(),
        })
        .parse(d),
  )
  .handler(async ({ data }) => {
    const sb = serverClient();
    let q = sb
      .from("payments")
      .select("*, tenants(name), dues(title)")
      .order("payment_date", { ascending: false });

    if (data.contractId) q = q.eq("contract_id", data.contractId);
    if (data.tenantId) q = q.eq("tenant_id", data.tenantId);
    if (data.dueId) q = q.eq("due_id", data.dueId);

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

const CreatePaymentInput = z.object({
  dueId: z.string().uuid().nullable().optional(),
  contractId: z.string().uuid("يرجى اختيار العقد"),
  tenantId: z.string().optional(),
  amount: z.number().positive("المبلغ يجب أن يكون أكبر من 0"),
  paymentMethod: z.enum(["cash", "transfer", "card", "cheque", "other"]).default("transfer"),
  notes: z.string().default(""),
});

export const createPaymentFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CreatePaymentInput.parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const receiptNumber = `REC-${new Date().getFullYear()}-${Math.floor(10000 + Math.random() * 90000)}`;

    let finalTenantId = data.tenantId;

    // Auto-resolve tenantId from contract if missing
    if (!finalTenantId) {
      const { data: contract } = await sb
        .from("contracts")
        .select("tenant_id")
        .eq("id", data.contractId)
        .single();
      if (contract?.tenant_id) {
        finalTenantId = contract.tenant_id;
      }
    }

    if (!finalTenantId) {
      throw new Error("يرجى اختيار المستأجر بالسند");
    }

    // 1. Insert Payment
    const { data: payment, error: pErr } = await sb
      .from("payments")
      .insert({
        due_id: data.dueId ?? null,
        contract_id: data.contractId,
        tenant_id: finalTenantId,
        amount: data.amount,
        payment_method: data.paymentMethod,
        receipt_number: receiptNumber,
        notes: data.notes,
      })
      .select("*")
      .single();

    if (pErr) throw new Error(pErr.message);

    // 2. If tied to a Due, update the Due's paid_amount and status
    if (data.dueId) {
      const { data: due } = await sb.from("dues").select("amount, paid_amount").eq("id", data.dueId).single();
      if (due) {
        const newPaidAmount = Number(due.paid_amount || 0) + data.amount;
        const totalAmount = Number(due.amount || 0);
        let newStatus: "paid" | "partially_paid" | "pending" = "pending";

        if (newPaidAmount >= totalAmount) {
          newStatus = "paid";
        } else if (newPaidAmount > 0) {
          newStatus = "partially_paid";
        }

        await sb
          .from("dues")
          .update({
            paid_amount: newPaidAmount,
            status: newStatus,
          })
          .eq("id", data.dueId);
      }
    }

    // 3. Notification
    const { data: tenant } = await sb.from("tenants").select("name").eq("id", finalTenantId).maybeSingle();
    await sb.from("notifications").insert({
      kind: "payment_received",
      title: "تم تسجيل عملية سداد",
      body: `تم استلام مبلغ ${data.amount.toLocaleString("ar-SA")} ر.س من المستأجر ${tenant?.name ?? ""} - سند رقم ${receiptNumber}`,
      contract_id: data.contractId,
      tenant_id: finalTenantId,
      due_id: data.dueId ?? null,
    });

    return payment;
  });
