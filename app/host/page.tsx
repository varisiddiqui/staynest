import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { becomeHost } from "@/app/host/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate, formatINR } from "@/lib/format";
import {
  getCurrentUserRole,
  getHostBookings,
  getMyListings,
} from "@/lib/host";

export const metadata: Metadata = { title: "Host" };

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const SAVED_MESSAGES: Record<string, string> = {
  welcome: "You're now a host. Add your first listing!",
  created: "Listing added.",
  updated: "Listing updated.",
  deleted: "Listing deleted.",
};

const pick = (v: string | string[] | undefined) =>
  Array.isArray(v) ? v[0] : v;

async function HostContent({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const { user, role } = await getCurrentUserRole();

  // Second line of defence (proxy.ts already redirects).
  if (!user) redirect("/login");

  const error = pick(sp.error);
  const saved = pick(sp.saved);
  const notice = error ? (
    <p role="alert" className="rounded-md border border-red-300 p-3 text-sm">
      {error}
    </p>
  ) : saved && SAVED_MESSAGES[saved] ? (
    <p className="rounded-md border border-green-300 p-3 text-sm text-green-700">
      {SAVED_MESSAGES[saved]}
    </p>
  ) : null;

  if (role !== "host") {
    return (
      <div className="space-y-4">
        {notice}
        <Card>
          <CardContent className="space-y-3">
            <h1 className="text-xl font-semibold">Become a host</h1>
            <p className="text-sm text-muted-foreground">
              List your own stays, set your price, and see who books them.
            </p>
            <form action={becomeHost}>
              <Button type="submit">Become a host</Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  const listings = await getMyListings(user.id);
  const bookings = await getHostBookings(listings.map((l) => l.id));
  const confirmed = bookings.filter((b) => b.status === "confirmed");
  const revenue = confirmed.reduce((sum, b) => sum + b.total_price, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Host dashboard</h1>
        <Link
          href="/host/new"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Add a listing
        </Link>
      </div>

      {notice}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Listings</p>
            <p className="text-2xl font-semibold">{listings.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Confirmed bookings</p>
            <p className="text-2xl font-semibold">{confirmed.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <p className="text-sm text-muted-foreground">Revenue</p>
            <p className="text-2xl font-semibold">{formatINR(revenue)}</p>
          </CardContent>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">My listings</h2>
        {listings.length === 0 ? (
          <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
            You haven&apos;t added any listings yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {listings.map((l) => (
              <li key={l.id}>
                <Card>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="font-medium">{l.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {l.city} · {formatINR(l.price_per_night)} / night · up
                        to {l.max_guests} guests
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      <Link
                        href={`/listings/${l.id}`}
                        className="underline underline-offset-4"
                      >
                        View
                      </Link>
                      <Link
                        href={`/host/${l.id}/edit`}
                        className="underline underline-offset-4"
                      >
                        Edit
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Bookings on my listings</h2>
        {bookings.length === 0 ? (
          <div className="rounded-lg border p-6 text-center text-sm text-muted-foreground">
            No bookings yet.
          </div>
        ) : (
          <ul className="space-y-3">
            {bookings.map((b) => (
              <li key={b.id}>
                <Card>
                  <CardContent className="space-y-1">
                    <p className="font-medium">
                      {b.listings?.title ?? "Stay"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(b.check_in)} → {formatDate(b.check_out)} ·{" "}
                      {b.guests} {b.guests === 1 ? "guest" : "guests"}
                    </p>
                    <p className="text-sm">
                      <span className="font-semibold">
                        {formatINR(b.total_price)}
                      </span>{" "}
                      <span
                        className={
                          b.status === "confirmed"
                            ? "text-green-700"
                            : "text-muted-foreground"
                        }
                      >
                        · {b.status}
                      </span>
                    </p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function HostPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <main className="mx-auto w-full max-w-4xl p-6">
      <Suspense fallback={<Skeleton className="h-48 w-full" />}>
        <HostContent searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
