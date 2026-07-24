"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GameShell } from "../shared/GameShell";
import { ResultsScreen, type ResultRow } from "../shared/ResultsScreen";
import { SPOT_DIFFERENCE_PAIRS, hotspotZones } from "@/data/spotDifferenceConfig";
import { useSound } from "@/hooks/useSound";
import { Check, X } from "lucide-react";

export function SpotTheDifference() {
  const { play } = useSound();
  const pair = useMemo(
    () => SPOT_DIFFERENCE_PAIRS[Math.floor(Math.random() * SPOT_DIFFERENCE_PAIRS.length)]!,
    [],
  );
  const total = pair.differences.length;
  const imgRef = useRef<HTMLImageElement>(null);
  const [found, setFound] = useState<string[]>([]);
  const [misses, setMisses] = useState<{ x: number; y: number; id: number }[]>([]);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const participantsRef = useRef<ResultRow["participant"][]>([]);
  const finishRef = useRef<(() => void) | null>(null);
  const foundRef = useRef<string[]>([]);
  const remainingMsRef = useRef(pair.durationSec * 1000);
  const finalized = useRef(false);

  const finalize = (count: number, cleared: boolean, remainingMs?: number) => {
    if (finalized.current) return;
    finalized.current = true;
    const left = Math.max(0, remainingMs ?? remainingMsRef.current);
    const durationMs = pair.durationSec * 1000;
    // Finds scale to 1000; clear bonus 0–100 from time left → 1100 max (normalizes to 1000)
    const findScore = Math.round((count / total) * 1000);
    const speedBonus = cleared ? Math.round((left / durationMs) * 100) : 0;
    const score = findScore + speedBonus;
    const elapsedSec = ((durationMs - left) / 1000).toFixed(1);
    setResults(
      participantsRef.current.map((p) => ({
        participant: p,
        score,
        detail: cleared
          ? `${count}/${total} found · ${elapsedSec}s`
          : `${count}/${total} found`,
      })),
    );
    finishRef.current?.();
  };

  const onClickRight = (e: React.MouseEvent<HTMLDivElement>) => {
    if (finalized.current) return;

    // Use the image box only — avoids label / padding skewing taps
    const img = imgRef.current;
    const rect = (img ?? e.currentTarget).getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x < 0 || y < 0 || x > 1 || y > 1) return;

    // Nearest zone across all differences (supports multi-zone diffs like cat candy)
    let hit: (typeof pair.differences)[number] | null = null;
    let bestDist = Infinity;
    for (const d of pair.differences) {
      if (foundRef.current.includes(d.id)) continue;
      for (const z of hotspotZones(d)) {
        const dist = Math.hypot(z.x - x, z.y - y);
        const reach = z.radius * 1.25;
        if (dist <= reach && dist < bestDist) {
          bestDist = dist;
          hit = d;
        }
      }
    }

    if (hit) {
      play("correct");
      const next = [...foundRef.current, hit.id];
      foundRef.current = next;
      setFound(next);
      if (next.length >= total) {
        finalize(total, true);
      }
    } else {
      play("wrong");
      const id = Date.now();
      setMisses((m) => [...m, { x, y, id }]);
      setTimeout(() => setMisses((m) => m.filter((n) => n.id !== id)), 600);
    }
  };

  return (
    <GameShell
      gameId="spot-difference"
      title="Spot the Difference"
      durationSec={pair.durationSec}
      onTimeUp={() => {
        const count = foundRef.current.length;
        finalize(count, count >= total, 0);
      }}
      results={
        results ? (
          <ResultsScreen
            gameId="spot-difference"
            title="Spot the Difference"
            results={results}
          />
        ) : undefined
      }
    >
      {({ participants, finish, remainingMs }) => {
        participantsRef.current = participants;
        finishRef.current = finish;
        remainingMsRef.current = remainingMs;
        if (results) return null;

        return (
          <div className="mx-auto w-full max-w-6xl px-3 py-4 sm:px-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="min-w-0 truncate font-display text-lg font-bold sm:text-xl">
                {pair.title}
              </h2>
              <p className="shrink-0 font-display text-base font-bold text-emerald-400 sm:text-lg">
                {found.length}/{total} found
              </p>
            </div>
            <div className="grid gap-3 sm:gap-4 md:grid-cols-2">
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <p className="bg-white/5 px-3 py-1 text-center text-xs font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
                  Original
                </p>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pair.leftUrl}
                  alt="Original scene"
                  className="h-auto w-full bg-white"
                  draggable={false}
                />
              </div>
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <p className="bg-white/5 px-3 py-1 text-center text-xs font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
                  Find differences — tap here
                </p>
                <div className="relative cursor-crosshair touch-manipulation" onClick={onClickRight}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    ref={imgRef}
                    src={pair.rightUrl}
                    alt="Modified scene"
                    className="h-auto w-full bg-white"
                    draggable={false}
                  />
                  {pair.differences.map((d) =>
                    found.includes(d.id) ? (
                      <motion.span
                        key={d.id}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="pointer-events-none absolute flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg sm:h-8 sm:w-8"
                        style={{ left: `${d.x * 100}%`, top: `${d.y * 100}%` }}
                      >
                        <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </motion.span>
                    ) : null,
                  )}
                  {misses.map((m) => (
                    <motion.span
                      key={m.id}
                      initial={{ scale: 0.5, opacity: 1 }}
                      animate={{ scale: 1.2, opacity: 0 }}
                      className="pointer-events-none absolute flex -translate-x-1/2 -translate-y-1/2 text-red-500"
                      style={{ left: `${m.x * 100}%`, top: `${m.y * 100}%` }}
                    >
                      <X className="h-6 w-6" />
                    </motion.span>
                  ))}
                </div>
              </div>
            </div>
            <button
              type="button"
              className="btn-secondary mx-auto mt-6 block"
              onClick={() =>
                finalize(
                  foundRef.current.length,
                  foundRef.current.length >= total,
                  remainingMsRef.current,
                )
              }
            >
              Submit score
            </button>
          </div>
        );
      }}
    </GameShell>
  );
}
