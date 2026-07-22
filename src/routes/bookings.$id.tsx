import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowRight, FileText, Calendar, DollarSign, CheckCircle2, Trash2, MessageCircle } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { contractQuery } from "@/lib/contracts.queries";
import { duesQuery } from "@/lib/dues.queries";
import { paymentsQuery } from "@/lib/payments.queries";
import { updateContractStatusFn, deleteContractFn } from "@/lib/contracts.functions";
import { PaymentSheet } from "@/components/payment-sheet";
import { toArabicDigits, formatDate, contractStatusMeta, dueStatusMeta, paymentCycleLabel, openWhatsApp } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/bookings/$id")({
  head: () => ({
    meta: [{ title: "تفاصيل العقد — جدول الاستحقاقات" }],
  }),
  component: ContractDetailPage,
});

function ContractDetailPage() {
  const { id } = Route.useParams();
  const queryClient = useQueryClient();
  const { data: contract, isLoading } = useQuery(contractQuery(id));
  const { data: dues = [] } = useQuery(duesQuery({ contractId: id }));
  const { data: payments = [] } = useQuery(paymentsQuery({ contractId: id }));

  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [selectedDueForPay, setSelectedDueForPay] = useState<string>("");

  const statusMutation = useMutation({
    mutationFn: async (status: "active" | "expired" | "terminated" | "cancelled" | "renewed") => {
      await updateContractStatusFn({ data: { id, status } });
    },
    onSuccess: () => {
      toast.success("تم تحديث حالة العقد");
      queryClient.invalidateQueries({ queryKey: ["contract", id] });
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!confirm("هل أنت تأكد من إلغاء/حذف العقد؟ ستعود الوحدة لحالة متاحة.")) return;
      await deleteContractFn({ data: { id } });
    },
    onSuccess: () => {
      toast.success("تم إلغاء العقد بنجاح");
      queryClient.invalidateQueries({ queryKey: ["contracts"] });
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

  if (!contract) {
    return (
      <AppShell>
        <div className="p-8 text-center text-xs text-muted-foreground">العقد غير موجود</div>
      </AppShell>
    );
  }

  const meta = contractStatusMeta(contract.status);

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/85 px-6 pb-4 pt-8 backdrop-blur-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              to="/bookings"
              className="grid size-10 place-items-center rounded-full bg-muted text-ink"
            >
              <ArrowRight className="size-4" />
            </Link>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">
                رقم العقد
              </p>
              <h1 className="mt-0.5 text-xl font-bold tracking-tight">{contract.contractNumber}</h1>
            </div>
          </div>

          <span className={`rounded-full px-3 py-1 text-xs font-bold ${meta.tone}`}>
            {meta.label}
          </span>
        </div>
      </header>

      <main className="space-y-6 px-5 pt-4">
        {/* Contract Info Card */}
        <section className="card-elev p-5 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">المستأجر:</p>
              <h2 className="text-base font-bold text-foreground">{contract.tenantName}</h2>
            </div>
            {contract.tenantPhone && (
              <button
                onClick={() => openWhatsApp(contract.tenantPhone!, `مرحباً ${contract.tenantName}، بخصوص العقد ${contract.contractNumber}.`)}
                className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-500/10 px-3 py-1.5 rounded-full"
              >
                <MessageCircle className="size-3.5" /> واتساب
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-stone-line/70">
            <div>
              <span className="text-muted-foreground block">العقار والوحدة:</span>
              <span className="font-bold">{contract.propertyName} (وحدة {contract.unitNumber})</span>
            </div>
            <div>
              <span className="text-muted-foreground block">إجمالي مبلغ الإيجار:</span>
              <span className="font-bold tabular text-primary">{toArabicDigits(contract.rentAmount)} ر.س</span>
            </div>
            <div>
              <span className="text-muted-foreground block">مدة العقد:</span>
              <span className="font-medium">{toArabicDigits(contract.durationMonths)} أشهر ({paymentCycleLabel(contract.paymentCycle)})</span>
            </div>
            <div>
              <span className="text-muted-foreground block">تاريخ العقد:</span>
              <span className="font-medium">{formatDate(contract.startDate, { day: true, month: true, year: true })}</span>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between border-t border-stone-line/70 text-xs">
            <button
              onClick={() => statusMutation.mutate("terminated")}
              className="text-xs font-bold text-amber-600 hover:underline"
            >
              إنهاء / فسخ العقد
            </button>
            <button
              onClick={() => deleteMutation.mutate()}
              className="text-xs font-bold text-destructive hover:underline"
            >
              حذف / إلغاء
            </button>
          </div>
        </section>

        {/* Dues Schedule */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold">جدول الاستحقاقات ({toArabicDigits(dues.length)})</h2>
              <p className="text-xs text-muted-foreground">جدولة الدفعات المستحقة ومتابعة السداد</p>
            </div>
            <button
              onClick={() => {
                setSelectedDueForPay("");
                setPaymentSheetOpen(true);
              }}
              className="flex items-center gap-1 rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow"
            >
              <DollarSign className="size-3.5" /> تحصيل
            </button>
          </div>

          <div className="card-elev overflow-hidden divide-y divide-stone-line/70">
            {dues.map((d) => {
              const dMeta = dueStatusMeta(d.status);
              const remaining = d.amount - d.paidAmount;
              return (
                <div key={d.id} className="p-4 flex items-center justify-between text-xs">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm">{d.title}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${dMeta.tone}`}>
                        {dMeta.label}
                      </span>
                    </div>
                    <p className="text-muted-foreground mt-0.5">
                      تاريخ الاستحقاق: {formatDate(d.dueDate, { day: true, month: true, year: true })}
                    </p>
                  </div>

                  <div className="text-left shrink-0">
                    <p className="font-bold text-sm tabular">
                      {toArabicDigits(d.amount)} <span className="text-[10px] text-muted-foreground">ر.س</span>
                    </p>
                    {remaining > 0 && (
                      <button
                        onClick={() => {
                          setSelectedDueForPay(d.id);
                          setPaymentSheetOpen(true);
                        }}
                        className="mt-1 text-[10px] font-bold text-primary hover:underline"
                      >
                        سداد ({toArabicDigits(remaining)} متبقي)
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </main>

      <PaymentSheet open={paymentSheetOpen} onOpenChange={setPaymentSheetOpen} defaultDueId={selectedDueForPay} />
    </AppShell>
  );
}
