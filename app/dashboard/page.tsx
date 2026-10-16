import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SignOutButton } from "@/components/sign-out-button";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Second line of defence (proxy.ts already redirects).
  if (!user) redirect("/login");

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="text-muted-foreground">
        Logged in as <span className="font-medium">{user.email}</span>
      </p>
      <div>
        <SignOutButton />
      </div>
    </main>
  );
}
