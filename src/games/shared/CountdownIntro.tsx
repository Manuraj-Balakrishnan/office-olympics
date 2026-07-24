"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useSound } from "@/hooks/useSound";

export function CountdownIntro({
  onComplete,
}: {
  onComplete: () => void;
}) {
  const [step, setStep] = useState(3);
  const { play } = useSound();

  useEffect(() => {
    if (step > 0) {
      play("tick");
      const t = setTimeout(() => setStep((s) => s - 1), 700);
      return () => clearTimeout(t);
    }
    play("go");
    const t = setTimeout(onComplete, 500);
    return () => clearTimeout(t);
  }, [step, onComplete, play]);

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
