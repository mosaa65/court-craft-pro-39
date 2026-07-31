import { X, ReceiptText, CheckCircle2, DollarSign, Calendar, User, Building2, Tag, FileText } from "lucide-react";
import { formatDate, toArabicDigits } from "@/lib/types";

export interface FinancialTransaction {
  id: string;
  type: "payment" | "expense";
  dateStr: string;
  title: string;
  subTitle: string;
  amount: number;
  methodOrCategory: string;
  tenantName?: string;
  propertyName?: string;
  unitNumber?: string;
  receiptNumber?: string;
  notes?: string;
  vendor?: string;
}

export function TransactionDetailSheet({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: FinancialTransaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!open || !transaction) return null;

  const isPayment = transaction.type === "payment";

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
      <div className="w-full max-w-[460px] rounded-t-3xl sm:rounded-3xl bg-background p-6 shadow-2xl animate-sheet border border-stone-line/80 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-4 border-b border-stone-line">
          <div className="flex items-center gap-3">
            <div
              className={`grid size-11 place-items-center rounded-2xl ${
                isPayment ? "bg-emerald-500/10 text-emerald-600" : "bg-destructive/10 text-destructive"
              }`}
            >
              {isPayment ? <CheckCircle2 className="size-5" /> : <ReceiptText className="size-5" />}
            </div>
            <div>
              <h2 className="text-base font-bold">{transaction.title}</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isPayment ? "سند قبض / تحصيل إيراد" : "سند صرف / مصروف عقاري"}
              </p>
            </div>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="grid size-9 place-items-center rounded-full bg-muted text-muted-foreground hover:text-foreground transition"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Amount Box */}
        <div
          className={`mt-5 rounded-2xl p-5 text-white shadow-lg space-y-2 relative overflow-hidden ${
            isPayment
              ? "bg-gradient-to-br from-emerald-600 to-teal-800"
              : "bg-gradient-to-br from-stone-900 via-stone-800 to-destructive/80"
          }`}
        >
          <div className="flex items-center justify-between opacity-80 text-[11px] font-bold uppercase tracking-wider">
            <span>{isPayment ? "المبلغ المقبوض" : "المبلغ المصروف"}</span>
            <span>{transaction.methodOrCategory}</span>
          </div>
          <p className="tabular text-3xl font-black">
            {isPayment ? "+" : "-"}{toArabicDigits(transaction.amount)}{" "}
            <span className="text-xs font-semibold opacity-80">ر.س</span>
          </p>
          <p className="text-[11px] opacity-80 pt-2 border-t border-white/10 flex items-center gap-1">
            <Calendar className="size-3.5" />
            التاريخ: {formatDate(transaction.dateStr, { day: true, month: true, year: true })}
          </p>
        </div>

        {/* Info Rows */}
        <div className="mt-5 space-y-3">
          {transaction.tenantName && (
            <div className="card-elev p-3.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5 font-bold">
                <User className="size-3.5 text-primary" /> المستأجر:
              </span>
              <span className="font-bold text-foreground">{transaction.tenantName}</span>
            </div>
          )}

          {transaction.propertyName && (
            <div className="card-elev p-3.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5 font-bold">
                <Building2 className="size-3.5 text-primary" /> العقار / الوحدة:
              </span>
              <span className="font-bold text-foreground">
                {transaction.propertyName} {transaction.unitNumber ? `(وحدة ${transaction.unitNumber})` : ""}
              </span>
            </div>
          )}

          {transaction.vendor && (
            <div className="card-elev p-3.5 flex items-center justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5 font-bold">
                <Tag className="size-3.5 text-primary" /> المورد / الجهة:
              </span>
              <span className="font-bold text-foreground">{transaction.vendor}</span>
            </div>
          )}

          {transaction.notes && (
            <div className="card-elev p-3.5 space-y-1 text-xs">
              <span className="text-muted-foreground flex items-center gap-1.5 font-bold">
                <FileText className="size-3.5 text-primary" /> الملاحظات والتفاصيل:
              </span>
              <p className="text-foreground font-medium pt-1 border-t border-stone-line/50">{transaction.notes}</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-stone-line text-center">
          <button
            onClick={() => onOpenChange(false)}
            className="w-full h-11 rounded-2xl bg-muted font-bold text-xs text-foreground hover:bg-stone-200 dark:hover:bg-stone-800 transition"
          >
            إغلاق التفاصيل
          </button>
        </div>
      </div>
    </div>
  );
}
