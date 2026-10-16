export type Listing = {
  id: string;
  title: string;
  description: string | null;
  city: string;
  country: string;
  price_per_night: number;
  max_guests: number;
  rating: number | null;
  image_url: string | null;
};

// A stretch of dates already taken on a listing (no user info).
export type BookedRange = { check_in: string; check_out: string };

export type Role = "guest" | "host";

// A listing as seen by the host who owns it.
export type HostListing = Listing & { host_id: string | null };

export type BookingStatus = "confirmed" | "cancelled";

// A booking row plus the joined listing info shown on the dashboard.
export type BookingWithListing = {
  id: string;
  listing_id: string;
  check_in: string; // yyyy-mm-dd
  check_out: string; // yyyy-mm-dd
  guests: number;
  total_price: number;
  status: BookingStatus;
  created_at: string;
  listings: { title: string; city: string } | null;
};
