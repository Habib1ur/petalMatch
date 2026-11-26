"use client";

import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <div className="h-3 w-24 rounded-full bg-slate-100 dark:bg-slate-800 animate-shimmer" />
        <div className="h-9 w-9 rounded-xl bg-slate-100 dark:bg-slate-800 animate-shimmer" />
      </div>
      <div className="h-7 w-20 rounded-lg bg-slate-100 dark:bg-slate-800 animate-shimmer" />
    </div>
  );
}

const HEADER_WIDTHS = [68, 92, 84, 76, 88, 72];

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 px-4 py-3.5">
        {HEADER_WIDTHS.map((width, i) => (
          <div
            key={i}
            className="h-3 rounded-full bg-slate-100 dark:bg-slate-800 animate-shimmer"
            style={{ width: `${width}px`, animationDelay: `${i * 0.08}s` }}
          />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className="flex items-center gap-4 border-b border-slate-100 dark:border-slate-800/70 px-4 py-4"
          style={{ animationDelay: `${i * 0.06}s` }}
        >
          <div className="h-4 w-4 rounded bg-slate-100 dark:bg-slate-800 animate-shimmer" />
          <div className="h-4 w-16 rounded-full bg-slate-100 dark:bg-slate-800 animate-shimmer" />
          <div className="h-4 flex-1 max-w-[120px] rounded-full bg-slate-100 dark:bg-slate-800 animate-shimmer" />
          <div className="h-4 flex-1 max-w-[100px] rounded-full bg-slate-100 dark:bg-slate-800 animate-shimmer" />
          <div className="h-5 w-12 rounded-full bg-violet-500/10 animate-shimmer" />
          <div className="h-4 w-20 rounded-full bg-slate-100 dark:bg-slate-800 animate-shimmer" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonLinkCard() {
  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2.5 mb-2">
            <div className="h-5 w-32 rounded-full bg-slate-100 dark:bg-slate-800 animate-shimmer" />
            <div className="h-5 w-14 rounded-full bg-emerald-500/10 animate-shimmer" />
          </div>
          <div className="h-3 w-24 rounded-full bg-slate-100 dark:bg-slate-800 animate-shimmer" />
        </div>
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-800 animate-shimmer"
            />
          ))}
        </div>
      </div>

      <div className="my-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 dark:bg-slate-900/70 p-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="text-center">
            <div className="mx-auto h-3 w-10 rounded-full bg-slate-100 dark:bg-slate-800 mb-1.5 animate-shimmer" />
            <div className="mx-auto h-5 w-8 rounded-full bg-slate-100 dark:bg-slate-800 animate-shimmer" />
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800/80">
        <div className="h-3 w-28 rounded-full bg-slate-100 dark:bg-slate-800 animate-shimmer" />
        <div className="flex items-center gap-1.5">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-7 w-14 rounded-lg bg-slate-100 dark:bg-slate-800 animate-shimmer"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function SkeletonChart({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] p-5 shadow-sm",
        className
      )}
    >
      <div className="mb-4 flex items-center justify-between">
        <div className="h-5 w-40 rounded-full bg-slate-100 dark:bg-slate-800 animate-shimmer" />
        <div className="h-7 w-28 rounded-lg bg-slate-100 dark:bg-slate-800 animate-shimmer" />
      </div>
      <div className="h-64 w-full rounded-xl bg-slate-50 dark:bg-slate-900/50 animate-shimmer" />
    </div>
  );
}
