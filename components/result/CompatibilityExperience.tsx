"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Check,
  Copy,
  Download,
  Heart,
  RefreshCw,
  RotateCcw,
  Share2,
  Sparkles,
} from "lucide-react";
import { BloomingFlower } from "@/components/flowers/BloomingFlower";
import { FlowerIcon } from "@/components/flowers/FlowerIcon";
import { PetalBackdrop } from "@/components/flowers/PetalBackdrop";
import { generateResultPngBlob } from "@/components/result/result-card-canvas";
import { useToast } from "@/components/ui/ToastProvider";

const formSchema = z.object({
  participantName: z
    .string()
    .trim()
    .min(1, "Please enter your name")
    .max(60, "Name must be 60 characters or fewer"),
  crushName: z
    .string()
    .trim()
    .min(1, "Please enter your crush's name")
    .max(60, "Name must be 60 characters or fewer"),
});

type FormValues = z.infer<typeof formSchema>;

interface CompatibilityResultData {
  participantName: string;
  crushName: string;
  compatibilityScore: number;
  tier: {
    message: string;
    subtitle: string;
  };
}

interface CompatibilityExperienceProps {
  slug: string;
  customHeading?: string | null;
  welcomeMessage?: string | null;
  isDemo?: boolean;
}

type ViewStep = "landing" | "form" | "calculating" | "result";

const CALC_MESSAGES = [
  "Reading the little signals...",
  "Mixing a little magic...",
  "Checking your chemistry...",
  "Almost there...",
];

export function CompatibilityExperience({
  slug,
  customHeading,
  welcomeMessage,
  isDemo = false,
}: CompatibilityExperienceProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<ViewStep>("landing");
  const [calcMsgIndex, setCalcMsgIndex] = useState(0);
  const [calcProgress, setCalcProgress] = useState(12);
  const [result, setResult] = useState<CompatibilityResultData | null>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const timersRef = useRef<number[]>([]);

  const clearAllTimers = useCallback(() => {
    timersRef.current.forEach((t) => window.clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => clearAllTimers();
  }, [clearAllTimers]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      participantName: "",
      crushName: "",
    },
  });

  const watchedParticipant = watch("participantName");
  const watchedCrush = watch("crushName");

  const runRevealSequence = useCallback(
    (data: CompatibilityResultData) => {
      clearAllTimers();
      setResult(data);
      setStep("calculating");
      setCalcMsgIndex(0);
      setCalcProgress(18);
      setDisplayScore(0);

      const t1 = window.setTimeout(() => {
        setCalcMsgIndex(1);
        setCalcProgress(44);
      }, 750);

      const t2 = window.setTimeout(() => {
        setCalcMsgIndex(2);
        setCalcProgress(72);
      }, 1500);

      const t3 = window.setTimeout(() => {
        setCalcMsgIndex(3);
        setCalcProgress(95);
      }, 2250);

      const t4 = window.setTimeout(() => {
        setStep("result");
      }, 2950);

      timersRef.current.push(t1, t2, t3, t4);
    },
    [clearAllTimers]
  );

  // Smoothly animate percentage counter from 0 to target score when result appears
  useEffect(() => {
    if (step !== "result" || !result) return;
    const target = result.compatibilityScore;
    const duration = 1200;
    const start = performance.now();
    let frameId = 0;

    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(1, elapsed / duration);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayScore(Math.round(eased * target));
      if (progress < 1) {
        frameId = requestAnimationFrame(tick);
      }
    };

    frameId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frameId);
  }, [step, result]);

  const onSubmit = async (values: FormValues) => {
    setSubmitError(null);

    try {
      const response = await fetch("/api/public/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          participantName: values.participantName,
          crushName: values.crushName,
        }),
      });

      const payload = await response.json();
      if (!response.ok) {
        setSubmitError(payload.error || "Unable to calculate compatibility.");
        return;
      }

      runRevealSequence(payload as CompatibilityResultData);
    } catch {
      setSubmitError("Network error. Please check your connection and try again.");
    }
  };

  const shareText = useMemo(() => {
    if (!result) return "";
    return `${result.participantName} ♡ ${result.crushName} — ${result.compatibilityScore}% compatibility on PetalMatch! "${result.tier.message}"`;
  }, [result]);

  const handleCopyResult = async () => {
    if (!shareText) return;
    try {
      await navigator.clipboard.writeText(
        `${shareText}\n${window.location.href}`
      );
      setCopied(true);
      toast("Result copied to clipboard!", "success");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast("Could not copy automatically.", "error");
    }
  };

  const handleNativeShare = async () => {
    if (!result) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: "PetalMatch Compatibility",
          text: shareText,
          url: window.location.href,
        });
      } catch {
        // User cancelled share sheet
      }
    } else {
      await handleCopyResult();
    }
  };

  const handleDownloadPng = async () => {
    if (!result) return;
    setIsDownloading(true);
    try {
      const blob = await generateResultPngBlob({
        participantName: result.participantName,
        crushName: result.crushName,
        score: result.compatibilityScore,
        message: result.tier.message,
      });
      if (!blob) {
        toast("Could not generate image.", "error");
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `petalmatch-${result.participantName.toLowerCase().replace(/\s+/g, "-")}-${result.crushName.toLowerCase().replace(/\s+/g, "-")}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast("Compatibility card saved!", "success");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleTryAnother = () => {
    clearAllTimers();
    reset();
    setResult(null);
    setSubmitError(null);
    setStep("form");
  };

  const handleRestart = () => {
    clearAllTimers();
    reset();
    setResult(null);
    setSubmitError(null);
    setStep("landing");
  };

  const circleCircumference = 2 * Math.PI * 66;
  const strokeDashoffset =
    circleCircumference -
    (circleCircumference * (result ? displayScore : 0)) / 100;

  return (
    <div className="relative min-h-dvh w-full flex flex-col justify-between px-4 py-6 sm:px-6 sm:py-8 overflow-hidden">
      <PetalBackdrop
        intensity={
          step === "calculating" || step === "result" ? "celebrate" : "calm"
        }
      />

      {/* Minimal Top Brand Bar */}
      <header className="relative z-10 flex items-center justify-center pt-1">
        <button
          type="button"
          onClick={handleRestart}
          className="group inline-flex items-center gap-2 rounded-full border border-white/60 bg-white/55 px-4 py-1.5 backdrop-blur-md shadow-sm transition-transform hover:scale-[1.02]"
        >
          <FlowerIcon className="h-4 w-4 text-[#D979A7]" />
          <span className="font-display text-xs font-semibold tracking-[0.22em] text-[#35283A]">
            PETALMATCH
          </span>
        </button>
      </header>

      {/* Main Centered Stage */}
      <main className="relative z-10 mx-auto flex w-full max-w-xl flex-1 items-center justify-center py-8">
        <AnimatePresence mode="wait">
          {step === "landing" && (
            <motion.section
              key="landing"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -14 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              className="w-full text-center"
            >
              <div className="mx-auto mb-6 flex justify-center">
                <div className="animate-gentle-float rounded-full border border-white/70 bg-white/65 p-4 shadow-[0_12px_36px_rgba(217,121,167,0.16)] backdrop-blur-md">
                  <FlowerIcon className="h-9 w-9 text-[#D979A7]" />
                </div>
              </div>

              <p className="font-display text-xs sm:text-sm font-medium tracking-[0.18em] uppercase text-[#D979A7] mb-3">
                Where names meet a little magic.
              </p>

              <h1
                className="font-serif font-semibold tracking-tight text-[#35283A] leading-[1.12] mb-5"
                style={{ fontSize: "clamp(2.25rem, 6vw, 4.15rem)" }}
              >
                {customHeading || "Let's see what the stars say about you two."}
              </h1>

              <p
                className="mx-auto max-w-md text-[#8D7D8D] leading-relaxed mb-9"
                style={{ fontSize: "clamp(0.95rem, 1.2vw, 1.08rem)" }}
              >
                {welcomeMessage ||
                  "Two names. One little experiment. A surprising result."}
              </p>

              <motion.button
                type="button"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setStep("form")}
                className="group inline-flex items-center justify-center gap-3 rounded-[14px] bg-gradient-to-r from-[#D979A7] via-[#C96B9B] to-[#B794F4] px-8 py-4 font-display text-base font-medium text-white shadow-[0_14px_30px_rgba(217,121,167,0.34)] transition-all hover:shadow-[0_18px_36px_rgba(217,121,167,0.42)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D979A7] focus-visible:ring-offset-2"
              >
                <span>Discover Your Match</span>
                <FlowerIcon className="h-5 w-5 text-white/95 transition-transform duration-300 group-hover:rotate-45" />
              </motion.button>
            </motion.section>
          )}

          {step === "form" && (
            <motion.section
              key="form"
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -16, scale: 0.98 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full rounded-[20px] border border-white/75 bg-white/78 p-6 sm:p-9 shadow-[0_20px_60px_rgba(53,40,58,0.08)] backdrop-blur-xl"
            >
              <div className="mb-7 text-center">
                <div className="mx-auto mb-3 inline-flex items-center gap-1.5 rounded-full bg-[#FCEBF2] px-3 py-1 text-xs font-medium text-[#D979A7]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Just two names</span>
                </div>
                <h2
                  className="font-serif font-semibold text-[#35283A]"
                  style={{ fontSize: "clamp(1.75rem, 3vw, 2.35rem)" }}
                >
                  Tell us a little secret...
                </h2>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
                <div>
                  <label
                    htmlFor="participantName"
                    className="mb-2 block font-display text-sm font-medium text-[#35283A]"
                  >
                    Your name
                  </label>
                  <div className="relative">
                    <input
                      id="participantName"
                      type="text"
                      autoComplete="given-name"
                      placeholder="Enter your name"
                      {...register("participantName")}
                      className="w-full rounded-[14px] border border-[#F5A6C8]/60 bg-white/90 px-4 py-3.5 pr-11 text-base text-[#35283A] placeholder:text-[#8D7D8D]/70 shadow-sm transition-all focus:border-[#D979A7] focus:outline-none focus:ring-4 focus:ring-[#F5A6C8]/25"
                    />
                    <FlowerIcon
                      animate={false}
                      className="pointer-events-none absolute right-3.5 top-1/2 h-5 w-5 -translate-y-1/2 text-[#F5A6C8]"
                    />
                  </div>
                  {errors.participantName && (
                    <p className="mt-1.5 text-xs font-medium text-rose-500">
                      {errors.participantName.message}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="crushName"
                    className="mb-2 block font-display text-sm font-medium text-[#35283A]"
                  >
                    Your crush&apos;s name
                  </label>
                  <div className="relative">
                    <input
                      id="crushName"
                      type="text"
                      autoComplete="off"
                      placeholder="Someone special..."
                      {...register("crushName")}
                      className="w-full rounded-[14px] border border-[#F5A6C8]/60 bg-white/90 px-4 py-3.5 pr-11 text-base text-[#35283A] placeholder:text-[#8D7D8D]/70 shadow-sm transition-all focus:border-[#D979A7] focus:outline-none focus:ring-4 focus:ring-[#C5B5F5]/30"
                    />
                    <Heart className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#C5B5F5]" />
                  </div>
                  {errors.crushName && (
                    <p className="mt-1.5 text-xs font-medium text-rose-500">
                      {errors.crushName.message}
                    </p>
                  )}
                </div>

                {submitError && (
                  <div className="rounded-xl border border-rose-200 bg-rose-50/90 px-4 py-2.5 text-sm text-rose-600">
                    {submitError}
                  </div>
                )}

                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileHover={{ scale: isSubmitting ? 1 : 1.015 }}
                  whileTap={{ scale: isSubmitting ? 1 : 0.985 }}
                  className="mt-2 flex w-full items-center justify-center gap-2.5 rounded-[14px] bg-gradient-to-r from-[#D979A7] via-[#CE72A2] to-[#B794F4] px-6 py-4 font-display text-base font-medium text-white shadow-[0_12px_28px_rgba(217,121,167,0.32)] transition-all disabled:opacity-70"
                >
                  {isSubmitting ? (
                    <>
                      <FlowerIcon className="h-5 w-5 text-white" />
                      <span>Gathering petals...</span>
                    </>
                  ) : (
                    <>
                      <span>Find Our Compatibility ✿</span>
                    </>
                  )}
                </motion.button>

                <p className="pt-1 text-center text-xs text-[#8D7D8D]">
                  {isDemo
                    ? "Preview mode: submissions on this default link are saved to the administrator's welcome link."
                    : "Note: Submitted names are privately shared only with the link creator."}
                </p>
              </form>
            </motion.section>
          )}

          {step === "calculating" && (
            <motion.section
              key="calculating"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              transition={{ duration: 0.45 }}
              className="w-full text-center"
            >
              {/* Stage 1 & 2: Opposite names + glowing blooming flower */}
              <div className="mb-8 flex items-center justify-center gap-3 sm:gap-6">
                <motion.span
                  initial={{ opacity: 0, x: -24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="max-w-[34%] truncate font-serif text-xl sm:text-2xl font-semibold text-[#35283A]"
                >
                  {result?.participantName || watchedParticipant}
                </motion.span>

                <BloomingFlower phase="blooming" size={116} />

                <motion.span
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.5 }}
                  className="max-w-[34%] truncate font-serif text-xl sm:text-2xl font-semibold text-[#35283A]"
                >
                  {result?.crushName || watchedCrush}
                </motion.span>
              </div>

              <AnimatePresence mode="wait">
                <motion.p
                  key={calcMsgIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="font-serif text-xl sm:text-2xl text-[#35283A] mb-6"
                >
                  {CALC_MESSAGES[calcMsgIndex]}
                </motion.p>
              </AnimatePresence>

              <div className="mx-auto h-2 w-64 max-w-full overflow-hidden rounded-full bg-white/70 p-0.5 shadow-inner">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[#F5A6C8] via-[#D979A7] to-[#C5B5F5]"
                  initial={{ width: "10%" }}
                  animate={{ width: `${calcProgress}%` }}
                  transition={{ duration: 0.65, ease: "easeOut" }}
                />
              </div>
            </motion.section>
          )}

          {step === "result" && result && (
            <motion.section
              key="result"
              initial={{ opacity: 0, y: 22, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
              className="w-full rounded-[24px] border border-white/80 bg-white/82 p-6 sm:p-10 text-center shadow-[0_24px_70px_rgba(53,40,58,0.10)] backdrop-blur-xl"
            >
              <div className="mb-3 flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#FCEBF2] px-3 py-1 text-[11px] font-medium uppercase tracking-[0.14em] text-[#D979A7]">
                  Just for fun
                </span>
              </div>

              <h2 className="font-serif text-2xl sm:text-3xl font-semibold tracking-wide text-[#35283A] mb-6 break-words">
                {result.participantName.toUpperCase()}{" "}
                <span className="mx-1.5 text-[#D979A7]">♡</span>{" "}
                {result.crushName.toUpperCase()}
              </h2>

              {/* Circular Floral Progress Indicator */}
              <div className="relative mx-auto mb-6 flex h-44 w-44 items-center justify-center">
                <div className="absolute inset-0 flex items-center justify-center opacity-25 pointer-events-none">
                  <BloomingFlower phase="open" size={172} />
                </div>

                <svg
                  className="relative z-10 h-40 w-40 -rotate-90"
                  viewBox="0 0 152 152"
                >
                  <defs>
                    <linearGradient
                      id="scoreRingGrad"
                      x1="0%"
                      y1="0%"
                      x2="100%"
                      y2="100%"
                    >
                      <stop offset="0%" stopColor="#F5A6C8" />
                      <stop offset="50%" stopColor="#D979A7" />
                      <stop offset="100%" stopColor="#C5B5F5" />
                    </linearGradient>
                  </defs>
                  <circle
                    cx="76"
                    cy="76"
                    r="66"
                    fill="rgba(255,255,255,0.75)"
                    stroke="#FCEBF2"
                    strokeWidth="10"
                  />
                  <circle
                    cx="76"
                    cy="76"
                    r="66"
                    fill="none"
                    stroke="url(#scoreRingGrad)"
                    strokeWidth="10"
                    strokeLinecap="round"
                    strokeDasharray={circleCircumference}
                    strokeDashoffset={strokeDashoffset}
                    className="transition-[stroke-dashoffset] duration-150 ease-out"
                  />
                </svg>

                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
                  <span className="font-serif text-4xl sm:text-5xl font-bold text-[#35283A]">
                    {displayScore}%
                  </span>
                </div>
              </div>

              <p className="font-serif text-xl sm:text-2xl font-medium text-[#35283A] mb-2">
                {result.tier.message}
              </p>
              <p className="mx-auto max-w-md text-sm text-[#8D7D8D] mb-8">
                {result.tier.subtitle}
              </p>

              {/* Result Action Controls */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="inline-flex items-center justify-center gap-2 rounded-[14px] bg-gradient-to-r from-[#D979A7] to-[#B794F4] px-4 py-3 text-sm font-medium text-white shadow-md transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Share2 className="h-4 w-4" />
                  <span>Share</span>
                </button>

                <button
                  type="button"
                  onClick={handleDownloadPng}
                  disabled={isDownloading}
                  className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-[#F5A6C8]/60 bg-white/90 px-4 py-3 text-sm font-medium text-[#35283A] shadow-sm transition-colors hover:bg-[#FCEBF2]/70 disabled:opacity-60"
                >
                  <Download className="h-4 w-4 text-[#D979A7]" />
                  <span>{isDownloading ? "Saving..." : "Save PNG"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyResult}
                  className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-[#F5A6C8]/60 bg-white/90 px-4 py-3 text-sm font-medium text-[#35283A] shadow-sm transition-colors hover:bg-[#FCEBF2]/70"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-emerald-500" />
                  ) : (
                    <Copy className="h-4 w-4 text-[#D979A7]" />
                  )}
                  <span>{copied ? "Copied" : "Copy"}</span>
                </button>

                <button
                  type="button"
                  onClick={() => runRevealSequence(result)}
                  className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-[#E9D5FF] bg-white/80 px-4 py-2.5 text-xs sm:text-sm font-medium text-[#35283A] transition-colors hover:bg-[#FCEBF2]/50"
                >
                  <RefreshCw className="h-3.5 w-3.5 text-[#8D7D8D]" />
                  <span>Replay</span>
                </button>

                <button
                  type="button"
                  onClick={handleTryAnother}
                  className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-[#E9D5FF] bg-white/80 px-4 py-2.5 text-xs sm:text-sm font-medium text-[#35283A] transition-colors hover:bg-[#FCEBF2]/50"
                >
                  <Heart className="h-3.5 w-3.5 text-[#D979A7]" />
                  <span>Try Another</span>
                </button>

                <button
                  type="button"
                  onClick={handleRestart}
                  className="inline-flex items-center justify-center gap-2 rounded-[14px] border border-[#E9D5FF] bg-white/80 px-4 py-2.5 text-xs sm:text-sm font-medium text-[#8D7D8D] transition-colors hover:bg-[#FCEBF2]/50 hover:text-[#35283A]"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Restart</span>
                </button>
              </div>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      {/* Subtle Footer */}
      <footer className="relative z-10 pb-1 text-center text-xs text-[#8D7D8D]/85">
        <span>PetalMatch · Crafted for fun</span>
      </footer>
    </div>
  );
}
