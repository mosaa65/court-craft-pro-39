import { queryOptions } from "@tanstack/react-query";
import { listBookingsFn, listCourtsFn, getBookingFn, getCourtFn } from "./bookings.functions";
import type { Booking, BookingStatus, Court } from "./mock";
import { SPORT_IMAGES } from "./mock";

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

export function mapBooking(row: BookingRow): Booking {
  const s = new Date(row.start_at);
  const e = new Date(row.end_at);
  const hhmm = (d: Date) =>
    `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
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
  queryFn: async () => (await listCourtsFn()).map((r) => mapCourt(r as CourtRow)),
  staleTime: 5 * 60_000,
});

export function courtQuery(id: string) {
  return queryOptions({
    queryKey: ["court", id],
    queryFn: async () => mapCourt((await getCourtFn({ data: { id } })) as CourtRow),
    staleTime: 60_000,
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
    queryFn: async () =>
      (await listBookingsFn({ data: filter })).map((r) => mapBooking(r as BookingRow)),
    staleTime: 15_000,
  });
}

export function bookingQuery(id: string) {
  return queryOptions({
    queryKey: ["booking", id],
    queryFn: async () => mapBooking((await getBookingFn({ data: { id } })) as BookingRow),
    staleTime: 15_000,
  });
}
