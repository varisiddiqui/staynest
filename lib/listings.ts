import { createClient } from "@/lib/supabase/server";
import type { Listing } from "@/lib/types";

export type SortKey = "rating" | "price_asc" | "price_desc";

export type ListingFilters = {
  q?: string;
  city?: string;
  maxPrice?: number;
  guests?: number;
  sort: SortKey;
};

type RawParams = Record<string, string | string[] | undefined>;

const first = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

function toPositiveInt(v: string | string[] | undefined) {
  const n = Number.parseInt(first(v) ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : undefined;
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

export async function getCities(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("listings").select("city").limit(500);
  const cities = (data ?? []).map((r: { city: string }) => r.city);
  return Array.from(new Set(cities)).sort();
}
