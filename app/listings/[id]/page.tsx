import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingForm } from "@/components/booking-form";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getBookedRanges } from "@/lib/bookings";
import { formatDate, formatINR } from "@/lib/format";
import { getListing, parseDateRange } from "@/lib/listings";
import { createClient } from "@/lib/supabase/server";
import type { BookedRange, Listing } from "@/lib/types";

export const metadata: Metadata = { title: "Stay details" };

type Params = Promise<{ id: string }>;
type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Reads the session cookie (runtime data), so it sits inside <Suspense>.
async function BookingPanel({
  listing,
  booked,
  checkIn,
  checkOut,
  guests,
}: {
  listing: Listing;
  booked: BookedRange[];
  checkIn?: string;
  checkOut?: string;
  guests?: number;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <p className="text-sm text-muted-foreground">
        <Link href="/login" className="font-medium underline underline-offset-4">
          Log in
        </Link>{" "}
        or{" "}
        <Link href="/signup" className="font-medium underline underline-offset-4">
          sign up
        </Link>{" "}
        to book this stay.
      </p>
    );
  }

  // Same day the database uses for its "no past dates" rule (UTC).
  const minDate = new Date().toISOString().slice(0, 10);

  // Ignore pre-filled dates from the URL if they are already in the past.
  const datesOk = Boolean(checkIn && checkOut && checkIn >= minDate);

  return (
    <BookingForm
      listingId={listing.id}
      pricePerNight={listing.price_per_night}
      maxGuests={listing.max_guests}
      minDate={minDate}
      booked={booked}
      defaultCheckIn={datesOk ? checkIn : undefined}
      defaultCheckOut={datesOk ? checkOut : undefined}
      defaultGuests={guests}
    />
  );
}

async function Detail({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { id } = await params;
  const sp = await searchParams;

  const listing = await getListing(id);
  if (!listing) notFound();

  const booked = await getBookedRanges(listing.id);

  // Dates and guests carried over from the search page (validated).
  const { checkIn, checkOut } = parseDateRange(sp);
  const guestsRaw = Number.parseInt(
    String(Array.isArray(sp.guests) ? sp.guests[0] : (sp.guests ?? "")),
    10
  );
  const guests = Number.isFinite(guestsRaw) && guestsRaw > 0 ? guestsRaw : undefined;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {listing.image_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={listing.image_url}
            alt={listing.title}
            className="h-64 w-full rounded-xl object-cover"
          />
        ) : (
          <div
            aria-hidden="true"
            className="flex h-64 items-center justify-center rounded-xl bg-gradient-to-br from-sky-300 to-indigo-400 text-7xl font-semibold text-white"
          >
            {listing.city.charAt(0)}
          </div>
        )}
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold">{listing.title}</h1>
          <p className="text-muted-foreground">
            {listing.city}, {listing.country}
            {listing.rating !== null && ` · ★ ${listing.rating.toFixed(1)}`}
            {` · up to ${listing.max_guests} guests`}
          </p>
          {listing.description && <p>{listing.description}</p>}
        </div>

        <section className="space-y-2 rounded-lg border p-4">
          <h2 className="font-medium">Availability</h2>
          {booked.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No upcoming bookings. All dates are open.
            </p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Already booked (you can check in on a check-out day):
              </p>
              <ul className="space-y-1 text-sm">
                {booked.map((r) => (
                  <li key={`${r.check_in}_${r.check_out}`}>
                    {formatDate(r.check_in)} → {formatDate(r.check_out)}
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>

      <Card className="h-fit">
        <CardHeader>
          <CardTitle>
            {formatINR(listing.price_per_night)}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              / night
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense fallback={<Skeleton className="h-40 w-full" />}>
            <BookingPanel
              listing={listing}
              booked={booked}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
            />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-7 w-2/3" />
        <Skeleton className="h-5 w-1/2" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
    </div>
  );
}

export default function ListingDetailPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-6">
      <Link
        href="/listings"
        className="text-sm text-muted-foreground underline underline-offset-4"
      >
        ← Back to stays
      </Link>
      <Suspense fallback={<DetailSkeleton />}>
        <Detail params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
