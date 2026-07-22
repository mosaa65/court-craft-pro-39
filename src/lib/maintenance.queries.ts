import { queryOptions } from "@tanstack/react-query";
import { listMaintenanceFn } from "./maintenance.functions";
import type { MaintenanceRequest } from "./types";

export type MaintenanceRow = {
  id: string;
  property_id: string;
  unit_id: string;
  tenant_id: string | null;
  title: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  cost: number;
  images: string[];
  notes: string;
  created_at: string;
  updated_at: string;
  properties?: { name: string } | null;
  units?: { unit_number: string } | null;
  tenants?: { name: string } | null;
};

export function mapMaintenance(r: MaintenanceRow): MaintenanceRequest {
  return {
    id: r.id,
    propertyId: r.property_id,
    unitId: r.unit_id,
    tenantId: r.tenant_id ?? null,
    title: r.title,
    description: r.description ?? "",
    category: r.category ?? "general",
    priority: r.priority as MaintenanceRequest["priority"],
    status: r.status as MaintenanceRequest["status"],
    cost: Number(r.cost ?? 0),
    images: r.images ?? [],
    notes: r.notes ?? "",
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    propertyName: r.properties?.name ?? "",
    unitNumber: r.units?.unit_number ?? "",
    tenantName: r.tenants?.name ?? "",
  };
}

export function maintenanceQuery(filter: { propertyId?: string; status?: string } = {}) {
  return queryOptions({
    queryKey: ["maintenance", filter],
    queryFn: async () =>
      (await listMaintenanceFn({ data: filter })).map((r) => mapMaintenance(r as MaintenanceRow)),
    staleTime: 30_000,
  });
}
