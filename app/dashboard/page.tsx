import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getMyBookings } from "@/lib/bookings";
import { formatDate, formatINR } from "@/lib/format";
import { cancelBooking } from "@/app/dashboard/actions";
import { SignOutButton } from "@/components/sign-out-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { connection } from "next/server";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

// Reads the session cookie (runtime data), so it must sit inside <Suspense>.
async function UserInfo() {
  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Second line of defence (proxy.ts already redirects).
  if (!user) redirect("/login");

  return (
    <p className="text-muted-foreground">
      Logged in as <span className="font-medium">{user.email}</span>
    </p>
  );
}

// Success / error messages passed back from the booking actions.
async function Notice({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const pick = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v;

  const error = pick(sp.error);
  if (error) {
    return (
      <p role="alert" className="rounded-md border border-red-300 p-3 text-sm">
        {error}
      </p>
    );
  }
  if (pick(sp.booked)) {
    return (
      <p className="rounded-md border border-green-300 p-3 text-sm text-green-700">
        Booking confirmed! Your trip is listed below.
      </p>
    );
  }
  if (pick(sp.cancelled)) {
    return (
      <p className="rounded-md border p-3 text-sm text-muted-foreground">
        Booking cancelled.
      </p>
    );
  }
  return null;
}

async function Trips() {
  await connection();
  const { data, error } = await getMyBookings();

  if (error) {
    return (
      <p role="alert" className="text-sm text-red-600">
        Could not load your trips: {error}
      </p>
    );
  }

  if (data.length === 0) {
    return (
      <div className="rounded-lg border p-6 text-center">
        <p className="font-medium">No trips yet.</p>
        <Link
          href="/listings"
          className="text-sm text-muted-foreground underline underline-offset-4"
        >
          Find a stay to book
        </Link>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {data.map((b) => (
        <li key={b.id}>
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-1">
                <Link
                  href={`/listings/${b.listing_id}`}
                  className="font-medium underline-offset-4 hover:underline"
                >
                  {b.listings?.title ?? "Stay"}
                </Link>
                <p className="text-sm text-muted-foreground">
                  {b.listings?.city && `${b.listings.city} · `}
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
              </div>
              {b.status === "confirmed" && (
                <form action={cancelBooking.bind(null, b.id)}>
                  <Button type="submit" variant="outline" size="sm">
                    Cancel
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </li>
      ))}
    </ul>
  );
}

export default function DashboardPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <div className="flex items-center gap-3">
          <Link
            href="/listings"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
          >
            Browse stays
          </Link>
          <SignOutButton />
        </div>
      </div>

      <Suspense fallback={<Skeleton className="h-5 w-64" />}>
        <UserInfo />
      </Suspense>

      <Suspense>
        <Notice searchParams={searchParams} />
      </Suspense>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">My trips</h2>
        <Suspense fallback={<Skeleton className="h-24 w-full" />}>
          <Trips />
        </Suspense>
      </section>
    </main>
  );
}
