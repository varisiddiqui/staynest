import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/types";

export type SortKey = "rating" | "price_asc" | "price_desc";

export type ListingFilters = {
  q?: string;
  city?: string;
  maxPrice?: number;
  guests?: number;
  checkIn?: string; // yyyy-mm-dd, only set together with checkOut
  checkOut?: string;
  sort: SortKey;
};

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

function toPositiveInt(v: string | string[] | undefined) {
  const n = Number.parseInt(first(v) ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

// "2026-10-20" -> "2026-10-20"; anything that isn't a real calendar date -> undefined.
export function parseDateParam(
  v: string | string[] | undefined
): string | undefined {
  const s = first(v)?.trim();
  if (!s || !DATE_RE.test(s)) return undefined;
  const d = new Date(`${s}T00:00:00Z`);
  if (Number.isNaN(d.getTime()) || d.toISOString().slice(0, 10) !== s) {
    return undefined;
  }
  return s;
}

// Both dates must be valid and check-out must be after check-in.
export function parseDateRange(raw: RawParams): {
  checkIn?: string;
  checkOut?: string;
} {
  const checkIn = parseDateParam(raw.checkIn);
  const checkOut = parseDateParam(raw.checkOut);
  if (!checkIn || !checkOut || checkOut <= checkIn) return {};
  return { checkIn, checkOut };
}

// Turns the URL query string into safe, typed filters.
export function parseFilters(raw: RawParams): ListingFilters {
  const q = first(raw.q)
    // strip characters that have special meaning in PostgREST filters
    ?.replace(/[,()%*\\:"]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 50);
  const city = first(raw.city)?.trim().slice(0, 60);
  const sortRaw = first(raw.sort);
  const sort: SortKey =
    sortRaw === "price_asc" || sortRaw === "price_desc" ? sortRaw : "rating";

  return {
    q: q || undefined,
    city: city || undefined,
    maxPrice: toPositiveInt(raw.maxPrice),
    guests: toPositiveInt(raw.guests),
    ...parseDateRange(raw),
    sort,
  };
}

const COLUMNS =
  "id, title, description, city, country, price_per_night, max_guests, rating, image_url";

export async function searchListings(
  f: ListingFilters
): Promise<{ data: Listing[]; error: string | null }> {
  const supabase = await createClient();

  let query = supabase.from("listings").select(COLUMNS).limit(24);

  if (f.q) query = query.or(`title.ilike.%${f.q}%,city.ilike.%${f.q}%`);
  if (f.city) query = query.eq("city", f.city);
  if (f.maxPrice) query = query.lte("price_per_night", f.maxPrice);
  if (f.guests) query = query.gte("max_guests", f.guests);

  // Date search: hide stays that already have a confirmed booking in the range.
  if (f.checkIn && f.checkOut) {
    const { data: busy, error: busyError } = await supabase.rpc(
      "unavailable_listing_ids",
      { p_check_in: f.checkIn, p_check_out: f.checkOut }
    );
    if (busyError) return { data: [], error: busyError.message };
    const busyIds = (busy ?? []) as string[];
    if (busyIds.length > 0) {
      query = query.not("id", "in", `(${busyIds.join(",")})`);
    }
  }

  if (f.sort === "price_asc") {
    query = query.order("price_per_night", { ascending: true });
  } else if (f.sort === "price_desc") {
    query = query.order("price_per_night", { ascending: false });
  } else {
    query = query.order("rating", { ascending: false, nullsFirst: false });
  }
  query = query.order("title", { ascending: true }); // stable tie-break

  const { data, error } = await query;
  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as Listing[], error: null };
}

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// One listing by id, or null if it doesn't exist (or the id is malformed).
export async function getListing(id: string): Promise<Listing | null> {
  if (!UUID_RE.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(COLUMNS)
    .eq("id", id)
    .maybeSingle();
  return (data as Listing | null) ?? null;
}

export async function getCities(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("listings").select("city").limit(500);
  const cities = (data ?? []).map((r: { city: string }) => r.city);
  return Array.from(new Set(cities)).sort();
}
