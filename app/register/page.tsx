import { redirect } from "next/navigation";
import { RegisterForm } from "@/components/dashboard/RegisterForm";
import { getCurrentAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function RegisterPage() {
  const admin = await getCurrentAdmin();
  if (admin) {
    redirect("/dashboard");
  }

  return (
    <div className="relative min-h-dvh flex items-center justify-center bg-[#070B14] px-4 py-10 overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -left-32 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-pink-600/15 blur-3xl" />
      <div className="relative z-10 w-full flex justify-center">
        <RegisterForm />
      </div>
    </div>
  );
}
