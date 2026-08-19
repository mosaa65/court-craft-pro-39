import type { BookingRow, BookingsFilter, CourtRow } from "./bookings.queries";
import type { CustomerRow } from "./customers.queries";
import type { NotificationRow } from "./notifications.queries";

type StoreName = "courts" | "bookings" | "customers" | "notifications";
type OfflineRow = CourtRow | BookingRow | CustomerRow | NotificationRow;

const DB_NAME = "malaeb-offline";
const DB_VERSION = 1;

function openOfflineDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      for (const name of ["courts", "bookings", "customers", "notifications"] as StoreName[]) {
        if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function canUseOfflineDb() {
  return typeof window !== "undefined" && "indexedDB" in window;
}

export function hasOfflineStorage() {
  return canUseOfflineDb();
}

export async function saveOfflineRows<T extends OfflineRow>(storeName: StoreName, rows: T[], replace = false) {
  if (!canUseOfflineDb()) return;
  const db = await openOfflineDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    if (replace) store.clear();
    for (const row of rows) store.put(row);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function readOfflineRows<T extends OfflineRow>(storeName: StoreName): Promise<T[]> {
  if (!canUseOfflineDb()) return [];
  const db = await openOfflineDb();
  const rows = await new Promise<T[]>((resolve, reject) => {
    const request = db.transaction(storeName, "readonly").objectStore(storeName).getAll();
    request.onsuccess = () => resolve(request.result as T[]);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return rows;
}

export async function readOfflineRow<T extends OfflineRow>(storeName: StoreName, id: string): Promise<T | undefined> {
  if (!canUseOfflineDb()) return undefined;
  const db = await openOfflineDb();
  const row = await new Promise<T | undefined>((resolve, reject) => {
    const request = db.transaction(storeName, "readonly").objectStore(storeName).get(id);
    request.onsuccess = () => resolve(request.result as T | undefined);
    request.onerror = () => reject(request.error);
  });
  db.close();
  return row;
}

export function filterOfflineBookings(rows: BookingRow[], filter: BookingsFilter) {
  const search = filter.search?.trim().toLocaleLowerCase("ar") ?? "";
  return rows
    .filter((row) => {
      if (filter.date) {
        const date = new Date(row.start_at);
        const localDate = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
        if (localDate !== filter.date) return false;
      }
      if (filter.courtId && row.court_id !== filter.courtId) return false;
      if (filter.status && filter.status !== "all" && row.status !== filter.status) return false;
      if (filter.phone && row.customer_phone !== filter.phone) return false;
      if (search && !`${row.customer_name} ${row.customer_phone} ${row.notes}`.toLocaleLowerCase("ar").includes(search)) return false;
      const minutes = (new Date(row.end_at).getTime() - new Date(row.start_at).getTime()) / 60_000;
      if (filter.duration === "short" && minutes >= 60) return false;
      if (filter.duration === "hour" && minutes !== 60) return false;
      if (filter.duration === "long" && minutes <= 60) return false;
      return true;
    })
    .sort((a, b) => a.start_at.localeCompare(b.start_at));
}

export function filterOfflineCustomers(rows: CustomerRow[], search?: string) {
  const term = search?.trim().toLocaleLowerCase("ar");
  if (!term) return rows.sort((a, b) => a.name.localeCompare(b.name, "ar"));
  return rows.filter((row) => `${row.name} ${row.phone} ${row.notes}`.toLocaleLowerCase("ar").includes(term));
}