"use client";

import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import type { GameId } from "@/types/tournament";
import { GAME_MAP } from "@/data/games";

const HOWTO_SECONDS = 10;

export function HowToPlayIntro({
  gameId,
  onComplete,
}: {
  gameId: GameId;
  onComplete: () => void;
}) {
  const game = GAME_MAP[gameId];
  const [left, setLeft] = useState(HOWTO_SECONDS);
  const done = useRef(false);

  const finish = () => {
    if (done.current) return;
    done.current = true;
    onComplete();
  };

  useEffect(() => {
    if (left <= 0) {
      finish();
      return;
    }
    const t = setTimeout(() => setLeft((n) => n - 1), 1000);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [left]);

  const progress = ((HOWTO_SECONDS - left) / HOWTO_SECONDS) * 100;

  return (
    <div className="mx-auto flex min-h-[60vh] w-full max-w-lg flex-col items-center justify-center gap-6 px-4 py-8 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full space-y-6"
      >
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--fg-muted)]">
            How to play
          </p>
          <h2 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl md:text-5xl">
            {game.title}
          </h2>
          <p className="mt-2 text-[var(--fg-muted)]">{game.description}</p>
        </div>

        <ol className="space-y-3 text-left">
          {game.howToPlay.map((step, i) => (
            <motion.li
              key={step}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 * i }}
              className="flex gap-3 rounded-2xl bg-white/5 px-4 py-3"
            >
              <span className="font-display text-lg font-extrabold text-[var(--ring)]">
                {i + 1}.
              </span>
              <span className="text-base leading-snug md:text-lg">{step}</span>
            </motion.li>
          ))}
        </ol>

        <div className="space-y-3">
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-[var(--ring)]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear", duration: 0.3 }}
            />
          </div>
          <p className="font-display text-3xl font-extrabold tabular-nums">{left}</p>
          <p className="text-sm text-[var(--fg-muted)]">Starting automatically…</p>
          <button type="button" className="btn-secondary mx-auto" onClick={finish}>
            Got it — start now
          </button>
        </div>
      </motion.div>
    </div>
  );
}
