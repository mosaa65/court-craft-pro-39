import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { X, Search, User, Phone, UserPlus } from "lucide-react";
import { customersQuery } from "@/lib/customers.queries";
import { Link } from "@tanstack/react-router";
import type { Customer } from "@/lib/mock";

export function CustomerPickerSheet({
  open,
  onOpenChange,
  onPick,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onPick: (c: Customer) => void;
}) {
  const [search, setSearch] = useState("");
  const { data: customers = [], isLoading } = useQuery({
    ...customersQuery(search),
    enabled: open,
  });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70]" dir="rtl">
      <button
        aria-label="إغلاق"
        onClick={() => onOpenChange(false)}
        className="absolute inset-0 animate-fade bg-ink/50 backdrop-blur-[2px]"
      />
      <div
        role="dialog"
        aria-modal="true"
        className="animate-sheet absolute inset-x-0 bottom-0 mx-auto flex max-h-[90vh] max-w-[440px] flex-col overflow-hidden rounded-t-[2rem] bg-card shadow-[var(--shadow-elev-3)]"
      >
        <div className="p-6 pb-3">
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-stone-line" />
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">اختر عميلًا</h3>
            <button
              onClick={() => onOpenChange(false)}
              aria-label="إغلاق"
              className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          <div className="relative mt-4">
            <Search className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="ابحث بالاسم أو الهاتف"
              className="h-12 w-full rounded-2xl border border-stone-line bg-card px-4 pr-11 text-sm font-medium focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10"
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 pb-6">
          {isLoading ? (
            <p className="p-6 text-center text-xs text-muted-foreground">جارِ التحميل...</p>
          ) : customers.length === 0 ? (
            <div className="mt-4 rounded-2xl border border-dashed border-stone-line p-8 text-center">
              <User className="mx-auto mb-2 size-8 text-muted-foreground" />
              <p className="text-sm font-bold">لا يوجد عملاء مطابقون</p>
              <Link
                to="/customers"
                onClick={() => onOpenChange(false)}
                className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-bold text-primary-foreground"
              >
                <UserPlus className="size-3.5" /> إضافة عميل جديد
              </Link>
            </div>
          ) : (
            <ul className="space-y-2">
              {customers.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => onPick(c)}
                    className="flex w-full items-center gap-3 rounded-2xl border border-stone-line bg-card p-3 text-right transition hover:border-primary/40 active:scale-[0.99]"
                  >
                    <div className="grid size-11 place-items-center rounded-full bg-primary/10 text-primary">
                      <User className="size-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-bold">{c.name}</p>
                      {c.phone && (
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground" dir="ltr">
                          <Phone className="size-2.5" />
                          {c.phone}
                        </p>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
