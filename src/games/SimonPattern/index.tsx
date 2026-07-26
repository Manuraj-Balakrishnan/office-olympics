"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Play } from "lucide-react";
import { GameShell } from "../shared/GameShell";
import { ResultsScreen, type ResultRow } from "../shared/ResultsScreen";
import { useSound } from "@/hooks/useSound";
import { useTournamentStore } from "@/store/useTournamentStore";
import { springSnappy } from "@/lib/motion";

/** Classic Simon: green TL, red TR, yellow BL, blue BR. */
const PADS = [
  {
    id: 0,
    name: "Red",
    label: "1",
    idle: "bg-red-700/90",
    lit: "bg-red-400 shadow-[0_0_32px_rgba(248,113,113,0.8)]",
  },
  {
    id: 1,
    name: "Blue",
    label: "2",
    idle: "bg-blue-700/90",
    lit: "bg-blue-400 shadow-[0_0_32px_rgba(96,165,250,0.8)]",
  },
  {
    id: 2,
    name: "Yellow",
    label: "3",
    idle: "bg-amber-600/90",
    lit: "bg-amber-300 shadow-[0_0_32px_rgba(252,211,77,0.8)]",
  },
  {
    id: 3,
    name: "Green",
    label: "4",
    idle: "bg-emerald-700/90",
    lit: "bg-emerald-400 shadow-[0_0_32px_rgba(52,211,153,0.8)]",
  },
] as const;

type SfxSimon = "simon0" | "simon1" | "simon2" | "simon3";
type Turn = "idle" | "watch" | "repeat" | "cleared" | "miss";

const MAX_STEPS = 10;

/** Classic Simon: playback speeds up as the chain grows. */
function timingFor(length: number) {
  if (length <= 3) return { on: 460, gap: 160, lead: 520 };
  if (length <= 6) return { on: 380, gap: 130, lead: 420 };
  return { on: 300, gap: 100, lead: 360 };
}

function sleep(ms: number, gen: number, getGen: () => number) {
  return new Promise<void>((resolve, reject) => {
    window.setTimeout(() => {
      if (getGen() !== gen) reject(new Error("cancelled"));
      else resolve();
    }, ms);
  });
}

export function SimonPattern() {
  const { play } = useSound();
  const assistMode = useTournamentStore((s) => s.settings.assistMode);

  const [sequence, setSequence] = useState<number[]>([]);
  const [playerIdx, setPlayerIdx] = useState(0);
  const [lit, setLit] = useState<number | null>(null);
  const [turn, setTurn] = useState<Turn>("idle");
  const [score, setScore] = useState(0);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [boardPulse, setBoardPulse] = useState<"ok" | "bad" | null>(null);

  const scoreRef = useRef(0);
  const finishRef = useRef<(() => void) | null>(null);
  const sequenceRef = useRef<number[]>([]);
  const participantsRef = useRef<ResultRow["participant"][]>([]);
  const finalized = useRef(false);
  const genRef = useRef(0);
  const playerFlashTimer = useRef<number | null>(null);
  const advanceTimer = useRef<number | null>(null);

  const getGen = useCallback(() => genRef.current, []);

  const flashPad = useCallback(
    async (id: number, onMs: number, gapMs: number, gen: number) => {
      setLit(id);
      play(`simon${id}` as SfxSimon);
      await sleep(onMs, gen, getGen);
      setLit(null);
      await sleep(gapMs, gen, getGen);
    },
    [getGen, play],
  );

  const playSequence = useCallback(
    async (seq: number[]) => {
      const gen = ++genRef.current;
      sequenceRef.current = seq;
      setSequence(seq);
      setPlayerIdx(0);
      setTurn("watch");
      setLit(null);

      const { on, gap, lead } = timingFor(seq.length);

      try {
        await sleep(lead, gen, getGen);
        for (const padId of seq) {
          await flashPad(padId, on, gap, gen);
        }
        if (genRef.current !== gen) return;
        setTurn("repeat");
      } catch {
        /* superseded by newer playback or game over */
      }
    },
    [flashPad, getGen],
  );

  const endGame = useCallback(
    (finalScore: number, outcome: "miss" | "cleared" = "miss") => {
      if (finalized.current) return;
      finalized.current = true;
      genRef.current += 1;
      if (playerFlashTimer.current) window.clearTimeout(playerFlashTimer.current);
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
      setTurn(outcome === "cleared" ? "cleared" : "miss");
      setLit(null);
      if (outcome === "miss") play("wrong");
      setBoardPulse(outcome === "cleared" ? "ok" : "bad");
      window.setTimeout(() => setBoardPulse(null), 520);
      setResults(
        participantsRef.current.map((p) => ({
          participant: p,
          score: finalScore,
          detail:
            outcome === "cleared"
              ? `Perfect — ${finalScore}/${MAX_STEPS}`
              : `${finalScore} step${finalScore === 1 ? "" : "s"}`,
        })),
      );
      finishRef.current?.();
    },
    [play],
  );

  const tapPad = (id: number) => {
    if (turn !== "repeat" || finalized.current) return;

    if (playerFlashTimer.current) window.clearTimeout(playerFlashTimer.current);
    setLit(id);
    play(`simon${id}` as SfxSimon);
    playerFlashTimer.current = window.setTimeout(() => {
      setLit(null);
      playerFlashTimer.current = null;
    }, 160);

    const seq = sequenceRef.current;
    if (seq[playerIdx] !== id) {
      endGame(scoreRef.current);
      return;
    }

    const nextIdx = playerIdx + 1;
    if (nextIdx >= seq.length) {
      const newScore = seq.length;
      scoreRef.current = newScore;
      setScore(newScore);
      setPlayerIdx(nextIdx);
      setTurn("cleared");
      play(newScore >= MAX_STEPS ? "fanfare" : newScore >= 5 ? "complete" : "correct");
      setBoardPulse("ok");
      window.setTimeout(() => setBoardPulse(null), 420);

      if (newScore >= MAX_STEPS) {
        advanceTimer.current = window.setTimeout(() => {
          advanceTimer.current = null;
          endGame(newScore, "cleared");
        }, 900);
        return;
      }

      advanceTimer.current = window.setTimeout(() => {
        advanceTimer.current = null;
        if (finalized.current) return;
        const next = [...seq, Math.floor(Math.random() * 4)];
        void playSequence(next);
      }, 700);
    } else {
      setPlayerIdx(nextIdx);
    }
  };

  const startGame = () => {
    if (turn !== "idle" || finalized.current) return;
    play("go");
    const first = [Math.floor(Math.random() * 4)];
    void playSequence(first);
  };

  useEffect(() => {
    return () => {
      genRef.current += 1;
      if (playerFlashTimer.current) window.clearTimeout(playerFlashTimer.current);
      if (advanceTimer.current) window.clearTimeout(advanceTimer.current);
    };
  }, []);

  const status =
    turn === "idle"
      ? "Hit Play when you're ready"
      : turn === "watch"
        ? "Watch the pattern…"
        : turn === "repeat"
          ? "Your turn — repeat it!"
          : turn === "cleared"
            ? score >= MAX_STEPS
              ? `Perfect! ${MAX_STEPS}/${MAX_STEPS}`
              : score >= 5
                ? `Nice chain — ${score}!`
                : `Cleared ${score} — next up…`
            : "Missed!";

  const progress = sequence.length > 0 ? Math.min(playerIdx, sequence.length) : 0;

  return (
    <GameShell
      gameId="simon"
      title="Simon Pattern"
      durationSec={120}
      supportsHuddle
      hideTimer
      results={
        results ? (
          <ResultsScreen gameId="simon" title="Simon Pattern" results={results} />
        ) : undefined
      }
    >
      {({ participants, phase: shellPhase, finish }) => {
        finishRef.current = finish;
        participantsRef.current = participants;

        if (results || shellPhase !== "playing") return null;

        return (
          <div className="mx-auto flex w-full max-w-lg flex-col items-center gap-5 px-4 py-4 sm:gap-6 sm:py-6">
            <div className="flex w-full items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
                  Longest chain
                </p>
                <p className="font-display text-3xl font-extrabold leading-none tabular-nums sm:text-4xl">
                  {score}
                </p>
              </div>
              <AnimatePresence mode="wait">
                <motion.p
                  key={status}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="max-w-[14rem] pb-0.5 text-right text-sm leading-none text-[var(--fg-muted)] sm:text-base"
                >
                  {status}
                </motion.p>
              </AnimatePresence>
            </div>

            <div className="flex min-h-[2.25rem] flex-col items-center justify-center gap-2">
              {turn !== "idle" && (
                <>
                  <div className="flex flex-wrap items-center justify-center gap-1.5">
                    {sequence.map((_, i) => (
                      <motion.span
                        key={`${sequence.length}-${i}`}
                        initial={{ scale: 0.6, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ ...springSnappy, delay: i * 0.02 }}
                        className={`h-2 w-2 rounded-full transition ${
                          i < progress
                            ? "bg-[var(--ring)]"
                            : turn === "repeat" && i === progress
                              ? "bg-white/70 ring-2 ring-[var(--ring)]/50"
                              : "bg-white/20"
                        }`}
                      />
                    ))}
                  </div>
                  {sequence.length > 0 && (
                    <p className="text-xs tabular-nums text-[var(--fg-muted)]">
                      {turn === "repeat" || turn === "cleared"
                        ? `${progress} / ${sequence.length}`
                        : `${sequence.length} step${sequence.length === 1 ? "" : "s"}`}
                      {sequence.length >= 7 && turn === "watch" ? " · speeding up" : ""}
                    </p>
                  )}
                </>
              )}
            </div>

            <motion.div
              animate={
                boardPulse === "bad"
                  ? { x: [0, -10, 10, -8, 8, -4, 0] }
                  : boardPulse === "ok"
                    ? { scale: [1, 1.04, 1] }
                    : { x: 0, scale: 1 }
              }
              transition={{ duration: boardPulse === "bad" ? 0.45 : 0.35 }}
              className="relative aspect-square w-full max-w-[min(100%,20rem)] sm:max-w-[22rem]"
            >
              <div
                className={`absolute inset-0 rounded-full bg-[#0c1018] shadow-[inset_0_0_0_10px_#151b27,0_18px_40px_rgba(0,0,0,0.45)] transition ${
                  boardPulse === "ok"
                    ? "ring-4 ring-[var(--ring)]/70"
                    : boardPulse === "bad"
                      ? "ring-4 ring-red-500/70"
                      : ""
                }`}
              />

              {/* Four quarter pads with a thin cross gap */}
              <div className="absolute inset-[8%] overflow-hidden rounded-full">
                <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-1.5 bg-[#0c1018]">
                  {/* Remap visual order: TL green, TR red, BL yellow, BR blue */}
                  {[PADS[3], PADS[0], PADS[2], PADS[1]].map((pad) => {
                    const isLit = lit === pad.id;
                    const canTap = turn === "repeat";
                    return (
                      <button
                        key={pad.id}
                        type="button"
                        disabled={!canTap}
                        onClick={() => tapPad(pad.id)}
                        aria-label={assistMode ? `Pad ${pad.label} · ${pad.name}` : pad.name}
                        className={`relative transition-[filter,background-color,box-shadow,transform] duration-100 ${
                          pad.id === 3
                            ? "rounded-tl-[100%]"
                            : pad.id === 0
                              ? "rounded-tr-[100%]"
                              : pad.id === 2
                                ? "rounded-bl-[100%]"
                                : "rounded-br-[100%]"
                        } ${isLit ? pad.lit : pad.idle} ${
                          canTap ? "cursor-pointer active:brightness-125" : "cursor-default"
                        } ${
                          (turn === "watch" || turn === "idle") && !isLit
                            ? "brightness-[0.7]"
                            : ""
                        } ${turn === "repeat" && !isLit ? "hover:brightness-110" : ""}`}
                      >
                        {assistMode && turn !== "idle" && (
                          <span className="pointer-events-none absolute inset-0 flex items-center justify-center font-display text-2xl font-extrabold text-black/40">
                            {pad.label}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="absolute inset-[32%] z-10 flex items-center justify-center rounded-full bg-[#121821] shadow-[inset_0_2px_8px_rgba(255,255,255,0.06),0_0_0_6px_#0c1018]">
                {turn === "idle" ? (
                  <motion.button
                    type="button"
                    onClick={startGame}
                    whileHover={{ scale: 1.06 }}
                    whileTap={{ scale: 0.94 }}
                    className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-full bg-[#0a0c10] text-white shadow-[inset_0_2px_8px_rgba(255,255,255,0.08)]"
                    aria-label="Play"
                  >
                    <Play className="h-8 w-8 fill-current sm:h-9 sm:w-9" strokeWidth={0} />
                    <span className="font-display text-xs font-extrabold uppercase tracking-[0.18em]">
                      Play
                    </span>
                  </motion.button>
                ) : (
                  <div className="pointer-events-none flex flex-col items-center justify-center">
                    <span className="text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--fg-muted)]">
                      {turn === "watch"
                        ? "Watch"
                        : turn === "repeat"
                          ? "Go"
                          : turn === "cleared"
                            ? "Yes"
                            : "Out"}
                    </span>
                    <span className="font-display text-2xl font-extrabold tabular-nums sm:text-3xl">
                      {sequence.length || "—"}
                    </span>
                  </div>
                )}
              </div>
            </motion.div>

            <p className="max-w-xs text-center text-xs leading-relaxed text-[var(--fg-muted)] sm:text-sm">
              Clear all {MAX_STEPS} steps to finish. One miss ends the run — playback speeds up as you climb.
            </p>

            {turn !== "idle" && (
              <button
                type="button"
                className="btn-secondary text-sm"
                onClick={() => endGame(scoreRef.current)}
              >
                End & save score
              </button>
            )}
          </div>
        );
      }}
    </GameShell>
  );
}
