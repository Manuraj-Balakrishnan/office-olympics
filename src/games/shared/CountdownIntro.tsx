"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { useSound } from "@/hooks/useSound";

const BEAT_MS = 1000;
const GO_HOLD_MS = 600;

export function CountdownIntro({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [step, setStep] = useState(3);
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

    // 3 → 2 → 1 at 1s beats, then GO, then start
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

  const label = step > 0 ? String(step) : "GO!";

  return (
    <div className="relative flex min-h-[50vh] flex-col items-center justify-center">
      <motion.div
        aria-hidden
        className="absolute h-48 w-48 rounded-full border border-white/10 md:h-64 md:w-64"
        animate={{ scale: [1, 1.12, 1], opacity: [0.35, 0.15, 0.35] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={label}
          initial={{ scale: 0.4, opacity: 0, rotate: -8 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          exit={{ scale: 1.45, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 18 }}
          className="relative font-display text-[clamp(5rem,18vw,9rem)] font-extrabold text-gradient"
        >
          {label}
        </motion.div>
      </AnimatePresence>
      <p className="mt-4 text-[var(--fg-muted)]">Get ready…</p>
    </div>
  );
}
