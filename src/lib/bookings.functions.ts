import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function serverClient() {
  const url = process.env.SUPABASE_URL!;
  const key = process.env.SUPABASE_PUBLISHABLE_KEY!;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (
          (key.startsWith("sb_publishable_") || key.startsWith("sb_secret_")) &&
          h.get("Authorization") === `Bearer ${key}`
        ) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

/** ---------- COURTS ---------- */

export const listCourtsFn = createServerFn({ method: "GET" }).handler(async () => {
  const sb = serverClient();
  const { data, error } = await sb.from("courts").select("*").order("name");
  if (error) throw new Error(error.message);
  return data ?? [];
});

/** ---------- BOOKINGS ---------- */

const ListInput = z.object({
  date: z.string().optional(), // yyyy-mm-dd (local)
  courtId: z.string().optional(),
  status: z.string().optional(),
  search: z.string().optional(),
  duration: z.enum(["all", "short", "hour", "long"]).optional(),
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
  customerName: z.string().min(2, "الاسم قصير جداً"),
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
    // basic overlap check for same court
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
    return row;
  });
