import { createClient } from "@/lib/supabase/server";
import type { BookingWithListing } from "@/lib/types";

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
