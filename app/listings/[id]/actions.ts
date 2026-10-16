"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type BookingState = { error?: string };

// Called from the booking form. The database function `create_booking`
// does the real checks (login, dates, guest limit, double-booking) and
// computes the price, so we only pass the raw choices.
export async function createBooking(
  listingId: string,
  _prev: BookingState,
  formData: FormData
): Promise<BookingState> {
  const checkIn = String(formData.get("check_in") ?? "");
  const checkOut = String(formData.get("check_out") ?? "");
  const guests = Number.parseInt(String(formData.get("guests") ?? ""), 10);

  if (!checkIn || !checkOut) {
    return { error: "Please choose both check-in and check-out dates." };
  }
  if (!Number.isFinite(guests) || guests < 1) {
    return { error: "Please enter the number of guests." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { error } = await supabase.rpc("create_booking", {
    p_listing_id: listingId,
    p_check_in: checkIn,
    p_check_out: checkOut,
    p_guests: guests,
  });

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  // redirect() must be called outside try/catch.
  redirect("/dashboard?booked=1");
}
