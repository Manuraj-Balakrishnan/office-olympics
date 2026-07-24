"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GameShell } from "../shared/GameShell";
import { ResultsScreen, type ResultRow } from "../shared/ResultsScreen";
import { SPOT_DIFFERENCE_PAIRS } from "@/data/spotDifferenceConfig";
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
  const finalized = useRef(false);

  const pointsPerFind = Math.floor(1000 / total);

  const finalize = (count: number, cleared: boolean) => {
    if (finalized.current) return;
    finalized.current = true;
    setResults(
      participantsRef.current.map((p) => ({
        participant: p,
        score: count * pointsPerFind + (cleared ? 100 : 0),
        detail: `${count}/${total} found${cleared ? " · cleared" : ""}`,
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

    // Nearest hotspot within its radius (extra slack for fat-finger taps)
    let hit: (typeof pair.differences)[number] | null = null;
    let bestDist = Infinity;
    for (const d of pair.differences) {
      if (foundRef.current.includes(d.id)) continue;
      const dist = Math.hypot(d.x - x, d.y - y);
      const reach = d.radius * 1.25;
      if (dist <= reach && dist < bestDist) {
        bestDist = dist;
        hit = d;
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
        finalize(count, count >= total);
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
      {({ participants, finish }) => {
        participantsRef.current = participants;
        finishRef.current = finish;
        if (results) return null;

        return (
          <div className="mx-auto w-full max-w-6xl px-4 py-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold">{pair.title}</h2>
              <p className="font-display text-lg font-bold text-emerald-400">
                {found.length}/{total} found
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
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
                        className="pointer-events-none absolute flex h-8 w-8 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg"
                        style={{ left: `${d.x * 100}%`, top: `${d.y * 100}%` }}
                      >
                        <Check className="h-4 w-4" />
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
                finalize(foundRef.current.length, foundRef.current.length >= total)
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
