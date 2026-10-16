import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatINR } from "@/lib/format";
import type { Listing } from "@/lib/types";

export function ListingCard({ listing }: { listing: Listing }) {
  return (
    <Link
      href={`/listings/${listing.id}`}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <Card className="h-full overflow-hidden transition-shadow group-hover:shadow-md">
        {listing.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.image_url}
            alt={listing.title}
            className="h-36 w-full object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-36 items-center justify-center bg-gradient-to-br from-sky-300 to-indigo-400 text-5xl font-semibold text-white"
          >
            {listing.city.charAt(0)}
          </div>
        )}
        <CardHeader>
          <CardTitle className="line-clamp-1">{listing.title}</CardTitle>
          <CardDescription>
            {listing.city}, {listing.country}
            {listing.rating !== null && ` · ★ ${listing.rating.toFixed(1)}`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="line-clamp-2 text-sm text-muted-foreground">
            {listing.description}
          </p>
        </CardContent>
        <CardFooter className="justify-between text-sm">
          <span>
            <span className="font-semibold">
              {formatINR(listing.price_per_night)}
            </span>{" "}
            / night
          </span>
          <span className="text-muted-foreground">
            up to {listing.max_guests} guests
          </span>
        </CardFooter>
      </Card>
    </Link>
  );
}
