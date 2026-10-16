import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { BookingWithListing, HostListing, Role } from "@/lib/types";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const HOST_COLUMNS =
  "id, title, description, city, country, price_per_night, max_guests, rating, image_url, host_id";

// Who is logged in, and are they a host?
// If the host migration has not been run yet, everyone is simply a "guest".
export async function getCurrentUserRole(): Promise<{
  user: User | null;
  role: Role;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, role: "guest" };

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

  return { user, role: data?.role === "host" ? "host" : "guest" };
}

export async function getMyListings(userId: string): Promise<HostListing[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(HOST_COLUMNS)
    .eq("host_id", userId)
    .order("title", { ascending: true });
  return (data ?? []) as HostListing[];
}

export async function getMyListing(
  id: string,
  userId: string
): Promise<HostListing | null> {
  if (!UUID_RE.test(id)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("listings")
    .select(HOST_COLUMNS)
    .eq("id", id)
    .eq("host_id", userId)
    .maybeSingle();
  return (data as HostListing | null) ?? null;
}

// Bookings made on the host's own listings (newest stay first).
export async function getHostBookings(
  listingIds: string[]
): Promise<BookingWithListing[]> {
  if (listingIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("bookings")
    .select(
      "id, listing_id, check_in, check_out, guests, total_price, status, created_at, listings(title, city)"
    )
    .in("listing_id", listingIds)
    .order("check_in", { ascending: false });
  return (data ?? []) as unknown as BookingWithListing[];
}
