"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GameShell } from "../shared/GameShell";
import { ResultsScreen, type ResultRow } from "../shared/ResultsScreen";
import {
  SPOT_DIFFERENCE_STAGES,
  SPOT_DIFFICULTY_LABEL,
  hotspotZones,
  type SpotDifferencePair,
} from "@/data/spotDifferenceConfig";
import { useSound } from "@/hooks/useSound";
import { Check, Lightbulb, Search, X } from "lucide-react";

const HINTS_PER_STAGE = 2;
/** Raw points subtracted per hint used (across the whole game). */
const HINT_PENALTY = 25;

type StageResult = {
  found: number;
  total: number;
  cleared: boolean;
  title: string;
  difficulty: SpotDifferencePair["difficulty"];
  hintsUsed: number;
};

type HintPulse = { id: string; x: number; y: number };

/**
 * Raw score (clamped ≤1100, normalized /1100):
 * - Finds across all stages: up to 800
 * - Speed if every stage cleared: up to 300
 * - Hint penalty: −25 raw per hint used
 */
function spotScore(
  stages: StageResult[],
  elapsedMs: number,
  durationMs: number,
  hintsUsedTotal: number,
) {
  const found = stages.reduce((n, s) => n + s.found, 0);
  const total = stages.reduce((n, s) => n + s.total, 0);
  const findScore = Math.round((found / Math.max(1, total)) * 800);
  const allCleared = stages.length > 0 && stages.every((s) => s.cleared);
  const speedBonus = allCleared
    ? Math.round(Math.max(0, 1 - Math.max(0, elapsedMs) / durationMs) * 300)
    : 0;
  const penalty = hintsUsedTotal * HINT_PENALTY;
  return Math.max(0, findScore + speedBonus - penalty);
}

export function SpotTheDifference() {
  const { play } = useSound();
  const stages = SPOT_DIFFERENCE_STAGES;
  const totalDurationMs = stages.reduce((n, s) => n + s.durationSec, 0) * 1000;

  const [stageIndex, setStageIndex] = useState(0);
  const [found, setFound] = useState<string[]>([]);
  const [misses, setMisses] = useState<{ x: number; y: number; id: number }[]>([]);
  const [stageResults, setStageResults] = useState<StageResult[]>([]);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [interstitial, setInterstitial] = useState<string | null>(null);
  const [hintsLeft, setHintsLeft] = useState(HINTS_PER_STAGE);
  const [hintPulse, setHintPulse] = useState<HintPulse | null>(null);
  const [comboFlash, setComboFlash] = useState<string | null>(null);

  const pair: SpotDifferencePair = stages[stageIndex]!;
  const total = pair.differences.length;
  const remaining = total - found.length;
  const imgRef = useRef<HTMLImageElement>(null);
  const participantsRef = useRef<ResultRow["participant"][]>([]);
  const finishRef = useRef<(() => void) | null>(null);
  const foundRef = useRef<string[]>([]);
  const startedAt = useRef(0);
  const finalized = useRef(false);
  const stageResultsRef = useRef<StageResult[]>([]);
  const hintsUsedTotal = useRef(0);
  const hintsLeftRef = useRef(HINTS_PER_STAGE);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const elapsedNow = () =>
    startedAt.current > 0 ? Date.now() - startedAt.current : 0;

  const clearHintPulse = () => {
    if (hintTimer.current) {
      clearTimeout(hintTimer.current);
      hintTimer.current = null;
    }
    setHintPulse(null);
  };

  const resetStageLocal = () => {
    foundRef.current = [];
    setFound([]);
    setMisses([]);
    hintsLeftRef.current = HINTS_PER_STAGE;
    setHintsLeft(HINTS_PER_STAGE);
    clearHintPulse();
    setComboFlash(null);
  };

  const finishGame = (allStages: StageResult[]) => {
    if (finalized.current) return;
    finalized.current = true;
    clearHintPulse();
    const elapsed = elapsedNow();
    const hints = hintsUsedTotal.current;
    const score = spotScore(allStages, elapsed, totalDurationMs, hints);
    const elapsedSec = (elapsed / 1000).toFixed(1);
    const summary = allStages
      .map((s) => `${SPOT_DIFFICULTY_LABEL[s.difficulty]} ${s.found}/${s.total}`)
      .join(" · ");
    const hintNote = hints > 0 ? ` · ${hints} hint${hints === 1 ? "" : "s"}` : "";
    setResults(
      participantsRef.current.map((p) => ({
        participant: p,
        score,
        detail: `${summary} · ${elapsedSec}s${hintNote}`,
      })),
    );
    finishRef.current?.();
  };

  const completeStage = (count: number) => {
    if (finalized.current || interstitial) return;
    clearHintPulse();
    const cleared = count >= total;
    const hintsUsed = HINTS_PER_STAGE - hintsLeftRef.current;
    const entry: StageResult = {
      found: count,
      total,
      cleared,
      title: pair.title,
      difficulty: pair.difficulty,
      hintsUsed,
    };
    const nextResults = [...stageResultsRef.current, entry];
    stageResultsRef.current = nextResults;
    setStageResults(nextResults);

    if (stageIndex + 1 >= stages.length) {
      finishGame(nextResults);
      return;
    }

    const next = stages[stageIndex + 1]!;
    setInterstitial(
      `${SPOT_DIFFICULTY_LABEL[pair.difficulty]} clear — ${SPOT_DIFFICULTY_LABEL[next.difficulty]} up next`,
    );
    play("correct");
    window.setTimeout(() => {
      resetStageLocal();
      setStageIndex((i) => i + 1);
      setInterstitial(null);
    }, 1100);
  };

  const useHint = () => {
    if (finalized.current || interstitial) return;
    if (hintsLeftRef.current <= 0) return;

    const unfound = pair.differences.filter((d) => !foundRef.current.includes(d.id));
    if (unfound.length === 0) return;

    const pool = unfound.filter((d) => d.id !== hintPulse?.id);
    const target = (pool.length ? pool : unfound)[
      Math.floor(Math.random() * (pool.length || unfound.length))
    ]!;

    hintsLeftRef.current -= 1;
    setHintsLeft(hintsLeftRef.current);
    hintsUsedTotal.current += 1;
    play("correct");

    clearHintPulse();
    setHintPulse({ id: target.id, x: target.x, y: target.y });
    hintTimer.current = setTimeout(() => {
      setHintPulse(null);
      hintTimer.current = null;
    }, 2800);
  };

  const onClickRight = (e: React.MouseEvent<HTMLDivElement>) => {
    if (finalized.current || interstitial) return;

    const img = imgRef.current;
    const rect = (img ?? e.currentTarget).getBoundingClientRect();
    if (rect.width <= 0 || rect.height <= 0) return;

    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    if (x < 0 || y < 0 || x > 1 || y > 1) return;

    let hit: (typeof pair.differences)[number] | null = null;
    let bestDist = Infinity;
    for (const d of pair.differences) {
      if (foundRef.current.includes(d.id)) continue;
      for (const z of hotspotZones(d)) {
        const dist = Math.hypot(z.x - x, z.y - y);
        const reach =
          z.radius *
          (typeof window !== "undefined" && window.innerWidth < 640 ? 1.55 : 1.25);
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
      if (hintPulse?.id === hit.id) clearHintPulse();

      const left = total - next.length;
      if (left > 0 && left <= 3) {
        setComboFlash(left === 1 ? "One left!" : `${left} to go`);
        window.setTimeout(() => setComboFlash(null), 900);
      }

      if (next.length >= total) {
        completeStage(total);
      }
    } else {
      play("wrong");
      const id = Date.now();
      setMisses((m) => [...m, { x, y, id }]);
      setTimeout(() => setMisses((m) => m.filter((n) => n.id !== id)), 600);
    }
  };

  const difficultyTone =
    pair.difficulty === "easy"
      ? "border-emerald-400/40 bg-emerald-500/15 text-emerald-300"
      : pair.difficulty === "medium"
        ? "border-amber-400/40 bg-amber-500/15 text-amber-300"
        : "border-rose-400/40 bg-rose-500/15 text-rose-300";

  /** Dark art (pirates) needs a dark frame; light art stays paper-white. */
  const darkArt = pair.id === "sd-pirates";
  const panelBg = darkArt ? "bg-[#0a0a10]" : "bg-[#f7f4ef]";
  const panelBorder = darkArt ? "border-white/10" : "border-black/10";
  const labelTone = darkArt
    ? "bg-white/5 text-white/55"
    : "bg-black/[0.04] text-[var(--fg-muted)]";

  const canHint = hintsLeft > 0 && remaining > 0 && !interstitial && !finalized.current;
  const progressPct = total > 0 ? (found.length / total) * 100 : 0;

  return (
    <GameShell
      gameId="spot-difference"
      title="Spot the Difference"
      durationSec={Math.round(totalDurationMs / 1000)}
      hideTimer
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
      {({ participants, finish, phase }) => {
        participantsRef.current = participants;
        finishRef.current = finish;
        if (phase === "playing" && startedAt.current === 0) {
          startedAt.current = Date.now();
        }
        if (results) return null;

        return (
          <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col px-2 py-2 sm:px-4 sm:py-4">
            <header className="mb-2 shrink-0 sm:mb-4">
              <div className="flex flex-wrap items-start justify-between gap-2 sm:gap-3">
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2 sm:mb-1.5">
                    <span
                      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider sm:text-[11px] ${difficultyTone}`}
                    >
                      <Search className="h-3 w-3 opacity-80" />
                      Stage {stageIndex + 1}/{stages.length} ·{" "}
                      {SPOT_DIFFICULTY_LABEL[pair.difficulty]}
                    </span>
                  </div>
                  <h2 className="font-display text-lg font-bold leading-tight sm:text-2xl">
                    {pair.title}
                  </h2>
                  <p className="mt-0.5 text-[11px] text-[var(--fg-muted)] sm:text-sm">
                    Find {total} differences — tap the right image
                  </p>
                </div>

                <div className="flex shrink-0 items-end gap-3 sm:gap-5">
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
                      Found
                    </p>
                    <p className="font-display text-xl font-bold tabular-nums leading-none text-emerald-400 sm:text-3xl">
                      {found.length}
                      <span className="text-sm text-[var(--fg-muted)] sm:text-lg">
                        /{total}
                      </span>
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-semibold uppercase tracking-wide text-[var(--fg-muted)]">
                      Hints
                    </p>
                    <p className="font-display text-xl font-bold tabular-nums leading-none text-amber-300 sm:text-3xl">
                      {hintsLeft}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-tone-10 sm:mt-3">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-teal-300"
                  initial={false}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ type: "spring", stiffness: 220, damping: 28 }}
                />
              </div>

              <div className="mt-2 flex gap-1.5 sm:mt-2.5">
                {stages.map((s, i) => {
                  const done = stageResults[i];
                  const active = i === stageIndex && !interstitial;
                  return (
                    <div
                      key={s.id}
                      className={`h-1 flex-1 rounded-full transition ${
                        done?.cleared
                          ? "bg-emerald-400"
                          : done
                            ? "bg-amber-400/80"
                            : active
                              ? "bg-[var(--primary-from)]"
                              : "bg-tone-10"
                      }`}
                      title={`${SPOT_DIFFICULTY_LABEL[s.difficulty]} · ${s.title}`}
                    />
                  );
                })}
              </div>
            </header>

            {/* Mobile: Original on top, Find below. Desktop: side-by-side */}
            <div className="relative grid min-h-0 min-w-0 flex-1 grid-cols-1 items-stretch gap-2 sm:grid-cols-2 sm:gap-3">
              <AnimatePresence>
                {(interstitial || comboFlash) && (
                  <motion.div
                    key={interstitial ?? comboFlash ?? "flash"}
                    initial={{ opacity: 0, scale: 0.96, y: 8 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.98 }}
                    className={`pointer-events-none absolute inset-x-0 top-1/2 z-20 mx-auto flex w-fit -translate-y-1/2 items-center justify-center rounded-2xl px-5 py-2.5 text-center shadow-xl backdrop-blur-md ${
                      interstitial
                        ? "bg-black/80 text-white"
                        : "bg-emerald-500/95 text-white"
                    }`}
                  >
                    <p className="font-display text-sm font-bold sm:text-lg">
                      {interstitial ?? comboFlash}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div
                className={`flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border sm:rounded-2xl ${panelBg} ${panelBorder}`}
              >
                <p
                  className={`shrink-0 px-1 py-1 text-center text-[8px] font-semibold uppercase tracking-[0.12em] sm:px-3 sm:py-1.5 sm:text-[11px] sm:tracking-[0.14em] ${labelTone}`}
                >
                  Original
                </p>
                <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-1 sm:p-3">
                  {/* Wrapper must shrink-wrap the image — not w-full — or hotspots letterbox */}
                  <div className="relative inline-block max-h-full max-w-full">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      key={`${pair.id}-left`}
                      src={pair.leftUrl}
                      alt="Original scene"
                      className="block h-auto max-h-[min(28dvh,70vw)] w-auto max-w-full sm:max-h-[min(58dvh,520px)] lg:max-h-[min(62dvh,580px)]"
                      draggable={false}
                    />
                    <AnimatePresence>
                      {hintPulse && (
                        <motion.span
                          key={`hint-l-${hintPulse.id}`}
                          initial={{ scale: 0.4, opacity: 0 }}
                          animate={{ scale: [1, 1.35, 1], opacity: [0.85, 0.35, 0.85] }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={{ duration: 1.1, repeat: 2 }}
                          className="pointer-events-none absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400 bg-amber-400/25 shadow-[0_0_20px_rgba(251,191,36,0.55)] sm:h-12 sm:w-12"
                          style={{
                            left: `${hintPulse.x * 100}%`,
                            top: `${hintPulse.y * 100}%`,
                          }}
                        />
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              <div
                className={`flex min-h-0 min-w-0 flex-col overflow-hidden rounded-lg border sm:rounded-2xl ${panelBg} ${panelBorder}`}
              >
                <p
                  className={`shrink-0 px-1 py-1 text-center text-[8px] font-semibold uppercase tracking-[0.12em] sm:px-3 sm:py-1.5 sm:text-[11px] sm:tracking-[0.14em] ${labelTone}`}
                >
                  Find — tap here
                </p>
                <div className="flex min-h-0 flex-1 items-center justify-center overflow-hidden p-1 sm:p-3">
                  <div
                    className="relative inline-block max-h-full max-w-full cursor-crosshair touch-manipulation"
                    onClick={onClickRight}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      key={`${pair.id}-right`}
                      ref={imgRef}
                      src={pair.rightUrl}
                      alt="Modified scene"
                      className="block h-auto max-h-[min(28dvh,70vw)] w-auto max-w-full sm:max-h-[min(58dvh,520px)] lg:max-h-[min(62dvh,580px)]"
                      draggable={false}
                    />
                    <AnimatePresence>
                      {hintPulse && (
                        <motion.span
                          key={`hint-r-${hintPulse.id}`}
                          initial={{ scale: 0.4, opacity: 0 }}
                          animate={{ scale: [1, 1.35, 1], opacity: [0.95, 0.4, 0.95] }}
                          exit={{ opacity: 0, scale: 0.6 }}
                          transition={{ duration: 1.1, repeat: 2 }}
                          className="pointer-events-none absolute h-8 w-8 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-amber-400 bg-amber-400/30 shadow-[0_0_22px_rgba(251,191,36,0.65)] sm:h-12 sm:w-12"
                          style={{
                            left: `${hintPulse.x * 100}%`,
                            top: `${hintPulse.y * 100}%`,
                          }}
                        />
                      )}
                    </AnimatePresence>
                    {pair.differences.map((d) =>
                      found.includes(d.id) ? (
                        <motion.span
                          key={d.id}
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="pointer-events-none absolute flex h-4 w-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg ring-2 ring-white/80 sm:h-7 sm:w-7 md:h-8 md:w-8"
                          style={{
                            left: `${d.x * 100}%`,
                            top: `${d.y * 100}%`,
                          }}
                        >
                          <Check className="h-2 w-2 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
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
                        <X className="h-4 w-4 sm:h-6 sm:w-6" strokeWidth={3} />
                      </motion.span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-2 flex shrink-0 flex-wrap items-center justify-center gap-2 sm:mt-5 sm:gap-3">
              <button
                type="button"
                className="btn-secondary inline-flex items-center gap-1.5 disabled:opacity-40"
                disabled={!canHint}
                onClick={useHint}
              >
                <Lightbulb className="h-4 w-4" />
                {hintsLeft > 0 ? `Hint (${hintsLeft} left)` : "No hints left"}
              </button>
              <button
                type="button"
                className="btn-secondary disabled:opacity-40"
                disabled={!!interstitial}
                onClick={() => {
                  if (stageIndex + 1 >= stages.length) {
                    const hintsUsed = HINTS_PER_STAGE - hintsLeftRef.current;
                    const entry: StageResult = {
                      found: foundRef.current.length,
                      total,
                      cleared: foundRef.current.length >= total,
                      title: pair.title,
                      difficulty: pair.difficulty,
                      hintsUsed,
                    };
                    finishGame([...stageResultsRef.current, entry]);
                  } else {
                    completeStage(foundRef.current.length);
                  }
                }}
              >
                {stageIndex + 1 >= stages.length ? "Submit score" : "Next stage"}
              </button>
            </div>
          </div>
        );
      }}
    </GameShell>
  );
}
