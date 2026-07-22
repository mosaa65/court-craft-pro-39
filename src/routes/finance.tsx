import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import {
  ArrowRight,
  TrendingUp,
  Coins,
  ReceiptText,
  Clock,
  CheckCircle2,
  Download,
  Plus,
  Zap,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { duesQuery } from "@/lib/dues.queries";
import { paymentsQuery } from "@/lib/payments.queries";
import { expensesQuery } from "@/lib/expenses.queries";
import { PaymentSheet } from "@/components/payment-sheet";
import { ExpenseFormSheet } from "@/components/expense-form-sheet";
import { UtilityReadingSheet } from "@/components/utility-reading-sheet";
import { TransactionDetailSheet, type FinancialTransaction } from "@/components/transaction-detail-sheet";
import { toArabicDigits, formatDate, dueStatusMeta, paymentMethodLabel, expenseCategoryLabel } from "@/lib/types";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/finance")({
  head: () => ({
    meta: [
      { title: "المالية — المحصلات، المصروفات والفواتير" },
      { name: "description", content: "إدارة المحصلات والاستحقاقات والسداد والمصروفات والتصدير المالي." },
    ],
  }),
  component: FinancePage,
});

type TabType = "all" | "payments" | "expenses" | "dues";

export function FinancePage() {
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);
  const [expenseSheetOpen, setExpenseSheetOpen] = useState(false);
  const [utilitySheetOpen, setUtilitySheetOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<FinancialTransaction | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const { data: dues = [] } = useQuery(duesQuery({}));
  const { data: payments = [] } = useQuery(paymentsQuery({}));
  const { data: expenses = [] } = useQuery(expensesQuery(""));

  const totalCollected = payments.reduce((s, p) => s + p.amount, 0);
  const totalPendingDues = dues.filter((d) => d.status !== "paid").reduce((s, d) => s + (d.amount - d.paidAmount), 0);
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const netRevenue = totalCollected - totalExpenses;

  // Group transactions by date for side-by-side or grouped display
  const combinedTransactions = useMemo(() => {
    const list: FinancialTransaction[] = [];

    payments.forEach((p) => {
      list.push({
        id: p.id,
        type: "payment",
        dateStr: p.paymentDate.split("T")[0],
        title: `سند قبض ${p.receiptNumber}`,
        subTitle: `${p.tenantName || "مستأجر"} • ${p.propertyName || ""}`,
        amount: p.amount,
        methodOrCategory: paymentMethodLabel(p.paymentMethod),
        tenantName: p.tenantName,
        propertyName: p.propertyName,
        receiptNumber: p.receiptNumber,
        notes: p.notes,
      });
    });

    expenses.forEach((e) => {
      list.push({
        id: e.id,
        type: "expense",
        dateStr: e.expenseDate,
        title: e.description,
        subTitle: `${e.propertyName || "عقار عام"} • ${e.vendor || ""}`,
        amount: e.amount,
        methodOrCategory: expenseCategoryLabel(e.category),
        propertyName: e.propertyName,
        unitNumber: e.unitNumber,
        vendor: e.vendor,
        notes: e.notes,
      });
    });

    // Sort descending by date
    list.sort((a, b) => (a.dateStr < b.dateStr ? 1 : -1));
    return list;
  }, [payments, expenses]);

  const handleCardClick = (t: FinancialTransaction) => {
    setSelectedTransaction(t);
    setDetailOpen(true);
  };

  // CSV Export handler
  const exportToCSV = () => {
    try {
      const headers = ["الرقم المعرف", "النوع", "التاريخ", "البيان", "التفاصيل", "طريقة الدفع / الفئة", "المبلغ (ر.س)"];
      const rows = combinedTransactions.map((t) => [
        t.id,
        t.type === "payment" ? "إيراد / محصل" : "مصروف",
        t.dateStr,
        `"${t.title.replace(/"/g, '""')}"`,
        `"${t.subTitle.replace(/"/g, '""')}"`,
        t.methodOrCategory,
        t.type === "payment" ? t.amount : -t.amount,
      ]);

      const csvContent = "\uFEFF" + [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `تقرير_المالية_${new Date().toISOString().split("T")[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("تم تصدير التقرير المالي بصيغة CSV بنجاح!");
    } catch (err) {
      toast.error("تعذر تصدير الملف CSV");
    }
  };

  return (
    <AppShell>
      <header className="sticky top-0 z-30 bg-background/85 px-6 pb-4 pt-8 backdrop-blur-md border-b border-stone-line/70">
        <div className="flex items-center gap-3">
          <Link
            to="/manage"
            aria-label="رجوع"
            className="grid size-10 place-items-center rounded-full bg-muted text-ink hover:bg-stone-200 dark:hover:bg-stone-800 transition"
          >
            <ArrowRight className="size-4" />
          </Link>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-muted-foreground">الإدارة المالية</p>
            <h1 className="mt-0.5 text-xl font-bold tracking-tight">المالية والسداد والمصروفات</h1>
          </div>
        </div>

        {/* Tab Filter Pills */}
        <div className="mt-4 flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
          {[
            { id: "all", label: "جميع الحركات المالية" },
            { id: "payments", label: "المحصلات الإيرادات" },
            { id: "expenses", label: "المصروفات" },
            { id: "dues", label: "جدول الاستحقاقات" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as TabType)}
              className={`shrink-0 rounded-full px-4 py-2 text-[11px] font-bold transition ${
                activeTab === t.id ? "bg-ink text-white shadow-sm" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="space-y-4 px-5 pt-4">
        {/* Quick Action Buttons */}
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => setPaymentSheetOpen(true)}
            className="flex items-center justify-center gap-1 h-11 rounded-2xl bg-primary text-primary-foreground font-bold text-[11px] shadow active:scale-95 transition"
          >
            <Coins className="size-3.5" /> تسجيل سداد
          </button>
          <button
            onClick={() => setExpenseSheetOpen(true)}
            className="flex items-center justify-center gap-1 h-11 rounded-2xl bg-destructive/10 text-destructive font-bold text-[11px] hover:bg-destructive/20 active:scale-95 transition"
          >
            <Plus className="size-3.5" /> إضافة مصروف
          </button>
          <button
            onClick={() => setUtilitySheetOpen(true)}
            className="flex items-center justify-center gap-1 h-11 rounded-2xl bg-amber-500/10 text-amber-600 font-bold text-[11px] hover:bg-amber-500/20 active:scale-95 transition"
          >
            <Zap className="size-3.5" /> العدادات
          </button>
        </div>

        {/* Financial Overview KPIs */}
        <section className="grid grid-cols-2 gap-3">
          <Kpi
            icon={<Coins className="size-4" />}
            label="الإيرادات المحصلة"
            value={totalCollected.toLocaleString("ar-SA")}
            suffix="ر.س"
            trend={`${toArabicDigits(payments.length)} سند قبض`}
            accent="primary"
          />
          <Kpi
            icon={<Clock className="size-4" />}
            label="المستحقات المعلقة"
            value={totalPendingDues.toLocaleString("ar-SA")}
            suffix="ر.س"
            trend={`${toArabicDigits(dues.filter((d) => d.status !== "paid").length)} دفعة`}
            accent="warn"
          />
        </section>

        {/* Net Revenue Banner with CSV Export Button */}
        <section className="card-elev flex items-center justify-between p-4 bg-gradient-to-r from-card via-card to-muted/40 border border-stone-line">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl bg-primary/10 text-primary">
              <TrendingUp className="size-5" />
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">صافي الإيرادات (بعد المصروفات)</p>
              <p className="tabular text-xl font-extrabold text-foreground mt-0.5">
                {netRevenue.toLocaleString("ar-SA")} <span className="text-[10px] font-bold text-muted-foreground">ر.س</span>
              </p>
            </div>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-[11px] font-bold text-white shadow hover:bg-stone-800 active:scale-95 transition"
            title="تصدير السجل المالي ملف CSV"
          >
            <Download className="size-3.5" />
            تصدير CSV
          </button>
        </section>

        {/* Tab Content: All / Payments / Expenses / Dues */}
        {activeTab === "all" && (
          <section className="space-y-2.5">
            <div className="flex items-center justify-between pb-1 px-1">
              <h2 className="text-sm font-bold flex items-center gap-1.5">
                <ReceiptText className="size-4 text-primary" /> كشف الحركات اليومية (اضغط لعرض التفاصيل)
              </h2>
              <span className="text-[11px] text-muted-foreground">{toArabicDigits(combinedTransactions.length)} حركة</span>
            </div>

            {combinedTransactions.length === 0 ? (
              <div className="card-elev p-6 text-center text-xs text-muted-foreground">لا توجد حركات مالية مسجلة.</div>
            ) : (
              combinedTransactions.map((t, i) => (
                <div
                  key={t.id}
                  onClick={() => handleCardClick(t)}
                  className="card-elev p-3.5 flex items-center justify-between text-xs animate-rise cursor-pointer hover:shadow-md transition active:scale-[0.99]"
                  style={{ animationDelay: `${i * 30}ms` }}
                >
                  <div className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className={cn(
                        "h-10 w-1 shrink-0 rounded-full",
                        t.type === "payment" ? "bg-emerald-500" : "bg-destructive",
                      )}
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm text-foreground">{t.title}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[9px] font-bold",
                            t.type === "payment" ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive",
                          )}
                        >
                          {t.methodOrCategory}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-0.5">
                        {t.subTitle} • {t.dateStr}
                      </p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "text-left font-extrabold tabular text-sm shrink-0",
                      t.type === "payment" ? "text-emerald-600" : "text-destructive",
                    )}
                  >
                    {t.type === "payment" ? "+" : "-"}{toArabicDigits(t.amount)} <span className="text-[10px] font-medium text-muted-foreground">ر.س</span>
                  </div>
                </div>
              ))
            )}
          </section>
        )}

        {activeTab === "payments" && (
          <section className="space-y-2">
            <div className="flex items-center gap-2 pb-1">
              <CheckCircle2 className="size-4 text-emerald-500" />
              <h2 className="text-sm font-bold">المحصلات وسندات القبض</h2>
            </div>
            {payments.length === 0 ? (
              <div className="card-elev p-6 text-center text-xs text-muted-foreground">لا توجد محصلات مسجلة بعد.</div>
            ) : (
              payments.map((p) => {
                const item: FinancialTransaction = {
                  id: p.id,
                  type: "payment",
                  dateStr: p.paymentDate.split("T")[0],
                  title: `سند قبض ${p.receiptNumber}`,
                  subTitle: `${p.tenantName || "مستأجر"} • ${p.propertyName || ""}`,
                  amount: p.amount,
                  methodOrCategory: paymentMethodLabel(p.paymentMethod),
                  tenantName: p.tenantName,
                  propertyName: p.propertyName,
                  receiptNumber: p.receiptNumber,
                  notes: p.notes,
                };
                return (
                  <div
                    key={p.id}
                    onClick={() => handleCardClick(item)}
                    className="card-elev p-3.5 flex items-center justify-between text-xs cursor-pointer hover:shadow-md transition active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-10 w-1 rounded-full bg-emerald-500" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary">{p.receiptNumber}</span>
                          <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600">
                            {paymentMethodLabel(p.paymentMethod)}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-0.5">
                          {p.tenantName || "مستأجر"} • {formatDate(p.paymentDate, { day: true, month: true, year: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-left font-bold tabular text-sm text-emerald-600">
                      +{toArabicDigits(p.amount)} ر.س
                    </div>
                  </div>
                );
              })
            )}
          </section>
        )}

        {activeTab === "expenses" && (
          <section className="space-y-2">
            <div className="flex items-center gap-2 pb-1">
              <ReceiptText className="size-4 text-destructive" />
              <h2 className="text-sm font-bold">سجل المصروفات</h2>
            </div>
            {expenses.length === 0 ? (
              <div className="card-elev p-6 text-center text-xs text-muted-foreground">لا توجد مصروفات مسجلة.</div>
            ) : (
              expenses.map((e) => {
                const item: FinancialTransaction = {
                  id: e.id,
                  type: "expense",
                  dateStr: e.expenseDate,
                  title: e.description,
                  subTitle: `${e.propertyName || "عقار عام"} • ${e.vendor || ""}`,
                  amount: e.amount,
                  methodOrCategory: expenseCategoryLabel(e.category),
                  propertyName: e.propertyName,
                  unitNumber: e.unitNumber,
                  vendor: e.vendor,
                  notes: e.notes,
                };
                return (
                  <div
                    key={e.id}
                    onClick={() => handleCardClick(item)}
                    className="card-elev p-3.5 flex items-center justify-between text-xs cursor-pointer hover:shadow-md transition active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-3">
                      <span className="h-10 w-1 rounded-full bg-destructive" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground">{e.description}</span>
                          <span className="rounded-full bg-destructive/10 px-2 py-0.5 text-[9px] font-bold text-destructive">
                            {expenseCategoryLabel(e.category)}
                          </span>
                        </div>
                        <p className="text-muted-foreground mt-0.5">
                          {e.propertyName || "عقار عام"} • {formatDate(e.expenseDate, { day: true, month: true })}
                        </p>
                      </div>
                    </div>
                    <div className="text-left font-bold tabular text-sm text-destructive">
                      -{toArabicDigits(e.amount)} ر.س
                    </div>
                  </div>
                );
              })
            )}
          </section>
        )}

        {activeTab === "dues" && (
          <section className="space-y-2">
            <div className="flex items-center gap-2 pb-1">
              <ReceiptText className="size-4 text-primary" />
              <h2 className="text-sm font-bold">جدول الاستحقاقات الإيجارية</h2>
            </div>
            {dues.length === 0 ? (
              <div className="card-elev p-6 text-center text-xs text-muted-foreground">لا توجد استحقاقات.</div>
            ) : (
              dues.map((d) => {
                const meta = dueStatusMeta(d.status);
                const rem = d.amount - d.paidAmount;
                return (
                  <div key={d.id} className="card-elev p-3.5 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm">{d.tenantName || "مستأجر"}</span>
                        <span className={`rounded-full px-2 py-0.5 text-[9px] font-bold ${meta.tone}`}>
                          {meta.label}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-0.5">
                        {d.propertyName} (وحدة {d.unitNumber}) • {d.title}
                      </p>
                    </div>
                    <div className="text-left font-bold tabular">
                      <p>{toArabicDigits(rem)} ر.س</p>
                      {rem > 0 && (
                        <button
                          onClick={() => setPaymentSheetOpen(true)}
                          className="text-[10px] font-bold text-primary hover:underline mt-0.5"
                        >
                          تحصيل
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </section>
        )}
      </main>

      <TransactionDetailSheet
        transaction={selectedTransaction}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
      <PaymentSheet open={paymentSheetOpen} onOpenChange={setPaymentSheetOpen} />
      <ExpenseFormSheet open={expenseSheetOpen} onOpenChange={setExpenseSheetOpen} />
      <UtilityReadingSheet open={utilitySheetOpen} onOpenChange={setUtilitySheetOpen} />
    </AppShell>
  );
}

function Kpi({
  icon,
  label,
  value,
  suffix,
  trend,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  suffix?: string;
  trend?: string;
  accent: "primary" | "warn";
}) {
  const accentClass = accent === "primary" ? "bg-primary/10 text-primary" : "bg-[color:var(--color-warn)]/15 text-[color:oklch(0.55_0.15_70)]";
  return (
    <div className="card-elev p-4">
      <div className={"grid size-8 place-items-center rounded-full " + accentClass}>{icon}</div>
      <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="tabular mt-1 text-xl font-bold">
        {value}
        {suffix && <span className="mr-1 text-[10px] font-medium text-muted-foreground">{suffix}</span>}
      </p>
      {trend && <p className="tabular mt-0.5 text-[10px] font-medium text-muted-foreground">{trend}</p>}
    </div>
  );
}
