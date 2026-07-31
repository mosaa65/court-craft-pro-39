import { queryOptions } from "@tanstack/react-query";
import { listDuesFn } from "./dues.functions";
import type { Due } from "./types";

export type DueRow = {
  id: string;
  contract_id: string;
  due_date: string;
  amount: number;
  paid_amount: number;
  status: string;
  title: string;
  created_at: string;
  updated_at: string;
  contracts?: {
    contract_number: string;
    tenant_id?: string;
    unit_id?: string;
    tenants?: { id: string; name: string; phone: string } | null;
    units?: { unit_number: string; properties?: { id: string; name: string; image_url?: string | null } | null } | null;
  } | null;
};

export function mapDue(r: DueRow): Due {
  return {
    id: r.id,
    contractId: r.contract_id,
    dueDate: r.due_date,
    amount: Number(r.amount ?? 0),
    paidAmount: Number(r.paid_amount ?? 0),
    status: r.status as Due["status"],
    title: r.title ?? "استحقاق",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    tenantId: r.contracts?.tenants?.id ?? r.contracts?.tenant_id ?? "",
    tenantName: r.contracts?.tenants?.name ?? "",
    tenantPhone: r.contracts?.tenants?.phone ?? "",
    unitNumber: r.contracts?.units?.unit_number ?? "",
    propertyId: r.contracts?.units?.properties?.id ?? "",
    propertyName: r.contracts?.units?.properties?.name ?? "",
    propertyImageUrl: r.contracts?.units?.properties?.image_url ?? null,
  };
}

export function duesQuery(filter: { contractId?: string; status?: string; tenantId?: string } = {}) {
  return queryOptions({
    queryKey: ["dues", filter],
    queryFn: async () =>
      (await listDuesFn({ data: filter })).map((r) => mapDue(r as DueRow)),
    staleTime: 15_000,
  });
}
