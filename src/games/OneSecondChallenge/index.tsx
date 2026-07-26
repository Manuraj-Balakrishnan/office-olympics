"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, Zap } from "lucide-react";
import { GameShell } from "../shared/GameShell";
import { ResultsScreen, type ResultRow } from "../shared/ResultsScreen";
import { pickOneSecondRounds, type OneSecondRound } from "@/data/oneSecondRounds";
import { useSound } from "@/hooks/useSound";

type Step = "ready" | "flash" | "questions";

const SCENES_PER_GAME = 2;
const POINTS_PER_CORRECT = 100;
const FLASH_MS = 5000;
const READY_MS = 900;
const FEEDBACK_MS = 750;

function preloadUrl(url: string): Promise<void> {
  return new Promise((resolve) => {
    const img = new window.Image();
    img.decoding = "async";
    img.onload = () => {
      // decode() ensures pixels are ready to paint, not just downloaded
      if (img.decode) {
        img.decode().then(() => resolve()).catch(() => resolve());
      } else {
        resolve();
      }
    };
    img.onerror = () => resolve();
    img.src = url;
    if (img.complete && img.naturalWidth > 0) {
      if (img.decode) {
        img.decode().then(() => resolve()).catch(() => resolve());
      } else {
        resolve();
      }
    }
  });
}

export function OneSecondChallenge() {
  const { play } = useSound();
  const rounds = useMemo(() => pickOneSecondRounds(SCENES_PER_GAME), []);
  const [sceneIndex, setSceneIndex] = useState(0);
  const [step, setStep] = useState<Step>("ready");
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [flashProgress, setFlashProgress] = useState(1);
  const [loadedIds, setLoadedIds] = useState<Set<string>>(() => new Set());
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const started = useRef(false);
  const scoreRef = useRef(0);
  const correctRef = useRef(0);
  const totalQ = rounds.reduce((n, r) => n + r.questions.length, 0);
  const participantsRef = useRef<ResultRow["participant"][]>([]);
  const finishRef = useRef<(() => void) | null>(null);
  const finalized = useRef(false);
  const timers = useRef<number[]>([]);
  const flashArmed = useRef(false);

  const round: OneSecondRound | undefined = rounds[sceneIndex];
  const sceneReady = round ? loadedIds.has(round.id) : false;
  const answeredCount =
    rounds.slice(0, sceneIndex).reduce((n, r) => n + r.questions.length, 0) + qIndex;

  const clearTimers = () => {
    timers.current.forEach((id) => window.clearTimeout(id));
    timers.current = [];
  };

  const later = (fn: () => void, ms: number) => {
    const id = window.setTimeout(fn, ms);
    timers.current.push(id);
  };

  const markLoaded = (id: string) => {
    setLoadedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  };

  // Warm browser cache as soon as the game mounts (during how-to / countdown)
  useEffect(() => {
    let cancelled = false;
    rounds.forEach((r) => {
      preloadUrl(r.imageUrl).then(() => {
        if (!cancelled) markLoaded(r.id);
      });
    });
    return () => {
      cancelled = true;
      clearTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rounds]);

  const beginScene = () => {
    clearTimers();
    flashArmed.current = false;
    setPicked(null);
    setQIndex(0);
    setFlashProgress(1);
    setStep("ready");
    play("tick");
  };

  // Ready → flash only once the current scene image is decoded
  useEffect(() => {
    if (step !== "ready" || !sceneReady || finalized.current) return;
    const id = window.setTimeout(() => {
      flashArmed.current = true;
      setFlashProgress(1);
      setStep("flash");
      play("go");
    }, READY_MS);
    return () => window.clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, sceneReady, sceneIndex]);

  // Exact flash window — image is already cached, so no wait
  useEffect(() => {
    if (step !== "flash" || !flashArmed.current || finalized.current) return;
    const start = Date.now();
    const tick = window.setInterval(() => {
      const elapsed = Date.now() - start;
      setFlashProgress(Math.max(0, 1 - elapsed / FLASH_MS));
      if (elapsed >= FLASH_MS) {
        window.clearInterval(tick);
        flashArmed.current = false;
        setStep("questions");
      }
    }, 32);
    return () => window.clearInterval(tick);
  }, [step, sceneIndex]);

  const finalize = (finalScore: number) => {
    if (finalized.current) return;
    finalized.current = true;
    clearTimers();
    setResults(
      participantsRef.current.map((p) => ({
        participant: p,
        score: finalScore,
        detail: `${correctRef.current}/${totalQ} correct · ${finalScore} pts`,
      })),
    );
    finishRef.current?.();
  };

  const advanceAfterAnswer = (newScore: number) => {
    if (!round) return;
    if (qIndex + 1 < round.questions.length) {
      setQIndex((i) => i + 1);
      setPicked(null);
      return;
    }
    if (sceneIndex + 1 < rounds.length) {
      setSceneIndex((i) => i + 1);
      later(() => beginScene(), 150);
    } else {
      finalize(newScore);
    }
  };

  const answer = (idx: number) => {
    const question = round?.questions[qIndex];
    if (!question || finalized.current || picked !== null) return;
    setPicked(idx);
    let add = 0;
    if (idx === question.correctIndex) {
      play("correct");
      add = POINTS_PER_CORRECT;
      correctRef.current += 1;
    } else {
      play("wrong");
    }
    const newScore = scoreRef.current + add;
    scoreRef.current = newScore;
    setScore(newScore);
    later(() => advanceAfterAnswer(newScore), FEEDBACK_MS);
  };

  return (
    <GameShell
      gameId="one-second"
      title="Seconds Challenge"
      durationSec={120}
      hideTimer
      results={
        results ? (
          <ResultsScreen
            gameId="one-second"
            title="Seconds Challenge"
            results={results}
          />
        ) : undefined
      }
    >
      {({ participants, phase, finish }) => {
        participantsRef.current = participants;
        finishRef.current = finish;
        if (phase === "playing" && !started.current) {
          started.current = true;
          queueMicrotask(beginScene);
        }
        if (results || !round) return null;
        const question = round.questions[qIndex];

        return (
          <div className="mx-auto flex w-full max-w-3xl flex-col items-center px-4 py-4 sm:py-6">
            {/* Hidden imgs keep decoded bitmaps warm for every scene */}
            <div
              className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0"
              aria-hidden
            >
              {rounds.map((r) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={r.id}
                  src={r.imageUrl}
                  alt=""
                  decoding="async"
                  onLoad={() => markLoaded(r.id)}
                />
              ))}
            </div>

            <div className="mb-4 flex w-full items-center justify-between gap-3 text-sm text-[var(--fg-muted)]">
              <span className="font-display font-semibold">
                Scene {sceneIndex + 1}/{rounds.length}
                <span className="ml-2 font-normal opacity-70">· {round.title}</span>
              </span>
              <span className="font-display font-bold text-[var(--fg)]">{score} pts</span>
            </div>
            <div className="mb-5 flex w-full gap-1.5">
              {rounds.map((r, i) => (
                <div
                  key={r.id}
                  className="h-1.5 flex-1 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--fg)_12%,transparent)]"
                >
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--primary-from)] to-[var(--accent-warm)]"
                    initial={false}
                    animate={{
                      width:
                        i < sceneIndex
                          ? "100%"
                          : i > sceneIndex
                            ? "0%"
                            : step === "questions"
                              ? `${((qIndex + (picked !== null ? 1 : 0)) / r.questions.length) * 100}%`
                              : step === "flash"
                                ? "15%"
                                : "5%",
                    }}
                    transition={{ duration: 0.35 }}
                  />
                </div>
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === "ready" && (
                <motion.div
                  key={`ready-${sceneIndex}`}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.05 }}
                  className="flex min-h-[42vh] flex-col items-center justify-center gap-4 text-center"
                >
                  <motion.div
                    animate={{ scale: [1, 1.12, 1] }}
                    transition={{ repeat: Infinity, duration: 0.9 }}
                    className="flex h-20 w-20 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--primary-from)_22%,transparent)]"
                  >
                    <Eye className="h-10 w-10 text-[var(--primary-from)]" />
                  </motion.div>
                  <p className="text-sm font-semibold uppercase tracking-[0.25em] text-[var(--fg-muted)]">
                    {sceneReady ? "Get ready" : "Loading scene…"}
                  </p>
                  <h2 className="font-display text-4xl font-extrabold sm:text-5xl">
                    Scene {sceneIndex + 1}
                  </h2>
                  <p className="max-w-sm text-[var(--fg-muted)]">
                    Memorize{" "}
                    <span className="font-semibold text-[var(--fg)]">{round.title}</span> —{" "}
                    {FLASH_MS / 1000}s only.
                  </p>
                </motion.div>
              )}

              {step === "flash" && (
                <motion.div
                  key={`flash-${sceneIndex}`}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, filter: "blur(8px)", scale: 1.02 }}
                  transition={{ duration: 0.15 }}
                  className="relative w-full overflow-hidden rounded-3xl border border-[var(--border)] shadow-[0_24px_60px_-28px_rgba(0,0,0,0.55)]"
                >
                  <div className="relative aspect-[14/9] w-full bg-[var(--bg-elevated)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={round.imageUrl}
                      alt={`Memorize: ${round.title}`}
                      className="absolute inset-0 h-full w-full object-cover"
                      decoding="sync"
                      fetchPriority="high"
                    />
                    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(0,0,0,0.35)_100%)]" />
                    <div className="absolute left-3 top-3 flex items-center gap-2 rounded-full bg-black/55 px-3 py-1.5 text-sm font-bold text-white backdrop-blur-md">
                      <Zap className="h-4 w-4 text-[var(--primary-from)]" />
                      MEMORIZE
                    </div>
                    <div className="absolute bottom-3 right-3 flex h-14 w-14 items-center justify-center">
                      <svg className="absolute inset-0 -rotate-90" viewBox="0 0 56 56">
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          fill="none"
                          stroke="rgba(255,255,255,0.25)"
                          strokeWidth="4"
                        />
                        <circle
                          cx="28"
                          cy="28"
                          r="24"
                          fill="none"
                          stroke="var(--primary-from)"
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 24}
                          strokeDashoffset={2 * Math.PI * 24 * (1 - flashProgress)}
                        />
                      </svg>
                      <span className="font-display text-sm font-extrabold text-white drop-shadow">
                        {(flashProgress * (FLASH_MS / 1000)).toFixed(1)}
                      </span>
                    </div>
                  </div>
                </motion.div>
              )}

              {step === "questions" && question && (
                <motion.div
                  key={`q-${sceneIndex}-${qIndex}`}
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="w-full space-y-5"
                >
                  <p className="text-center text-sm text-[var(--fg-muted)]">
                    Q{answeredCount + 1} of {totalQ}
                    <span className="mx-2 opacity-40">·</span>
                    {correctRef.current} correct so far
                  </p>
                  <h2 className="text-center font-display text-2xl font-bold leading-snug md:text-3xl">
                    {question.prompt}
                  </h2>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {question.options.map((opt, i) => {
                      const isPicked = picked === i;
                      const isCorrect = i === question.correctIndex;
                      const showFeedback = picked !== null;
                      let tone =
                        "border-[var(--border)] bg-[color-mix(in_srgb,var(--fg)_5%,transparent)] hover:scale-[1.02]";
                      if (showFeedback && isCorrect) {
                        tone =
                          "border-[color-mix(in_srgb,var(--primary-from)_70%,transparent)] bg-[color-mix(in_srgb,var(--primary-from)_28%,transparent)]";
                      } else if (showFeedback && isPicked && !isCorrect) {
                        tone =
                          "border-[color-mix(in_srgb,var(--accent-warm)_75%,transparent)] bg-[color-mix(in_srgb,var(--accent-warm)_22%,transparent)]";
                      } else if (showFeedback) {
                        tone = "border-transparent opacity-45";
                      }
                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={picked !== null}
                          className={`flex min-h-14 items-center rounded-2xl border px-5 py-4 text-left text-lg font-medium transition duration-200 disabled:cursor-default ${tone}`}
                          onClick={() => answer(i)}
                        >
                          <span className="mr-3 font-display text-[var(--fg-muted)]">
                            {String.fromCharCode(65 + i)}
                          </span>
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      }}
    </GameShell>
  );
}
