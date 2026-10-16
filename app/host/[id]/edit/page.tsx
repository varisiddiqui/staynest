import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { deleteListing, updateListing } from "@/app/host/actions";
import { ListingForm } from "@/components/listing-form";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUserRole, getMyListing } from "@/lib/host";

export const metadata: Metadata = { title: "Edit listing" };

async function EditListing({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, role } = await getCurrentUserRole();
  if (!user) redirect("/login");
  if (role !== "host") redirect("/host");

  const listing = await getMyListing(id, user.id);
  if (!listing) notFound();

  return (
    <div className="space-y-8">
      <ListingForm
        action={updateListing.bind(null, listing.id)}
        defaults={listing}
        submitLabel="Save changes"
      />

      <section className="space-y-2 rounded-lg border border-red-200 p-4">
        <h2 className="font-medium">Delete this listing</h2>
        <p className="text-sm text-muted-foreground">
          This can&apos;t be undone. Listings with upcoming bookings can&apos;t
          be deleted.
        </p>
        <form action={deleteListing.bind(null, listing.id)}>
          <Button type="submit" variant="destructive">
            Delete listing
          </Button>
        </form>
      </section>
    </div>
  );
}

export default function EditListingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-6">
      <Link
        href="/host"
        className="text-sm text-muted-foreground underline underline-offset-4"
      >
        ← Back to host dashboard
      </Link>
      <h1 className="text-2xl font-semibold">Edit listing</h1>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <EditListing params={params} />
      </Suspense>
    </main>
  );
}
