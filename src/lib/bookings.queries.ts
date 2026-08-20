import { queryOptions } from "@tanstack/react-query";
import { listBookingsFn, listCourtsFn, getBookingFn, getCourtFn } from "./bookings.functions";
import type { Booking, BookingStatus, Court } from "./mock";
import { SPORT_IMAGES } from "./mock";
import { filterOfflineBookings, hasOfflineStorage, readOfflineRow, readOfflineRows, saveOfflineRows } from "./offline-store";

export type CourtRow = {
  id: string;
  name: string;
  sport: string;
  sport_label: string;
  surface: string;
  price_per_hour: number;
  image_key: string;
  image_url?: string | null;
};

export type BookingRow = {
  id: string;
  court_id: string;
  customer_name: string;
  customer_phone: string;
  start_at: string;
  end_at: string;
  status: BookingStatus;
  price: number;
  notes: string;
  recurrence_group_id: string | null;
  paid_at: string | null;
  payment_method: string | null;
  payment_note: string;
  invoice_sent_at: string | null;
  invoice_channel: string | null;
};

export function mapCourt(row: CourtRow): Court {
  const imageUrl = row.image_url ?? null;
  return {
    id: row.id,
    name: row.name,
    sport: row.sport as Court["sport"],
    sportLabel: row.sport_label,
    surface: row.surface,
    pricePerHour: Number(row.price_per_hour),
    imageKey: row.image_key,
    imageUrl,
    image: imageUrl || SPORT_IMAGES[row.image_key] || SPORT_IMAGES.padel,
  };
}

/** Fixed app timezone so SSR and browser render identical times (no hydration mismatch). */
export const APP_TIME_ZONE = "Asia/Aden";

const partsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: APP_TIME_ZONE,
  hour12: false,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
});

export function zonedParts(d: Date) {
  const parts = Object.fromEntries(partsFormatter.formatToParts(d).map((p) => [p.type, p.value]));
  return {
    year: parts.year!,
    month: parts.month!,
    day: parts.day!,
    hour: parts.hour === "24" ? "00" : parts.hour!,
    minute: parts.minute!,
  };
}

export function mapBooking(row: BookingRow): Booking {
  const s = new Date(row.start_at);
  const e = new Date(row.end_at);
  const hhmm = (d: Date) => {
    const p = zonedParts(d);
    return `${p.hour}:${p.minute}`;
  };

  return {
    id: row.id,
    courtId: row.court_id,
    customer: row.customer_name,
    phone: row.customer_phone,
    start: hhmm(s),
    end: hhmm(e),
    startAt: row.start_at,
    endAt: row.end_at,
    status: row.status,
    price: Number(row.price),
    notes: row.notes ?? "",
    recurrenceGroupId: row.recurrence_group_id ?? null,
    paidAt: row.paid_at ?? null,
    paymentMethod: (row.payment_method as Booking["paymentMethod"]) ?? null,
    paymentNote: row.payment_note ?? "",
    invoiceSentAt: row.invoice_sent_at ?? null,
    invoiceChannel: (row.invoice_channel as Booking["invoiceChannel"]) ?? null,
  };
}

export function localDateKey(d: Date = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export const courtsQuery = queryOptions({
  queryKey: ["courts"],
  queryFn: async () => {
    try {
      const rows = (await listCourtsFn()) as CourtRow[];
      await saveOfflineRows("courts", rows, true);
      return rows.map(mapCourt);
    } catch (error) {
      const rows = await readOfflineRows<CourtRow>("courts");
      if (!hasOfflineStorage()) throw error;
      return rows.map(mapCourt);
    }
  },
  staleTime: 5 * 60_000,
  networkMode: "always",
  retry: false,
});

export function courtQuery(id: string) {
  return queryOptions({
    queryKey: ["court", id],
    queryFn: async () => {
      try {
        const row = (await getCourtFn({ data: { id } })) as CourtRow;
        await saveOfflineRows("courts", [row]);
        return mapCourt(row);
      } catch (error) {
        const row = await readOfflineRow<CourtRow>("courts", id);
        if (!row) throw error;
        return mapCourt(row);
      }
    },
    staleTime: 60_000,
    networkMode: "always",
    retry: false,
  });
}

export type BookingsFilter = {
  date?: string;
  courtId?: string;
  status?: string;
  search?: string;
  duration?: "all" | "short" | "hour" | "long";
  phone?: string;
};

export function bookingsQuery(filter: BookingsFilter = {}) {
  return queryOptions({
    queryKey: ["bookings", filter],
    queryFn: async () => {
      try {
        const rows = (await listBookingsFn({ data: filter })) as BookingRow[];
        await saveOfflineRows("bookings", rows);
        return rows.map(mapBooking);
      } catch (error) {
        const rows = filterOfflineBookings(await readOfflineRows<BookingRow>("bookings"), filter);
        if (!hasOfflineStorage()) throw error;
        return rows.map(mapBooking);
      }
    },
    staleTime: 15_000,
    networkMode: "always",
    retry: false,
  });
}

export function bookingQuery(id: string) {
  return queryOptions({
    queryKey: ["booking", id],
    queryFn: async () => {
      try {
        const row = (await getBookingFn({ data: { id } })) as BookingRow;
        await saveOfflineRows("bookings", [row]);
        return mapBooking(row);
      } catch (error) {
        const row = await readOfflineRow<BookingRow>("bookings", id);
        if (!row) throw error;
        return mapBooking(row);
      }
    },
    staleTime: 15_000,
    networkMode: "always",
    retry: false,
  });
}
