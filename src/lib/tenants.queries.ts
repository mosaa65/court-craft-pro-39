import { queryOptions } from "@tanstack/react-query";
import { listTenantsFn, getTenantFn } from "./tenants.functions";
import type { Tenant } from "./types";

export type TenantRow = {
  id: string;
  name: string;
  phone: string;
  email: string;
  id_number: string;
  id_type: string;
  address: string;
  nationality: string;
  emergency_contact: string;
  emergency_phone: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export function mapTenant(r: TenantRow): Tenant {
  return {
    id: r.id,
    name: r.name,
    phone: r.phone ?? "",
    email: r.email ?? "",
    idNumber: r.id_number ?? "",
    idType: r.id_type ?? "national_id",
    address: r.address ?? "",
    nationality: r.nationality ?? "",
    emergencyContact: r.emergency_contact ?? "",
    emergencyPhone: r.emergency_phone ?? "",
    notes: r.notes ?? "",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function tenantsQuery(search?: string) {
  return queryOptions({
    queryKey: ["tenants", search ?? ""],
    queryFn: async () =>
      (await listTenantsFn({ data: { search } })).map((r) => mapTenant(r as TenantRow)),
    staleTime: 30_000,
  });
}

export function tenantQuery(id: string) {
  return queryOptions({
    queryKey: ["tenant", id],
    queryFn: async () => mapTenant((await getTenantFn({ data: { id } })) as TenantRow),
    staleTime: 30_000,
  });
}
