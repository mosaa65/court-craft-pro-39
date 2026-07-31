import { queryOptions } from "@tanstack/react-query";
import { listExpensesFn } from "./expenses.functions";
import type { Expense } from "./types";

export type ExpenseRow = {
  id: string;
  property_id: string | null;
  unit_id: string | null;
  category: string;
  amount: number;
  description: string;
  expense_date: string;
  vendor: string;
  receipt_url: string | null;
  notes: string;
  created_at: string;
  properties?: { name: string } | null;
  units?: { unit_number: string } | null;
};

export function mapExpense(r: ExpenseRow): Expense {
  return {
    id: r.id,
    propertyId: r.property_id ?? null,
    unitId: r.unit_id ?? null,
    category: r.category as Expense["category"],
    amount: Number(r.amount ?? 0),
    description: r.description ?? "",
    expenseDate: r.expense_date,
    vendor: r.vendor ?? "",
    receiptUrl: r.receipt_url ?? null,
    notes: r.notes ?? "",
    createdAt: r.created_at,
    propertyName: r.properties?.name ?? "",
    unitNumber: r.units?.unit_number ?? "",
  };
}

export function expensesQuery(propertyId?: string) {
  return queryOptions({
    queryKey: ["expenses", propertyId ?? ""],
    queryFn: async () =>
      (await listExpensesFn({ data: { propertyId } })).map((r) => mapExpense(r as ExpenseRow)),
    staleTime: 30_000,
  });
}
