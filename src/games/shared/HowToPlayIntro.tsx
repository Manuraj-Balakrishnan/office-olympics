"use client";

import { motion } from "framer-motion";
import { Clock } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CATEGORY_COLORS, resolveGame } from "@/data/games";
import type { GameId } from "@/types/tournament";

const HOWTO_SECONDS = 10;
const RING_SIZE = 56;
const RING_STROKE = 4;
const RING_RADIUS = (RING_SIZE - RING_STROKE) / 2;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

const CATEGORY_LABEL: Record<string, string> = {
  reflex: "Reflex",
  memory: "Memory",
  knowledge: "Knowledge",
  typing: "Typing",
};

const DIFFICULTY_CLASS: Record<string, string> = {
  Easy: "text-[var(--diff-easy)] bg-emerald-500/15 border-emerald-500/30",
  Medium: "text-[var(--diff-medium)] bg-amber-500/15 border-amber-500/30",
  Hard: "text-[var(--diff-hard)] bg-rose-500/15 border-rose-500/30",
};

export function HowToPlayIntro({
  gameId,
  onComplete,
}: {
  gameId: GameId;
  onComplete: () => void;
}) {
  const game = resolveGame(gameId);
  const [left, setLeft] = useState(HOWTO_SECONDS);
  const done = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  const finish = () => {
    if (done.current) return;
    done.current = true;
    try {
      onCompleteRef.current();
    } catch (err) {
      done.current = false;
      console.error("HowToPlayIntro onComplete failed", err);
    }
  };

  useEffect(() => {
    if (!game) {
      finish();
      return;
    }
    if (left <= 0) {
      finish();
      return;
    }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left, game]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        done.current = false;
        finish();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!game) {
    return (
      <div className="mx-auto flex min-h-[40vh] items-center justify-center px-4 text-center text-[var(--fg-muted)]">
        Unknown game — starting…
      </div>
    );
  }

  const steps = game.howToPlay;

  return (
    <div className="relative mx-auto flex min-h-[min(70vh,640px)] w-full max-w-2xl flex-col justify-center px-3 py-6 sm:px-4 sm:py-8">
      <motion.div
        aria-hidden
        className={`pointer-events-none absolute left-1/2 top-8 h-40 w-40 -translate-x-1/2 rounded-full bg-gradient-to-br ${CATEGORY_COLORS[game.category]} opacity-[0.18] blur-3xl`}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 0.18, scale: 1 }}
        transition={{ duration: 0.6 }}
      />

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 280, damping: 26 }}
        className="relative w-full"
      >
        <div className="mb-5 flex flex-col items-center text-center sm:mb-6">
          <h2 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
            {game.title}
          </h2>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-[var(--fg-muted)] sm:text-base">
            {game.description}
          </p>

          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span
              className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${DIFFICULTY_CLASS[game.difficulty]}`}
            >
              {game.difficulty}
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-tone-5 px-2.5 py-1 text-xs font-semibold text-[var(--fg-muted)]">
              <Clock className="h-3.5 w-3.5" />
              {game.durationSec}s
            </span>
            <span className="rounded-full border border-[var(--border)] bg-tone-5 px-2.5 py-1 text-xs font-semibold text-[var(--fg-muted)]">
              {CATEGORY_LABEL[game.category] ?? game.category}
            </span>
          </div>
        </div>

        <ol className="relative space-y-2.5">
          <div
            aria-hidden
            className="absolute bottom-3 left-[1.35rem] top-3 w-px bg-gradient-to-b from-[var(--ring)]/40 via-white/10 to-transparent sm:left-[1.55rem]"
          />
          {steps.map((step, i) => (
            <motion.li
              key={step}
              initial={{ opacity: 0, x: -14 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{
                delay: 0.12 + i * 0.07,
                type: "spring",
                stiffness: 320,
                damping: 24,
              }}
              className="relative flex gap-3 sm:gap-3.5"
            >
              <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[var(--border-strong)] bg-[var(--bg-elevated)] font-display text-sm font-extrabold text-[var(--ring)] shadow-[0_0_0_4px_var(--bg)] sm:h-12 sm:w-12 sm:text-base">
                {i + 1}
              </span>
              <div className="flex min-h-11 flex-1 items-center rounded-2xl border border-[var(--border)] bg-tone-4 px-3.5 py-3 text-left backdrop-blur-sm sm:min-h-12 sm:px-4">
                <p className="text-[15px] leading-snug sm:text-base">{step}</p>
              </div>
            </motion.li>
          ))}
        </ol>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 + steps.length * 0.05 }}
          className="mt-6 flex flex-col items-stretch gap-3 sm:mt-7 sm:flex-row sm:items-center sm:justify-between sm:gap-4"
        >
          <div className="flex items-center justify-center gap-3 sm:justify-start">
            <div className="relative flex h-14 w-14 items-center justify-center">
              <svg
                width={RING_SIZE}
                height={RING_SIZE}
                className="-rotate-90"
                aria-hidden
              >
                <circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={RING_STROKE}
                  className="text-tone-10"
                />
                <motion.circle
                  cx={RING_SIZE / 2}
                  cy={RING_SIZE / 2}
                  r={RING_RADIUS}
                  fill="none"
                  stroke="var(--ring)"
                  strokeWidth={RING_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={RING_CIRCUMFERENCE}
                  initial={{ strokeDashoffset: 0 }}
                  animate={{ strokeDashoffset: RING_CIRCUMFERENCE }}
                  transition={{
                    duration: HOWTO_SECONDS,
                    ease: "linear",
                  }}
                />
              </svg>
              <motion.span
                key={left}
                initial={{ scale: 1.15, opacity: 0.5 }}
                animate={{ scale: 1, opacity: 1 }}
                className="absolute font-display text-lg font-extrabold tabular-nums"
              >
                {left}
              </motion.span>
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold">Auto-starts in {left}s</p>
              <p className="text-xs text-[var(--fg-muted)]">
                Press Enter or Space to skip
              </p>
            </div>
          </div>

          <button
            type="button"
            className="btn-primary w-full sm:w-auto sm:min-w-[11rem]"
            onClick={() => {
              // Allow manual skip even if the auto-timer already tried to finish
              // but the parent phase transition was interrupted (e.g. navigation).
              done.current = false;
              finish();
            }}
          >
            Got it — start
          </button>
        </motion.div>
      </motion.div>
    </div>
  );
}
