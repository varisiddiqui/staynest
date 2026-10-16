import Link from "next/link";

export default function ListingNotFound() {
  return (
    <main className="mx-auto max-w-xl space-y-3 p-6 text-center">
      <h1 className="text-xl font-semibold">Stay not found</h1>
      <p className="text-muted-foreground">
        This listing doesn&apos;t exist or was removed.
      </p>
      <Link href="/listings" className="text-sm underline underline-offset-4">
        Back to all stays
      </Link>
    </main>
  );
}
