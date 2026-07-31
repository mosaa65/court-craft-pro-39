import { useState } from "react";
import { X, DollarSign, Calendar, Building2, User, Phone, CheckCircle2, MessageCircle, FileText, Send, Clock, AlertCircle } from "lucide-react";
import { PaymentSheet } from "./payment-sheet";
import { dueStatusMeta, toArabicDigits, formatDate, openWhatsApp, openSMS, type Due } from "@/lib/types";

export function DueDetailSheet({
  due,
  open,
  onOpenChange,
}: {
  due: Due | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [paymentSheetOpen, setPaymentSheetOpen] = useState(false);

  if (!open || !due) return null;

  const meta = dueStatusMeta(due.status);
  const remaining = due.amount - due.paidAmount;

  const handleWhatsApp = () => {
    if (!due.tenantPhone) return;
    const msg = `مرحباً ${due.tenantName || "المستأجر العزيز"}، نود تذكيرك باستحقاق دفعة إيجار للعقار (${due.propertyName} - وحدة ${due.unitNumber}) بمبلغ ${remaining.toLocaleString("ar-SA")} ر.س المستحقة بتاريخ ${due.dueDate}. شكراً لكم.`;
    openWhatsApp(due.tenantPhone, msg);
  };

  const handleSMS = () => {
    if (!due.tenantPhone) return;
    const msg = `تذكير استحقاق إيجار: ${remaining.toLocaleString("ar-SA")} ر.س للعقار ${due.propertyName} (وحدة ${due.unitNumber}).`;
    openSMS(due.tenantPhone, msg);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-sm p-0 sm:p-4 animate-fade-in">
        <div className="w-full max-w-[480px] rounded-t-3xl sm:rounded-3xl bg-background p-0 shadow-2xl animate-sheet border border-stone-line/80 max-h-[92vh] overflow-y-auto">
          {/* Top Property Image Header */}
          <div className="relative aspect-[16/9] w-full overflow-hidden bg-ink">
            {due.propertyImageUrl ? (
              <img src={due.propertyImageUrl} alt={due.propertyName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-ink to-stone-800 text-white/40">
                <Building2 className="size-16" />
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-background via-ink/40 to-transparent" />

            <button
              onClick={() => onOpenChange(false)}
              className="absolute left-4 top-4 grid size-9 place-items-center rounded-full bg-black/50 text-white backdrop-blur hover:bg-black/70 transition"
            >
              <X className="size-4" />
            </button>

            <div className="absolute bottom-3 right-4 left-4 flex items-end justify-between">
              <div>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${meta.tone} shadow-sm`}>
                  {meta.label}
                </span>
                <h2 className="text-lg font-bold text-white mt-1 drop-shadow">{due.propertyName}</h2>
                <p className="text-xs font-semibold text-white/80">وحدة رقم: {due.unitNumber}</p>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            {/* Amount Box Card */}
            <div className="rounded-2xl bg-ink text-white p-5 space-y-3 shadow-lg relative overflow-hidden">
              <div className="absolute -left-6 -top-6 size-28 rounded-full bg-primary/20 blur-2xl" />
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/60">إجمالي القسط</span>
                <span className="text-xs font-bold text-primary tabular">{toArabicDigits(due.amount)} ر.س</span>
              </div>
              <div className="flex items-baseline justify-between border-t border-white/10 pt-3">
                <div>
                  <span className="text-[10px] text-white/50 block">المبلغ المتبقي للسداد</span>
                  <span className="text-2xl font-extrabold text-white tabular">
                    {toArabicDigits(remaining)} <span className="text-xs font-semibold text-white/70">ر.س</span>
                  </span>
                </div>
                {due.paidAmount > 0 && (
                  <div className="text-left">
                    <span className="text-[10px] text-emerald-400 block">المسدد سابقاً</span>
                    <span className="text-sm font-bold text-emerald-400 tabular">{toArabicDigits(due.paidAmount)} ر.س</span>
                  </div>
                )}
              </div>
            </div>

            {/* Detailed Info Cards */}
            <div className="space-y-3">
              {/* Tenant Details */}
              <div className="card-elev p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="grid size-10 place-items-center rounded-2xl bg-primary/10 text-primary">
                    <User className="size-5" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">المستأجر</p>
                    <p className="text-sm font-bold text-foreground mt-0.5">{due.tenantName || "غير محدد"}</p>
                    {due.tenantPhone && (
                      <p className="text-[11px] font-semibold text-muted-foreground dir-ltr" dir="ltr">
                        {due.tenantPhone}
                      </p>
                    )}
                  </div>
                </div>

                {due.tenantPhone && (
                  <a
                    href={`tel:${due.tenantPhone}`}
                    title="اتصال"
                    className="grid size-9 place-items-center rounded-full bg-primary/10 text-primary hover:bg-primary/20 active:scale-95 transition"
                  >
                    <Phone className="size-4" />
                  </a>
                )}
              </div>

              {/* Direct WhatsApp and SMS Messaging Action Box */}
              {due.tenantPhone && (
                <div className="card-elev p-4 space-y-2">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    إرسال إشعار تذكير بالفاتورة للمستأجر
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleWhatsApp}
                      className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-[oklch(0.72_0.17_150)] text-xs font-bold text-white transition active:scale-95 shadow-sm"
                    >
                      <MessageCircle className="size-4" />
                      واتساب (تطبيقي)
                    </button>
                    <button
                      onClick={handleSMS}
                      className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-ink text-xs font-bold text-white transition active:scale-95 shadow-sm"
                    >
                      <Send className="size-4" />
                      رسالة نصية SMS
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Action Footer */}
            <div className="pt-2">
              {remaining > 0 ? (
                <button
                  onClick={() => {
                    onOpenChange(false);
                    setPaymentSheetOpen(true);
                  }}
                  className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 shadow-lg active:scale-95 transition"
                >
                  <DollarSign className="size-5" />
                  تحصيل الآن / تسجيل سداد
                </button>
              ) : (
                <div className="w-full h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 font-bold text-sm flex items-center justify-center gap-2 border border-emerald-500/20">
                  <CheckCircle2 className="size-5" />
                  تم سداد هذا القسط بالكامل
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <PaymentSheet
        open={paymentSheetOpen}
        onOpenChange={setPaymentSheetOpen}
        defaultDueId={due.id}
      />
    </>
  );
}
