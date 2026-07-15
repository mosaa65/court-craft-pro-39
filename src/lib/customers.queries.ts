import { queryOptions } from "@tanstack/react-query";
import { listCustomersFn, getCustomerFn } from "./customers.functions";
import type { Customer } from "./mock";

export type CustomerRow = {
  id: string;
  name: string;
  phone: string;
  notes: string;
  created_at: string;
};

export function mapCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    name: row.name,
    phone: row.phone,
    notes: row.notes ?? "",
    createdAt: row.created_at,
  };
}

export function customersQuery(search?: string) {
  return queryOptions({
    queryKey: ["customers", search ?? ""],
    queryFn: async () =>
      (await listCustomersFn({ data: { search } })).map((r) => mapCustomer(r as CustomerRow)),
    staleTime: 30_000,
  });
}

export function customerQuery(id: string) {
  return queryOptions({
    queryKey: ["customer", id],
    queryFn: async () => mapCustomer((await getCustomerFn({ data: { id } })) as CustomerRow),
    staleTime: 60_000,
  });
}
