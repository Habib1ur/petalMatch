"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Lock, Mail } from "lucide-react";
import { z } from "zod";
import { FlowerIcon } from "@/components/flowers/FlowerIcon";

const loginFormSchema = z.object({
  email: z.string().trim().toLowerCase().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required").max(128),
  rememberMe: z.boolean(),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm({ nextPath = "/dashboard" }: { nextPath?: string }) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    setServerError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        setServerError(data.error || "Invalid credentials");
        return;
      }
      router.push(nextPath.startsWith("/dashboard") ? nextPath : "/dashboard");
      router.refresh();
    } catch {
      setServerError("Network error. Please try again.");
    }
  };

  return (
    <div className="w-full max-w-md rounded-3xl border border-slate-800 bg-[#111827]/90 p-7 sm:p-9 text-slate-100 shadow-2xl backdrop-blur-xl">
      <div className="mb-7 text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-lg">
          <FlowerIcon className="h-6 w-6" animate={false} />
        </div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-white">
          PetalMatch Admin
        </h1>
        <p className="mt-1 text-sm text-slate-400">
          Sign in to manage sharing links & private submissions
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div>
          <label
            htmlFor="email"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400"
          >
            Email
          </label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="admin@petalmatch.com"
              {...register("email")}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>
          {errors.email && (
            <p className="mt-1 text-xs text-rose-400">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="password"
            className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-slate-400"
          >
            Password
          </label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="••••••••••••"
              {...register("password")}
              className="w-full rounded-xl border border-slate-700 bg-slate-900/90 py-3 pl-10 pr-4 text-sm text-white placeholder:text-slate-500 focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/30"
            />
          </div>
          {errors.password && (
            <p className="mt-1 text-xs text-rose-400">
              {errors.password.message}
            </p>
          )}
        </div>

        <label className="flex items-center gap-2.5 pt-1 text-sm text-slate-300 cursor-pointer select-none">
          <input
            type="checkbox"
            {...register("rememberMe")}
            className="h-4 w-4 rounded border-slate-600 bg-slate-900 text-violet-600 focus:ring-violet-500"
          />
          <span>Remember this device (30 days)</span>
        </label>

        {serverError && (
          <div className="rounded-xl border border-rose-500/40 bg-rose-500/10 px-4 py-2.5 text-sm text-rose-300">
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 w-full rounded-xl bg-gradient-to-r from-violet-600 to-pink-600 py-3 text-sm font-semibold text-white shadow-lg shadow-violet-600/25 transition-all hover:opacity-95 disabled:opacity-60"
        >
          {isSubmitting ? "Signing in..." : "Sign in to Dashboard"}
        </button>
      </form>
    </div>
  );
}
