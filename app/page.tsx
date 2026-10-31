import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 p-6">
      <h1 className="text-3xl font-semibold">StayNest</h1>
      <p className="text-muted-foreground">
        Find a stay, book it, and manage your trips.
      </p>
      <div className="flex flex-wrap gap-3">
        <Link
          href="/listings"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Browse stays
        </Link>
        <Link
          href="/login"
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          Sign up
        </Link>
        <Link
          href="/dashboard"
          className="rounded-md border px-4 py-2 text-sm font-medium"
        >
          Dashboard
        </Link>
      </div>
    </main>
  );
}
