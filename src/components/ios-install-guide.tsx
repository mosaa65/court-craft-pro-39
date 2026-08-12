import { useEffect, useState } from "react";
import { Share, Plus, X } from "lucide-react";

const DISMISS_KEY = "ios-install-guide-dismissed";

function isIosSafari() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOS = /iPad|iPhone|iPod/.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  const webkit = /WebKit/.test(ua);
  const otherBrowser = /CriOS|FxiOS|EdgiOS|OPiOS|Chrome/.test(ua);
  return iOS && webkit && !otherBrowser;
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

export function IosInstallGuide() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (window.self !== window.top) return; // never inside preview iframes
    if (!isIosSafari() || isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY) === "1") return;
    const t = setTimeout(() => setOpen(true), 1500);
    return () => clearTimeout(t);
  }, []);

  if (!open) return null;

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, "1");
    setOpen(false);
  };

  return (
    <div
      dir="rtl"
      role="dialog"
      aria-modal="true"
      aria-label="تثبيت التطبيق على الشاشة الرئيسية"
      className="fixed inset-0 z-[100] flex items-end justify-center bg-ink/40 px-4 pb-6 backdrop-blur-sm"
    >
      <div className="w-full max-w-[420px] rounded-3xl border border-stone-line bg-card p-6 shadow-[0_30px_80px_-20px_oklch(0.15_0.04_258/0.45)]">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold tracking-tight">أضِف التطبيق لشاشتك الرئيسية</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              استمتع بتجربة تطبيق كاملة بدون شريط المتصفح.
            </p>
          </div>
          <button
            type="button"
            onClick={dismiss}
            aria-label="إغلاق"
            className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-foreground"
          >
            <X className="size-4" strokeWidth={2} />
          </button>
        </div>

        <ol className="mt-5 space-y-3">
          <li className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Share className="size-[18px]" strokeWidth={1.9} />
            </span>
            <p className="text-sm font-medium">اضغط زر المشاركة في أسفل Safari</p>
          </li>
          <li className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
              <Plus className="size-[18px]" strokeWidth={2.2} />
            </span>
            <p className="text-sm font-medium">اختر «إضافة إلى الشاشة الرئيسية»</p>
          </li>
        </ol>

        <button
          type="button"
          onClick={dismiss}
          className="mt-5 w-full rounded-full bg-primary py-3 text-sm font-bold text-primary-foreground transition active:scale-[0.99]"
        >
          فهمت
        </button>
      </div>
    </div>
  );
}
