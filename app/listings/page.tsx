import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { ListingCard } from "@/components/listing-card";
import { ListingsFilters } from "@/components/listings-filters";
import { FiltersSkeleton, GridSkeleton } from "@/components/listings-skeleton";
import { formatDate } from "@/lib/format";
import { getCities, parseFilters, searchListings } from "@/lib/listings";

export const metadata: Metadata = { title: "Stays" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Everything below that reads the URL or the database is "runtime data",
// so each piece sits inside its own <Suspense> boundary (Next.js 16 rule).

async function Filters({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseFilters(await searchParams);
  const cities = await getCities();
  return <ListingsFilters cities={cities} values={filters} />;
}

async function Results({ searchParams }: { searchParams: SearchParams }) {
  const filters = parseFilters(await searchParams);
  const { data, error } = await searchListings(filters);

  if (error) {
    return (
      <div role="alert" className="rounded-lg border border-red-300 p-4 text-sm">
        Could not load stays right now. Please try again.
        <span className="block text-muted-foreground">{error}</span>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="font-medium">No stays match your filters.</p>
        <Link
          href="/listings"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          Clear filters
        </Link>
      </div>
    );
  }

  // Carry the chosen dates and guests over to each stay's detail page.
  const carry = new URLSearchParams();
  if (filters.checkIn && filters.checkOut) {
    carry.set("checkIn", filters.checkIn);
    carry.set("checkOut", filters.checkOut);
  }
  if (filters.guests) carry.set("guests", String(filters.guests));
  const query = carry.toString();

  return (
    <>
      <p className="text-sm text-muted-foreground">
        {data.length} {data.length === 1 ? "stay" : "stays"} found
        {filters.checkIn &&
          filters.checkOut &&
          ` and available ${formatDate(filters.checkIn)} → ${formatDate(filters.checkOut)}`}
      </p>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map((listing) => (
          <ListingCard key={listing.id} listing={listing} query={query} />
        ))}
      </div>
    </>
  );
}

export default function ListingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <main className="mx-auto max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Find your stay</h1>
        <Link
          href="/dashboard"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          Dashboard
        </Link>
      </div>

      <Suspense fallback={<FiltersSkeleton />}>
        <Filters searchParams={searchParams} />
      </Suspense>

      <Suspense fallback={<GridSkeleton />}>
        <Results searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
