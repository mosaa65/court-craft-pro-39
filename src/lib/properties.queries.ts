import { queryOptions } from "@tanstack/react-query";
import { listPropertiesFn, getPropertyFn } from "./properties.functions";
import type { Property } from "./types";

export type PropertyRow = {
  id: string;
  name: string;
  type: string;
  description: string;
  city: string;
  district: string;
  location: string;
  floors_count: number;
  total_area: number;
  year_built: number | null;
  amenities: string[];
  status: string;
  image_url: string | null;
  created_at: string;
  updated_at: string;
};

export function mapProperty(r: PropertyRow): Property {
  return {
    id: r.id,
    name: r.name,
    type: r.type as Property["type"],
    description: r.description ?? "",
    city: r.city ?? "",
    district: r.district ?? "",
    location: r.location ?? "",
    floorsCount: Number(r.floors_count ?? 1),
    totalArea: Number(r.total_area ?? 0),
    yearBuilt: r.year_built ? Number(r.year_built) : null,
    amenities: r.amenities ?? [],
    status: r.status as Property["status"],
    imageUrl: r.image_url ?? null,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export function propertiesQuery(search?: string) {
  return queryOptions({
    queryKey: ["properties", search ?? ""],
    queryFn: async () =>
      (await listPropertiesFn({ data: { search } })).map((r) => mapProperty(r as PropertyRow)),
    staleTime: 30_000,
  });
}

export function propertyQuery(id: string) {
  return queryOptions({
    queryKey: ["property", id],
    queryFn: async () => mapProperty((await getPropertyFn({ data: { id } })) as PropertyRow),
    staleTime: 30_000,
  });
}
