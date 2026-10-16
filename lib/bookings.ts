import { createClient } from "@/lib/supabase/server";
import type { BookedRange, BookingWithListing } from "@/lib/types";

// Upcoming dates already taken on a listing. Public info: dates only, no names.
// Returns [] if the availability migration has not been run yet.
export async function getBookedRanges(
  listingId: string
): Promise<BookedRange[]> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_booked_ranges", {
    p_listing_id: listingId,
  });
  if (error) return [];
  return (data ?? []) as BookedRange[];
}

// Returns the logged-in user's bookings (newest stay first).
// Row-level security already limits rows to the current user.
export async function getMyBookings(): Promise<{
  data: BookingWithListing[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, listing_id, check_in, check_out, guests, total_price, status, created_at, listings(title, city)"
    )
    .order("check_in", { ascending: false });

  if (error) return { data: [], error: error.message };
  return { data: (data ?? []) as unknown as BookingWithListing[], error: null };
}
