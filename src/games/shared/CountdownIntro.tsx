"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useSound } from "@/hooks/useSound";

const BEAT_MS = 1000;
const GO_HOLD_MS = 700;
const RING = 220;
const STROKE = 6;
const R = (RING - STROKE) / 2;
const C = 2 * Math.PI * R;

type Step = 3 | 2 | 1 | 0;

const STEP_COPY: Record<Step, string> = {
  3: "Get set",
  2: "Almost there",
  1: "One more…",
  0: "Let’s go!",
};

export function CountdownIntro({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [step, setStep] = useState<Step>(3);
  const { play } = useSound();
  const onCompleteRef = useRef(onComplete);
  const playRef = useRef(play);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    playRef.current = play;
  }, [play]);

  // Single mount-driven timeline — ignore parent re-renders / callback identity churn
  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const schedule = (ms: number, fn: () => void) => {
      timers.push(setTimeout(fn, ms));
    };

    playRef.current("tick");
    schedule(BEAT_MS, () => {
      if (cancelled) return;
      setStep(2);
      playRef.current("tick");
    });
    schedule(BEAT_MS * 2, () => {
      if (cancelled) return;
      setStep(1);
      playRef.current("tick");
    });
    schedule(BEAT_MS * 3, () => {
      if (cancelled) return;
      setStep(0);
      playRef.current("go");
    });
    schedule(BEAT_MS * 3 + GO_HOLD_MS, () => {
      if (cancelled) return;
      onCompleteRef.current();
    });

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  const isGo = step === 0;
  const label = isGo ? "GO!" : String(step);
  // Ring empties across 3 → 2 → 1 → GO (4 beats total visual)
  const ringProgress = isGo ? 0 : step / 3;

  return (
    <div className="relative flex min-h-[min(58vh,520px)] flex-col items-center justify-center overflow-hidden px-4">
      {/* Ambient flash on each beat */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`glow-${step}`}
          aria-hidden
          className="pointer-events-none absolute inset-0"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div
            className="absolute left-1/2 top-1/2 h-[min(70vw,420px)] w-[min(70vw,420px)] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
            style={{
              background: isGo
                ? "radial-gradient(circle, color-mix(in srgb, var(--primary-from) 45%, transparent), transparent 68%)"
                : "radial-gradient(circle, color-mix(in srgb, var(--accent-2) 28%, transparent), transparent 68%)",
            }}
          />
        </motion.div>
      </AnimatePresence>

      {/* Stage pips */}
      <div className="mb-8 flex items-center gap-2.5" aria-hidden>
        {([3, 2, 1, 0] as const).map((n) => {
          const done = step < n || (isGo && n === 0);
          const active = step === n;
          return (
            <motion.span
              key={n}
              className="h-1.5 rounded-full"
              animate={{
                width: active ? 28 : 10,
                opacity: done || active ? 1 : 0.35,
                backgroundColor: isGo && n === 0
                  ? "var(--primary-from)"
                  : active
                    ? "var(--fg)"
                    : done
                      ? "var(--fg-muted)"
                      : "var(--border)",
              }}
              transition={{ type: "spring", stiffness: 420, damping: 28 }}
            />
          );
        })}
      </div>

      {/* Number + ring */}
      <div className="relative flex h-[min(64vw,260px)] w-[min(64vw,260px)] items-center justify-center">
        <svg
          className="absolute inset-0 -rotate-90"
          viewBox={`0 0 ${RING} ${RING}`}
          aria-hidden
        >
          <circle
            cx={RING / 2}
            cy={RING / 2}
            r={R}
            fill="none"
            stroke="var(--border)"
            strokeWidth={STROKE}
            opacity={0.55}
          />
          <motion.circle
            cx={RING / 2}
            cy={RING / 2}
            r={R}
            fill="none"
            stroke={isGo ? "var(--primary-from)" : "var(--accent-2)"}
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={C}
            initial={false}
            animate={{
              strokeDashoffset: C * (1 - ringProgress),
              opacity: isGo ? 0 : 1,
            }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          />
        </svg>

        {/* Expanding shockwave on beat */}
        <AnimatePresence>
          <motion.div
            key={`wave-${step}`}
            aria-hidden
            className="absolute inset-[8%] rounded-full border-2"
            style={{
              borderColor: isGo
                ? "color-mix(in srgb, var(--primary-from) 70%, transparent)"
                : "color-mix(in srgb, var(--accent-2) 45%, transparent)",
            }}
            initial={{ scale: 0.72, opacity: 0.7 }}
            animate={{ scale: 1.35, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          />
        </AnimatePresence>

        <AnimatePresence mode="wait">
          <motion.div
            key={label}
            initial={{
              scale: isGo ? 0.35 : 0.55,
              opacity: 0,
              y: isGo ? 12 : 28,
              filter: "blur(8px)",
            }}
            animate={{
              scale: 1,
              opacity: 1,
              y: 0,
              filter: "blur(0px)",
            }}
            exit={{
              scale: isGo ? 1.4 : 1.25,
              opacity: 0,
              y: -18,
              filter: "blur(6px)",
            }}
            transition={{
              type: "spring",
              stiffness: isGo ? 380 : 460,
              damping: isGo ? 16 : 20,
              mass: 0.85,
            }}
            className={`relative select-none font-display font-extrabold tracking-tight ${
              isGo
                ? "text-[clamp(4.5rem,16vw,7.5rem)] text-gradient"
                : "text-[clamp(5.5rem,20vw,8.5rem)] text-[var(--fg)]"
            }`}
            style={
              isGo
                ? undefined
                : {
                    textShadow:
                      "0 0 40px color-mix(in srgb, var(--accent-2) 25%, transparent)",
                  }
            }
          >
            {label}
          </motion.div>
        </AnimatePresence>
      </div>

      <AnimatePresence mode="wait">
        <motion.p
          key={`copy-${step}`}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.25 }}
          className={`mt-8 font-display text-sm font-semibold uppercase tracking-[0.22em] ${
            isGo ? "text-[var(--primary-from)]" : "text-[var(--fg-muted)]"
          }`}
        >
          {STEP_COPY[step]}
        </motion.p>
      </AnimatePresence>
    </div>
  );
}
