import { Link } from "@tanstack/react-router";
import { Phone, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { statusMeta, toArabicDigits, type Booking, type Court } from "@/lib/mock";

export function BookingCard({
  booking,
  court,
  showDate = false,
}: {
  booking: Booking;
  court?: Court;
  showDate?: boolean;
}) {
  const meta = statusMeta(booking.status);
  const d = new Date(booking.startAt);
  const dateLabel = showDate
    ? `${toArabicDigits(d.getDate())}/${toArabicDigits(d.getMonth() + 1)}`
    : null;

  return (
    <Link
      to="/bookings/$id"
      params={{ id: booking.id }}
      className="card-elev group flex items-center gap-3 p-4 transition active:scale-[0.99]"
    >
      <div className="tabular grid w-16 shrink-0 text-center font-bold">
        <span className="text-sm">{booking.start}</span>
        <span className="text-[10px] font-medium text-muted-foreground">— {booking.end}</span>
        {dateLabel && (
          <span className="mt-0.5 text-[10px] font-semibold text-primary">{dateLabel}</span>
        )}
      </div>
      <span
        aria-hidden
        className={cn(
          "h-12 w-1 shrink-0 rounded-full",
          booking.status === "confirmed" && "bg-primary",
          booking.status === "training" && "bg-ink",
          booking.status === "pending" && "bg-[color:var(--color-warn)]",
          booking.status === "maintenance" && "bg-muted-foreground/40",
          booking.status === "cancelled" && "bg-destructive/40",
        )}
      />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-bold">{booking.customer}</p>
        <p className="truncate text-[11px] text-muted-foreground">{court?.name ?? booking.courtId}</p>
        {booking.phone && (
          <p className="mt-0.5 flex items-center gap-1 text-[10px] text-muted-foreground" dir="ltr">
            <Phone className="size-2.5" />
            {booking.phone}
          </p>
        )}
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <span className={cn("rounded-full px-2 py-1 text-[10px] font-bold", meta.tone)}>
          {meta.label}
        </span>
        <ChevronLeft className="size-4 text-muted-foreground transition group-hover:-translate-x-0.5 group-hover:text-primary" />
      </div>
    </Link>
  );
}
