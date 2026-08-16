import { useEffect, useState } from "react";
import { CloudOff } from "lucide-react";

export function OfflineStatus() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-3 z-[90] flex justify-center px-4" role="status">
      <div className="flex max-w-[390px] items-center gap-3 rounded-full border border-warn/30 bg-ink px-4 py-2.5 text-primary-foreground shadow-[var(--shadow-elev-3)]">
        <span className="grid size-8 shrink-0 place-items-center rounded-full bg-warn/20 text-warn">
          <CloudOff className="size-4" strokeWidth={2.2} />
        </span>
        <div className="min-w-0">
          <p className="text-xs font-bold">أنت تعمل بدون إنترنت</p>
          <p className="text-[10px] text-primary-foreground/65">البيانات المعروضة محفوظة محليًا وغير متزامنة</p>
        </div>
      </div>
    </div>
  );
}