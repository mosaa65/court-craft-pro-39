import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { serverClient } from "./bookings.server";

/** ---------- COURTS ---------- */

export const listCourtsFn = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverClient();
  const { data, error } = await sb.from("courts").select("*").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
});

export const getCourtFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: row, error } = await sb.from("courts").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("NOT_FOUND");
    return row;
  });

const CourtUpsertInput = z.object({
  id: z.string().min(1),
  name: z.string().min(2, "الاسم قصير جداً"),
  sport: z.enum(["padel", "football", "tennis", "basket"]),
  sportLabel: z.string().min(1),
  surface: z.string().default(""),
  pricePerHour: z.number().nonnegative().default(0),
  imageKey: z.string().min(1),
  imageUrl: z.string().url().nullable().optional(),
});

export const createCourtFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CourtUpsertInput.parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: row, error } = await sb
      .from("courts")
      .insert({
        id: data.id,
        name: data.name,
        sport: data.sport,
        sport_label: data.sportLabel,
        surface: data.surface,
        price_per_hour: data.pricePerHour,
        image_key: data.imageKey,
        image_url: data.imageUrl ?? null,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const updateCourtFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => CourtUpsertInput.parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: row, error } = await sb
      .from("courts")
      .update({
        name: data.name,
        sport: data.sport,
        sport_label: data.sportLabel,
        surface: data.surface,
        price_per_hour: data.pricePerHour,
        image_key: data.imageKey,
        image_url: data.imageUrl ?? null,
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const deleteCourtFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { error } = await sb.from("courts").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** ---------- BOOKINGS ---------- */

const ListInput = z.object({
  date: z.string().optional(), // yyyy-mm-dd (local)
  courtId: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  duration: z.enum(["all", "short", "hour", "long"]).optional(),
  phone: z.string().optional(),
});

export const listBookingsFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => ListInput.parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    let q = sb.from("bookings").select("*").order("start_at", { ascending: true });

    if (data.date) {
      const start = new Date(data.date + "T00:00:00");
      const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
      q = q.gte("start_at", start.toISOString()).lt("start_at", end.toISOString());
    }
    if (data.courtId) q = q.eq("court_id", data.courtId);
    if (data.status && data.status !== "all") q = q.eq("status", data.status as never);
    if (data.phone) q = q.eq("customer_phone", data.phone);
    if (data.search) {
      const s = data.search.replace(/[%,]/g, " ");
      q = q.or(`customer_name.ilike.%${s}%,customer_phone.ilike.%${s}%,notes.ilike.%${s}%`);
    }

    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);

    let list = rows ?? [];
    if (data.duration && data.duration !== "all") {
      list = list.filter((b) => {
        const m = (new Date(b.end_at).getTime() - new Date(b.start_at).getTime()) / 60000;
        if (data.duration === "short") return m < 60;
        if (data.duration === "hour") return m >= 60 && m <= 60;
        return m > 60;
      });
    }
    return list;
  });

export const getBookingFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: row, error } = await sb.from("bookings").select("*").eq("id", data.id).maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("NOT_FOUND");
    return row;
  });

const UpsertInput = z.object({
  courtId: z.string().min(1),
  customerName: z.string().min(1, "الاسم مطلوب"),
  customerPhone: z.string().optional().default(""),
  startAt: z.string(), // ISO
  endAt: z.string(),   // ISO
  status: z.enum(["confirmed", "pending", "training", "maintenance", "cancelled"]).default("confirmed"),
  price: z.number().nonnegative().default(0),
  notes: z.string().optional().default(""),
});

export const createBookingFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => UpsertInput.parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: overlap, error: oerr } = await sb
      .from("bookings")
      .select("id")
      .eq("court_id", data.courtId)
      .neq("status", "cancelled")
      .lt("start_at", data.endAt)
      .gt("end_at", data.startAt)
      .limit(1);
    if (oerr) throw new Error(oerr.message);
    if (overlap && overlap.length) throw new Error("هذا الوقت محجوز على نفس الملعب");

    const { data: row, error } = await sb
      .from("bookings")
      .insert({
        court_id: data.courtId,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        start_at: data.startAt,
        end_at: data.endAt,
        status: data.status,
        price: data.price,
        notes: data.notes,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    // Fire-and-notify: booking_created
    const { data: court } = await sb.from("courts").select("name").eq("id", data.courtId).maybeSingle();
    await sb.from("notifications").insert({
      kind: "booking_created",
      title: "حجز جديد",
      body: `${row.customer_name} — ${court?.name ?? ""} • ${Number(row.price).toLocaleString("ar-SA")} ر.س`,
      booking_id: row.id,
    });
    return row;
  });

export const updateBookingFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => UpsertInput.extend({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: overlap, error: oerr } = await sb
      .from("bookings")
      .select("id")
      .eq("court_id", data.courtId)
      .neq("id", data.id)
      .neq("status", "cancelled")
      .lt("start_at", data.endAt)
      .gt("end_at", data.startAt)
      .limit(1);
    if (oerr) throw new Error(oerr.message);
    if (overlap && overlap.length) throw new Error("هذا الوقت محجوز على نفس الملعب");

    const { data: row, error } = await sb
      .from("bookings")
      .update({
        court_id: data.courtId,
        customer_name: data.customerName,
        customer_phone: data.customerPhone,
        start_at: data.startAt,
        end_at: data.endAt,
        status: data.status,
        price: data.price,
        notes: data.notes,
      })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return row;
  });

export const cancelBookingFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { data: row, error } = await sb
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);

    await sb.from("notifications").insert({
      kind: "booking_cancelled",
      title: "تم إلغاء الحجز",
      body: `${row.customer_name} — ${new Date(row.start_at).toLocaleDateString("ar-SA")}`,
      booking_id: row.id,
    });
    return row;
  });

/** Cancel every future occurrence in a recurrence group (including the one with id). */
export const cancelRecurrenceFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ groupId: z.string().uuid(), fromISO: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const { error } = await sb
      .from("bookings")
      .update({ status: "cancelled" })
      .eq("recurrence_group_id", data.groupId)
      .gte("start_at", data.fromISO);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const RecurringInput = UpsertInput.extend({
  weeks: z.number().int().min(2).max(52),
});

export const createRecurringBookingFn = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => RecurringInput.parse(d))
  .handler(async ({ data }) => {
    const sb = serverClient();
    const startBase = new Date(data.startAt);
    const endBase = new Date(data.endAt);
    const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

    // Build all occurrences
    const occurrences: { startISO: string; endISO: string; weekIndex: number }[] = [];
    for (let i = 0; i < data.weeks; i++) {
      occurrences.push({
        startISO: new Date(startBase.getTime() + i * WEEK_MS).toISOString(),
        endISO: new Date(endBase.getTime() + i * WEEK_MS).toISOString(),
        weekIndex: i + 1,
      });
    }

    // Pre-check all overlaps for the same court
    const conflicts: number[] = [];
    for (const occ of occurrences) {
      const { data: overlap, error: oerr } = await sb
        .from("bookings")
        .select("id")
        .eq("court_id", data.courtId)
        .neq("status", "cancelled")
        .lt("start_at", occ.endISO)
        .gt("end_at", occ.startISO)
        .limit(1);
      if (oerr) throw new Error(oerr.message);
      if (overlap && overlap.length) conflicts.push(occ.weekIndex);
    }
    if (conflicts.length) {
      throw new Error(`تعارض في الأسابيع: ${conflicts.join("، ")} — لم يتم إنشاء أي حجز`);
    }

    // Generate group id via crypto
    const groupId = crypto.randomUUID();

    const rows = occurrences.map((occ) => ({
      court_id: data.courtId,
      customer_name: data.customerName,
      customer_phone: data.customerPhone,
      start_at: occ.startISO,
      end_at: occ.endISO,
      status: data.status,
      price: data.price,
      notes: data.notes,
      recurrence_group_id: groupId,
    }));

    const { data: inserted, error } = await sb.from("bookings").insert(rows).select("*");
    if (error) throw new Error(error.message);
    return { groupId, count: inserted?.length ?? 0 };
  });
