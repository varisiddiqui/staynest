"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

export type ListingFormState = { error?: string };

type ListingArgs = {
  p_title: string;
  p_description: string;
  p_city: string;
  p_country: string;
  p_price: number;
  p_max_guests: number;
  p_image_url: string;
};

type Parsed = { error: string } | { args: ListingArgs };

function parseListing(formData: FormData): Parsed {
  const get = (k: string) => String(formData.get(k) ?? "").trim();

  const title = get("title");
  const city = get("city");
  const price = Number.parseInt(get("price_per_night"), 10);
  const guests = Number.parseInt(get("max_guests"), 10);
  const imageUrl = get("image_url");

  if (!title) return { error: "Please enter a title." };
  if (!city) return { error: "Please enter a city." };
  if (!Number.isFinite(price) || price < 1) {
    return { error: "Price per night must be at least 1." };
  }
  if (!Number.isFinite(guests) || guests < 1) {
    return { error: "Max guests must be at least 1." };
  }
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) {
    return { error: "Image URL must start with http:// or https://" };
  }

  return {
    args: {
      p_title: title,
      p_description: get("description"),
      p_city: city,
      p_country: get("country"),
      p_price: price,
      p_max_guests: guests,
      p_image_url: imageUrl,
    },
  };
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return supabase;
}

export async function becomeHost(): Promise<void> {
  const supabase = await requireUser();
  const { error } = await supabase.rpc("become_host");
  if (error) redirect(`/host?error=${encodeURIComponent(error.message)}`);
  revalidatePath("/host");
  redirect("/host?saved=welcome");
}

export async function createListing(
  _prev: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  const parsed = parseListing(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await requireUser();
  const { error } = await supabase.rpc("create_listing", parsed.args);
  if (error) return { error: error.message };

  revalidatePath("/host");
  revalidatePath("/listings");
  redirect("/host?saved=created");
}

// Bound to a listing id: updateListing.bind(null, id)
export async function updateListing(
  id: string,
  _prev: ListingFormState,
  formData: FormData
): Promise<ListingFormState> {
  const parsed = parseListing(formData);
  if ("error" in parsed) return { error: parsed.error };

  const supabase = await requireUser();
  const { error } = await supabase.rpc("update_listing", {
    p_id: id,
    ...parsed.args,
  });
  if (error) return { error: error.message };

  revalidatePath("/host");
  revalidatePath("/listings");
  revalidatePath(`/listings/${id}`);
  redirect("/host?saved=updated");
}

// Bound to a listing id: deleteListing.bind(null, id)
export async function deleteListing(id: string): Promise<void> {
  const supabase = await requireUser();
  const { error } = await supabase.rpc("delete_listing", { p_id: id });
  if (error) redirect(`/host?error=${encodeURIComponent(error.message)}`);

  revalidatePath("/host");
  revalidatePath("/listings");
  redirect("/host?saved=deleted");
}
