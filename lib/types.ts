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
