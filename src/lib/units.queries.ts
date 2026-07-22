import { queryOptions } from "@tanstack/react-query";
import { listUnitsFn, getUnitFn } from "./units.functions";
import type { Unit } from "./types";

export type UnitRow = {
  id: string;
  property_id: string;
  unit_number: string;
  type: string;
  floor: number;
  area: number;
  rooms: number;
  bathrooms: number;
  furnished: string;
  rent_price: number;
  deposit_amount: number;
  status: string;
  created_at: string;
  updated_at: string;
  properties?: { name: string } | null;
};

export function mapUnit(r: UnitRow): Unit {
  return {
    id: r.id,
    propertyId: r.property_id,
    unitNumber: r.unit_number,
    type: r.type as Unit["type"],
    floor: Number(r.floor ?? 0),
    area: Number(r.area ?? 0),
    rooms: Number(r.rooms ?? 1),
    bathrooms: Number(r.bathrooms ?? 1),
    furnished: r.furnished as Unit["furnished"],
    rentPrice: Number(r.rent_price ?? 0),
    depositAmount: Number(r.deposit_amount ?? 0),
    status: r.status as Unit["status"],
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    propertyName: r.properties?.name ?? "",
  };
}

export function unitsQuery(filter: { propertyId?: string; search?: string } = {}) {
  return queryOptions({
    queryKey: ["units", filter],
    queryFn: async () =>
      (await listUnitsFn({ data: filter })).map((r) => mapUnit(r as UnitRow)),
    staleTime: 30_000,
  });
}

export function unitQuery(id: string) {
  return queryOptions({
    queryKey: ["unit", id],
    queryFn: async () => mapUnit((await getUnitFn({ data: { id } })) as UnitRow),
    staleTime: 30_000,
  });
}
