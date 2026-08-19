import { queryOptions } from "@tanstack/react-query";
import { listCustomersFn, getCustomerFn } from "./customers.functions";
import type { Customer } from "./mock";
import { filterOfflineCustomers, readOfflineRow, readOfflineRows, saveOfflineRows } from "./offline-store";

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
    queryFn: async () => {
      try {
        const rows = (await listCustomersFn({ data: { search } })) as CustomerRow[];
        await saveOfflineRows("customers", rows);
        return rows.map(mapCustomer);
      } catch (error) {
        const rows = filterOfflineCustomers(await readOfflineRows<CustomerRow>("customers"), search);
        if (!rows.length && !search) throw error;
        return rows.map(mapCustomer);
      }
    },
    staleTime: 30_000,
    networkMode: "always",
    retry: false,
  });
}

export function customerQuery(id: string) {
  return queryOptions({
    queryKey: ["customer", id],
    queryFn: async () => {
      try {
        const row = (await getCustomerFn({ data: { id } })) as CustomerRow;
        await saveOfflineRows("customers", [row]);
        return mapCustomer(row);
      } catch (error) {
        const row = await readOfflineRow<CustomerRow>("customers", id);
        if (!row) throw error;
        return mapCustomer(row);
      }
    },
    staleTime: 60_000,
    networkMode: "always",
    retry: false,
  });
}
