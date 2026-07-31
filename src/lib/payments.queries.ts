import { queryOptions } from "@tanstack/react-query";
import { listPaymentsFn } from "./payments.functions";
import type { Payment } from "./types";

export type PaymentRow = {
  id: string;
  due_id: string | null;
  contract_id: string;
  tenant_id: string;
  amount: number;
  payment_date: string;
  payment_method: string;
  receipt_number: string;
  notes: string;
  created_at: string;
  tenants?: { name: string } | null;
  dues?: { title: string } | null;
};

export function mapPayment(r: PaymentRow): Payment {
  return {
    id: r.id,
    dueId: r.due_id ?? null,
    contractId: r.contract_id,
    tenantId: r.tenant_id,
    amount: Number(r.amount ?? 0),
    paymentDate: r.payment_date,
    paymentMethod: r.payment_method as Payment["paymentMethod"],
    receiptNumber: r.receipt_number,
    notes: r.notes ?? "",
    createdAt: r.created_at,
    tenantName: r.tenants?.name ?? "",
    dueTitle: r.dues?.title ?? "",
  };
}

export function paymentsQuery(filter: { contractId?: string; tenantId?: string; dueId?: string } = {}) {
  return queryOptions({
    queryKey: ["payments", filter],
    queryFn: async () =>
      (await listPaymentsFn({ data: filter })).map((r) => mapPayment(r as PaymentRow)),
    staleTime: 15_000,
  });
}
