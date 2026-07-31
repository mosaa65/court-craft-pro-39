import { queryOptions } from "@tanstack/react-query";
import { listContractsFn, getContractFn } from "./contracts.functions";
import type { Contract } from "./types";

export type ContractRow = {
  id: string;
  contract_number: string;
  tenant_id: string;
  unit_id: string;
  start_date: string;
  end_date: string;
  duration_months: number;
  rent_amount: number;
  deposit_amount: number;
  payment_cycle: string;
  payment_timing: string;
  custom_months: number | null;
  status: string;
  auto_renew: boolean;
  notes: string;
  created_at: string;
  updated_at: string;
  tenants?: { name: string; phone: string } | null;
  units?: { unit_number: string; properties?: { name: string } | null } | null;
};

export function mapContract(r: ContractRow): Contract {
  return {
    id: r.id,
    contractNumber: r.contract_number,
    tenantId: r.tenant_id,
    unitId: r.unit_id,
    startDate: r.start_date,
    endDate: r.end_date,
    durationMonths: Number(r.duration_months ?? 12),
    rentAmount: Number(r.rent_amount ?? 0),
    depositAmount: Number(r.deposit_amount ?? 0),
    paymentCycle: r.payment_cycle as Contract["paymentCycle"],
    paymentTiming: r.payment_timing as Contract["paymentTiming"],
    customMonths: r.custom_months ? Number(r.custom_months) : null,
    status: r.status as Contract["status"],
    autoRenew: Boolean(r.auto_renew),
    notes: r.notes ?? "",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    tenantName: r.tenants?.name ?? "",
    tenantPhone: r.tenants?.phone ?? "",
    unitNumber: r.units?.unit_number ?? "",
    propertyName: r.units?.properties?.name ?? "",
  };
}

export function contractsQuery(filter: { tenantId?: string; unitId?: string; status?: string; search?: string } = {}) {
  return queryOptions({
    queryKey: ["contracts", filter],
    queryFn: async () =>
      (await listContractsFn({ data: filter })).map((r) => mapContract(r as ContractRow)),
    staleTime: 30_000,
  });
}

export function contractQuery(id: string) {
  return queryOptions({
    queryKey: ["contract", id],
    queryFn: async () => mapContract((await getContractFn({ data: { id } })) as ContractRow),
    staleTime: 30_000,
  });
}
