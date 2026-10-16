import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 p-6">
      <h1 className="text-3xl font-semibold">HackCellence App</h1>
      <p className="text-muted-foreground">
        Starter is live. Auth is ready; features come next.
      </p>
      <div className="flex gap-3">
        <Link
          href="/login"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
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
