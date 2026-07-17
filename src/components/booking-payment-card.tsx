import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Clock, MessageCircle, Send, RotateCcw, Coins, ChevronLeft } from "lucide-react";
import { toast } from "sonner";
import { markPaidFn, markUnpaidFn, sendInvoiceFn } from "@/lib/payments.functions";
import type { Booking, PaymentMethod } from "@/lib/mock";
import { paymentMethodLabel, toArabicDigits } from "@/lib/mock";
import { cn } from "@/lib/utils";

export function BookingPaymentCard({ booking }: { booking: Booking }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState<null | "pay" | "unpay" | "wa" | "sms">(null);
  const [method, setMethod] = useState<PaymentMethod>("cash");
  const paid = !!booking.paidAt;

  async function markPaid() {
    setBusy("pay");
    try {
      await markPaidFn({ data: { id: booking.id, method, note: "" } });
      qc.invalidateQueries();
      toast.success(`تم تسجيل الدفع (${paymentMethodLabel(method)})`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر التسجيل");
    } finally {
      setBusy(null);
    }
  }

  async function markUnpaid() {
    setBusy("unpay");
    try {
      await markUnpaidFn({ data: { id: booking.id } });
      qc.invalidateQueries();
      toast.success("تم إلغاء حالة الدفع");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "تعذّر التنفيذ");
    } finally {
      setBusy(null);
    }
  }

  async function send(channel: "whatsapp" | "sms") {
    setBusy(channel === "whatsapp" ? "wa" : "sms");
    try {
      await sendInvoiceFn({ data: { id: booking.id, channel } });
      qc.invalidateQueries();
      toast.success(channel === "whatsapp" ? "تم إرسال الفاتورة عبر واتساب" : "تم إرسال الفاتورة عبر SMS");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "فشل الإرسال");
    } finally {
      setBusy(null);
    }
  }

  return (
    <section className="card-elev overflow-hidden">
      {/* Header strip */}
      <div
        className={cn(
          "flex items-center gap-3 p-4",
          paid ? "bg-primary/8" : "bg-[color:var(--color-warn)]/10",
        )}
      >
        <div
          className={cn(
            "grid size-11 place-items-center rounded-2xl",
            paid ? "bg-primary text-primary-foreground" : "bg-[color:var(--color-warn)]/20 text-[color:oklch(0.55_0.15_70)]",
          )}
        >
          {paid ? <CheckCircle2 className="size-5" /> : <Clock className="size-5" />}
        </div>
        <div className="flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">الفاتورة</p>
          <p className="tabular text-[11px] font-bold">INV-{booking.id.slice(0, 8).toUpperCase()}</p>
        </div>
        <div className="text-left">
          <p className="tabular text-lg font-bold">{toArabicDigits(booking.price)}</p>
          <p className="text-[10px] font-medium text-muted-foreground">ر.س</p>
        </div>
      </div>

      <div className="space-y-3 p-4">
        {/* State line */}
        <div className="flex items-center justify-between rounded-2xl bg-muted/50 px-3 py-2.5 text-xs">
          <span className="flex items-center gap-1.5 font-bold">
            <Coins className="size-3.5" />
            {paid ? "مدفوعة" : "بانتظار الدفع"}
          </span>
          <span className="text-muted-foreground">
            {paid
              ? `${paymentMethodLabel(booking.paymentMethod)} · ${new Date(booking.paidAt!).toLocaleDateString("ar-SA")}`
              : "لم يتم استلام المبلغ بعد"}
          </span>
        </div>

        {!paid && (
          <>
            <div className="grid grid-cols-4 gap-1.5">
              {(["cash", "transfer", "card", "other"] as PaymentMethod[]).map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={cn(
                    "rounded-full px-2 py-2 text-[10px] font-bold transition",
                    method === m ? "bg-ink text-white" : "bg-muted text-muted-foreground",
                  )}
                >
                  {paymentMethodLabel(m)}
                </button>
              ))}
            </div>
            <button
              onClick={markPaid}
              disabled={busy !== null}
              className="flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-primary text-sm font-bold text-primary-foreground transition active:scale-[0.99] disabled:opacity-50"
            >
              <CheckCircle2 className="size-4" />
              {busy === "pay" ? "جاري التسجيل..." : `تسجيل الدفع (${paymentMethodLabel(method)})`}
            </button>
          </>
        )}

        {paid && (
          <button
            onClick={markUnpaid}
            disabled={busy !== null}
            className="flex h-11 w-full items-center justify-center gap-2 rounded-2xl border border-stone-line bg-card text-xs font-bold text-muted-foreground transition active:scale-[0.99] disabled:opacity-50"
          >
            <RotateCcw className="size-3.5" />
            {busy === "unpay" ? "جاري..." : "إلغاء حالة الدفع"}
          </button>
        )}

        {/* Send invoice */}
        <div className="pt-1">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            إرسال الفاتورة للعميل
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => send("whatsapp")}
              disabled={busy !== null || !booking.phone}
              className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-[oklch(0.72_0.17_150)] text-[11px] font-bold text-white transition active:scale-[0.99] disabled:opacity-40"
            >
              <MessageCircle className="size-3.5" />
              {busy === "wa" ? "جاري..." : "واتساب"}
            </button>
            <button
              onClick={() => send("sms")}
              disabled={busy !== null || !booking.phone}
              className="flex h-11 items-center justify-center gap-1.5 rounded-2xl bg-ink text-[11px] font-bold text-white transition active:scale-[0.99] disabled:opacity-40"
            >
              <Send className="size-3.5" />
              {busy === "sms" ? "جاري..." : "SMS"}
            </button>
          </div>
          {booking.invoiceSentAt && (
            <p className="mt-2 flex items-center gap-1 text-[10px] text-muted-foreground">
              <ChevronLeft className="size-3" />
              آخر إرسال: {new Date(booking.invoiceSentAt).toLocaleString("ar-SA")}
              {booking.invoiceChannel && ` · ${booking.invoiceChannel === "whatsapp" ? "واتساب" : "SMS"}`}
            </p>
          )}
          {!booking.phone && (
            <p className="mt-2 text-[10px] text-muted-foreground">لا يوجد رقم جوال للعميل — أضِف الرقم من التعديل.</p>
          )}
        </div>
      </div>
    </section>
  );
}
