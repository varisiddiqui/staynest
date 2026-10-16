import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createListing } from "@/app/host/actions";
import { ListingForm } from "@/components/listing-form";
import { Skeleton } from "@/components/ui/skeleton";
import { getCurrentUserRole } from "@/lib/host";

export const metadata: Metadata = { title: "Add a listing" };

async function NewListing() {
  const { user, role } = await getCurrentUserRole();
  if (!user) redirect("/login");
  if (role !== "host") redirect("/host");

  return <ListingForm action={createListing} submitLabel="Add listing" />;
}

export default function NewListingPage() {
  return (
    <main className="mx-auto w-full max-w-2xl space-y-6 p-6">
      <Link
        href="/host"
        className="text-sm text-muted-foreground underline underline-offset-4"
      >
        ← Back to host dashboard
      </Link>
      <h1 className="text-2xl font-semibold">Add a listing</h1>
      <Suspense fallback={<Skeleton className="h-96 w-full" />}>
        <NewListing />
      </Suspense>
    </main>
  );
}
