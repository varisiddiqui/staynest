import { AuthForm } from "@/components/auth-form";

export default function SignupPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <AuthForm mode="signup" />
    </main>
  );
}
