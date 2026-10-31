import { Suspense } from "react";
import Link from "next/link";
import { getCurrentUserRole } from "@/lib/host";
import { SignOutButton } from "@/components/sign-out-button";
import { Skeleton } from "@/components/ui/skeleton";

const linkClass = "text-muted-foreground hover:text-foreground";

// Reads the session cookie (runtime data), so it sits inside <Suspense>.
async function NavAuth() {
  const { user, role } = await getCurrentUserRole();

  if (!user) {
    return (
      <>
        <Link href="/login" className={linkClass}>
          Log in
        </Link>
        <Link
          href="/signup"
          className="rounded-md bg-primary px-3 py-1.5 font-medium text-primary-foreground"
        >
          Sign up
        </Link>
      </>
    );
  }

  return (
    <>
      <Link href="/dashboard" className={linkClass}>
        My trips
      </Link>
      <Link href="/host" className={linkClass}>
        {role === "host" ? "Host" : "Become a host"}
      </Link>
      <SignOutButton />
    </>
  );
}

export function Navbar() {
  return (
    <header className="border-b">
      <nav className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-6 py-3">
        <Link href="/" className="font-semibold">
          StayNest
        </Link>
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <Link href="/listings" className={linkClass}>
            Stays
          </Link>
          <Suspense fallback={<Skeleton className="h-5 w-40" />}>
            <NavAuth />
          </Suspense>
        </div>
      </nav>
    </header>
  );
}
