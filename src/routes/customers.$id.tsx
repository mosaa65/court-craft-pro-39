import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, Phone, Mail, FileText, Trash2, Edit, MessageCircle, Send } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { tenantQuery } from "@/lib/tenants.queries";
import { contractsQuery } from "@/lib/contracts.queries";
import { duesQuery } from "@/lib/dues.queries";
import { deleteTenantFn } from "@/lib/tenants.functions";
import { TenantFormSheet } from "@/components/tenant-form-sheet";
import { toArabicDigits, formatDate, contractStatusMeta, dueStatusMeta, openWhatsApp, openSMS } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/customers/$id")({
  head: () => ({
    meta: [{ title: "تفاصيل المستأجر — السجل والعقود" }],
  }),
  component: TenantDetailPage,
});

function TenantDetailPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: tenant, isLoading } = useQuery(tenantQuery(id));
  const { data: tenantContracts = [] } = useQuery(contractsQuery({ tenantId: id }));
  const { data: tenantDues = [] } = useQuery(duesQuery({ tenantId: id }));

  const [editOpen, setEditOpen] = useState(false);

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!confirm("هل أنت تأكد من حذف بيانات المستأجر؟")) return;
      await deleteTenantFn({ data: { id } });
    },
    onSuccess: () => {
      toast.success("تم حذف المستأجر بنجاح");
      queryClient.invalidateQueries({ queryKey: ["tenants"] });
      window.history.back();
    },
  });

  if (isLoading) {
    return (
      <AppShell>
        <div className="p-8 text-center text-xs text-muted-foreground">جارِ التحميل...</div>
      </AppShell>
    );
  }

  if (!tenant) {
    return (
      <AppShell>
        <div className="p-8 text-center text-xs text-muted-foreground">المستأجر غير موجود</div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/85 px-6 pb-4 pt-8 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/customers"
              className="grid size-10 place-items-center rounded-full bg-muted text-ink"
            >
              <ArrowRight className="size-4" />
            </Link>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                ملف المستأجر
              </p>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight">{tenant.name}</h1>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setEditOpen(true)}
              className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground hover:text-foreground"
            >
              <Edit className="size-4" />
            </button>
            <button
              onClick={() => deleteMutation.mutate()}
              className="grid size-9 place-items-center rounded-full bg-destructive/10 text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="space-y-6 px-5 pt-4">
        {/* Profile Card */}
        <section className="card-elev p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">{tenant.name}</h2>
            {tenant.phone && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => openWhatsApp(tenant.phone, `مرحباً ${tenant.name}`)}
                  className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full hover:bg-emerald-500/20"
                >
                  <MessageCircle className="size-3.5" /> واتساب
                </button>
                <button
                  onClick={() => openSMS(tenant.phone, `مرحباً ${tenant.name}`)}
                  className="flex items-center gap-1 text-xs font-bold text-blue-600 bg-blue-500/10 px-3 py-1.5 rounded-full hover:bg-blue-500/20"
                >
                  <Send className="size-3.5" /> SMS
                </button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-stone-line/70">
            <div>
              <span className="text-muted-foreground block">رقم الجوال:</span>
              <span className="font-bold tabular" dir="ltr">{tenant.phone || "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground block">رقم الهوية:</span>
              <span className="font-bold tabular">{tenant.idNumber || "—"}</span>
            </div>
            {tenant.address && (
              <div className="col-span-2 pt-1">
                <span className="text-muted-foreground block">العنوان:</span>
                <span className="font-medium">{tenant.address}</span>
              </div>
            )}
          </div>
        </section>

        {/* Tenant Contracts */}
        <section className="space-y-3">
          <h2 className="text-base font-bold">سجل العقود ({toArabicDigits(tenantContracts.length)})</h2>
          {tenantContracts.length === 0 ? (
            <div className="card-elev p-6 text-center text-xs text-muted-foreground">
              لا توجد عقود مسجلة لهذا المستأجر.
            </div>
          ) : (
            <div className="space-y-2.5">
              {tenantContracts.map((c) => {
                const meta = contractStatusMeta(c.status);
                return (
                  <Link
                    to="/bookings/$id"
                    params={{ id: c.id }}
                    key={c.id}
                    className="card-elev p-4 block hover:bg-muted/30 transition"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold">{c.contractNumber}</h3>
                          <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${meta.tone}`}>
                            {meta.label}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {c.propertyName} — وحدة {c.unitNumber}
                        </p>
                      </div>
                      <div className="text-left">
                        <p className="tabular text-sm font-bold text-primary">
                          {toArabicDigits(c.rentAmount)} <span className="text-[10px] text-muted-foreground">ر.س</span>
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">
                          {formatDate(c.startDate, { day: true, month: true })} — {formatDate(c.endDate, { day: true, month: true })}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Tenant Dues */}
        <section className="space-y-3">
          <h2 className="text-base font-bold">سجل الاستحقاقات والدفعات</h2>
          {tenantDues.length === 0 ? (
            <div className="card-elev p-6 text-center text-xs text-muted-foreground">
              لا توجد استحقاقات مسجلة.
            </div>
          ) : (
            <div className="card-elev overflow-hidden divide-y divide-stone-line/70">
              {tenantDues.map((d) => {
                const meta = dueStatusMeta(d.status);
                return (
                  <div key={d.id} className="p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold">{d.title}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${meta.tone}`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-0.5">
                        استحقاق: {formatDate(d.dueDate, { day: true, month: true })}
                      </p>
                    </div>
                    <div className="text-left font-bold tabular">
                      {toArabicDigits(d.amount)} ر.س
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </main>

      <TenantFormSheet open={editOpen} onOpenChange={setEditOpen} tenant={tenant} />
    </AppShell>
  );
}
