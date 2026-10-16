import { Suspense } from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";
import { Skeleton } from "@/components/ui/skeleton";

// Reads the session cookie (runtime data), so it must sit inside <Suspense>.
async function UserInfo() {
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

export default function DashboardPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <Suspense fallback={<Skeleton className="h-5 w-64" />}>
        <UserInfo />
      </Suspense>
      <div className="flex items-center gap-3">
        <Link
          href="/listings"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          Browse stays
        </Link>
        <SignOutButton />
      </div>
    </main>
  );
}
