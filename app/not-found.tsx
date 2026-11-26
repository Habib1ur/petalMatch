import Link from "next/link";
import { FlowerIcon } from "@/components/flowers/FlowerIcon";
import { PetalBackdrop } from "@/components/flowers/PetalBackdrop";

export default function NotFound() {
  return (
    <div className="relative min-h-dvh w-full flex flex-col items-center justify-center px-6 py-12 text-center overflow-hidden">
      <PetalBackdrop intensity="calm" />

      <div className="relative z-10 max-w-md rounded-[24px] border border-white/80 bg-white/80 p-8 sm:p-10 shadow-[0_20px_60px_rgba(53,40,58,0.08)] backdrop-blur-xl">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-[#FCEBF2] text-[#D979A7]">
          <FlowerIcon className="h-8 w-8" />
        </div>

        <p className="font-display text-xs font-semibold uppercase tracking-[0.2em] text-[#D979A7] mb-2">
          404 · Page Not Found
        </p>

        <h1 className="font-serif text-3xl font-semibold text-[#35283A] mb-3">
          Lost among the petals
        </h1>

        <p className="text-sm leading-relaxed text-[#8D7D8D] mb-4">
          We couldn&apos;t find the PetalMatch link you were looking for.
          Double-check the URL or head back home.
        </p>

        <div className="mb-7 flex items-center justify-center gap-2 text-[#C5B5F5]">
          {["✿", "✿", "✿"].map((f, i) => (
            <span key={i} className="text-lg opacity-60">
              {f}
            </span>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-[14px] bg-gradient-to-r from-[#D979A7] to-[#B794F4] px-6 py-3 font-display text-sm font-medium text-white shadow-md transition-transform hover:scale-[1.02]"
          >
            Go to PetalMatch
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-[14px] border border-[#F5A6C8]/50 bg-white/70 px-5 py-3 font-display text-sm font-medium text-[#35283A] transition-colors hover:bg-[#FCEBF2]/60"
          >
            Admin Login
          </Link>
        </div>
      </div>
    </div>
  );
}
