"use client";

import { useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  BarChart3,
  HeartHandshake,
  LayoutDashboard,
  Link2,
  LogOut,
  Menu,
  Moon,
  Settings,
  Sun,
  X,
} from "lucide-react";
import { FlowerIcon } from "@/components/flowers/FlowerIcon";
import { useToast } from "@/components/ui/ToastProvider";
import { cn } from "@/lib/utils";

interface AdminShellProps {
  adminName: string;
  adminEmail: string;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/submissions", label: "Submissions", icon: HeartHandshake },
  { href: "/dashboard/links", label: "Sharing Links", icon: Link2 },
  { href: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function AdminShell({
  adminName,
  adminEmail,
  children,
}: AdminShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const theme = useSyncExternalStore(
    (onStoreChange) => {
      window.addEventListener("petalmatch-theme", onStoreChange);
      return () => window.removeEventListener("petalmatch-theme", onStoreChange);
    },
    () =>
      window.localStorage.getItem("petalmatch_admin_theme") === "light"
        ? "light"
        : "dark",
    () => "dark"
  );

  const toggleTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    window.localStorage.setItem("petalmatch_admin_theme", next);
    window.dispatchEvent(new Event("petalmatch-theme"));
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      toast("Signed out", "info");
      router.push("/login");
      router.refresh();
    } catch {
      toast("Failed to sign out", "error");
    } finally {
      setLoggingOut(false);
    }
  };

  const isDark = theme === "dark";

  const sidebarContent = (
    <div className="flex h-full flex-col justify-between p-4">
      <div>
        <Link
          href="/dashboard"
          onClick={() => setMobileOpen(false)}
          className="mb-8 flex items-center gap-2.5 px-2 py-1.5"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-pink-500 text-white shadow-md">
            <FlowerIcon className="h-5 w-5" animate={false} />
          </div>
          <div>
            <span className="block font-display text-sm font-bold tracking-wider uppercase">
              PetalMatch
            </span>
            <span className="block text-[11px] opacity-60">Admin Studio</span>
          </div>
        </Link>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const active =
              item.href === "/dashboard"
                ? pathname === "/dashboard"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-all",
                  active
                    ? "bg-violet-600 text-white shadow-md shadow-violet-600/20"
                    : isDark
                      ? "text-slate-300 hover:bg-slate-800/80 hover:text-white"
                      : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      <div
        className={cn(
          "rounded-2xl border p-3.5",
          isDark
            ? "border-slate-800 bg-slate-900/70"
            : "border-slate-200 bg-slate-50"
        )}
      >
        <div className="mb-3">
          <p className="truncate text-sm font-semibold">{adminName}</p>
          <p className="truncate text-xs opacity-60">{adminEmail}</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle dashboard theme"
            className={cn(
              "flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-colors",
              isDark
                ? "border-slate-700 hover:bg-slate-800 text-slate-200"
                : "border-slate-200 hover:bg-white text-slate-700"
            )}
          >
            {isDark ? (
              <>
                <Sun className="h-3.5 w-3.5 text-amber-400" />
                <span>Light</span>
              </>
            ) : (
              <>
                <Moon className="h-3.5 w-3.5 text-violet-600" />
                <span>Dark</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center justify-center gap-1.5 rounded-xl bg-rose-500/10 px-3 py-2 text-xs font-medium text-rose-500 hover:bg-rose-500/20 transition-colors disabled:opacity-60"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className={cn(isDark && "dark")}>
      <div
        className={cn(
          "min-h-dvh flex flex-col lg:flex-row transition-colors",
          isDark
            ? "bg-[#0B1120] text-slate-100"
            : "bg-slate-50 text-slate-900"
        )}
      >
        {/* Mobile Top Bar */}
        <header
          className={cn(
            "flex items-center justify-between border-b px-4 py-3 lg:hidden",
            isDark
              ? "border-slate-800 bg-[#0F172A]"
              : "border-slate-200 bg-white"
          )}
        >
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 text-white">
              <FlowerIcon className="h-4 w-4" animate={false} />
            </div>
            <span className="font-display text-sm font-bold tracking-wider uppercase">
              PetalMatch
            </span>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation menu"
            className="rounded-lg p-2 hover:bg-slate-800/40"
          >
            <Menu className="h-5 w-5" />
          </button>
        </header>

        {/* Desktop Sidebar */}
        <aside
          className={cn(
            "hidden lg:block w-64 shrink-0 border-r",
            isDark
              ? "border-slate-800/80 bg-[#0F172A]"
              : "border-slate-200 bg-white"
          )}
        >
          <div className="sticky top-0 h-dvh">{sidebarContent}</div>
        </aside>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div
            className="fixed inset-0 z-50 flex lg:hidden bg-slate-950/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          >
            <aside
              className={cn(
                "relative w-72 max-w-[85vw] h-full border-r",
                isDark
                  ? "border-slate-800 bg-[#0F172A]"
                  : "border-slate-200 bg-white"
              )}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close navigation menu"
                className="absolute right-3 top-3 rounded-lg p-2 text-slate-400 hover:bg-slate-800/40"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebarContent}
            </aside>
          </div>
        )}

        {/* Main Workspace */}
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
