import { queryOptions } from "@tanstack/react-query";
import { listUtilitiesFn } from "./utilities.functions";
import type { UtilityReading } from "./types";

export type UtilityRow = {
  id: string;
  unit_id: string;
  type: string;
  previous_reading: number;
  current_reading: number;
  price_per_unit: number;
  total_amount: number;
  reading_date: string;
  billed_to_tenant: boolean;
  notes: string;
  created_at: string;
  units?: { unit_number: string; properties?: { name: string } | null } | null;
};

export function mapUtility(r: UtilityRow): UtilityReading {
  return {
    id: r.id,
    unitId: r.unit_id,
    type: r.type as UtilityReading["type"],
    previousReading: Number(r.previous_reading ?? 0),
    currentReading: Number(r.current_reading ?? 0),
    pricePerUnit: Number(r.price_per_unit ?? 0),
    totalAmount: Number(r.total_amount ?? 0),
    readingDate: r.reading_date,
    billedToTenant: Boolean(r.billed_to_tenant),
    notes: r.notes ?? "",
    createdAt: r.created_at,
    unitNumber: r.units?.unit_number ?? "",
    propertyName: r.units?.properties?.name ?? "",
  };
}

export function utilitiesQuery(unitId?: string) {
  return queryOptions({
    queryKey: ["utilities", unitId ?? ""],
    queryFn: async () =>
      (await listUtilitiesFn({ data: { unitId } })).map((r) => mapUtility(r as UtilityRow)),
    staleTime: 30_000,
  });
}
