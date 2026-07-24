"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { GameShell } from "../shared/GameShell";
import { ResultsScreen, type ResultRow } from "../shared/ResultsScreen";
import { useSound } from "@/hooks/useSound";

const DURATION_SEC = 90;
const PAIR_COUNT = 8;

/** Office icons with face tint — pairs share a color so matches read instantly. */
const PAIRS = [
  { emoji: "📎", tint: "#5b8def" },
  { emoji: "☕", tint: "#e07a3a" },
  { emoji: "🖨️", tint: "#6b7280" },
  { emoji: "📅", tint: "#0d9488" },
  { emoji: "🖊️", tint: "#c8f542" },
  { emoji: "💼", tint: "#a16207" },
  { emoji: "📊", tint: "#be123c" },
  { emoji: "🖥️", tint: "#0369a1" },
] as const;

type PairDef = (typeof PAIRS)[number];

interface Card {
  id: number;
  pairKey: string;
  emoji: string;
  tint: string;
  flipped: boolean;
  matched: boolean;
}

type Feedback =
  | { kind: "match"; id: number; streak: number }
  | { kind: "miss"; id: number }
  | null;

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

function buildDeck(): Card[] {
  const doubled: PairDef[] = [...PAIRS, ...PAIRS];
  return shuffle(doubled).map((pair, i) => ({
    id: i,
    pairKey: pair.emoji,
    emoji: pair.emoji,
    tint: pair.tint,
    flipped: false,
    matched: false,
  }));
}

/**
 * Raw score (clamped ≤1200, normalized /1100):
 * - 100 per match
 * - efficiency: leftover “free flips” × 15
 * - combo: consecutive matches without a miss
 * - clear: 100 + up to 100 from time left
 */
function computeScore(
  matches: number,
  moves: number,
  comboPoints: number,
  cleared = false,
  remainingMs = 0,
) {
  if (matches <= 0) return 0;
  const efficiency = Math.max(0, matches * 2 - moves) * 15;
  const clearBonus = cleared ? 100 : 0;
  const speedBonus = cleared
    ? Math.round((Math.max(0, remainingMs) / (DURATION_SEC * 1000)) * 100)
    : 0;
  return matches * 100 + efficiency + comboPoints + clearBonus + speedBonus;
}

export function MemoryMatch() {
  const { play } = useSound();
  const [cards, setCards] = useState<Card[]>(() => buildDeck());
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [comboPoints, setComboPoints] = useState(0);
  const [lock, setLock] = useState(false);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [missIds, setMissIds] = useState<number[]>([]);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const participantsRef = useRef<ResultRow["participant"][]>([]);
  const finishRef = useRef<(() => void) | null>(null);
  const remainingMsRef = useRef(DURATION_SEC * 1000);
  const finalized = useRef(false);
  const pendingClear = useRef(false);
  const streakRef = useRef(0);
  const comboRef = useRef(0);
  const bestStreakRef = useRef(0);
  const flipTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const feedbackId = useRef(0);

  const statsRef = useRef({ matches: 0, moves: 0, comboPoints: 0, score: 0 });
  const score = useMemo(
    () => computeScore(matches, moves, comboPoints),
    [matches, moves, comboPoints],
  );
  statsRef.current = { matches, moves, comboPoints, score };

  useEffect(
    () => () => {
      flipTimers.current.forEach(clearTimeout);
    },
    [],
  );

  const pushFeedback = (kind: "match" | "miss", nextStreak: number) => {
    feedbackId.current += 1;
    const id = feedbackId.current;
    setFeedback(
      kind === "match" ? { kind, id, streak: nextStreak } : { kind, id },
    );
    const t = setTimeout(() => {
      setFeedback((prev) => (prev?.id === id ? null : prev));
    }, kind === "match" ? 900 : 650);
    flipTimers.current.push(t);
  };

  const finalize = (cleared = false, remainingMs?: number) => {
    if (finalized.current) return;
    finalized.current = true;
    const s = statsRef.current;
    const left = Math.max(0, remainingMs ?? remainingMsRef.current);
    const finalScore = computeScore(
      s.matches,
      s.moves,
      s.comboPoints,
      cleared,
      left,
    );
    const elapsedSec = (
      (DURATION_SEC * 1000 - left) /
      1000
    ).toFixed(1);
    setResults(
      participantsRef.current.map((p) => ({
        participant: p,
        score: finalScore,
        detail: cleared
          ? `${s.matches}/${PAIR_COUNT} · ${s.moves} moves · ${elapsedSec}s · streak ×${bestStreakRef.current}`
          : `${s.matches}/${PAIR_COUNT} matches · ${s.moves} moves · streak ×${bestStreakRef.current}`,
      })),
    );
    finishRef.current?.();
  };

  const flip = (index: number) => {
    if (
      lock ||
      finalized.current ||
      pendingClear.current ||
      cards[index]?.flipped ||
      cards[index]?.matched
    ) {
      return;
    }
    play("click");
    const next = cards.map((c, i) => (i === index ? { ...c, flipped: true } : c));
    const nextSelected = [...selected, index];
    setCards(next);
    setSelected(nextSelected);

    if (nextSelected.length !== 2) return;

    setLock(true);
    const nextMoves = moves + 1;
    setMoves(nextMoves);
    const [a, b] = nextSelected;
    const cardA = next[a!]!;
    const cardB = next[b!]!;

    if (cardA.pairKey === cardB.pairKey) {
      play("correct");
      const nextStreak = streakRef.current + 1;
      streakRef.current = nextStreak;
      setStreak(nextStreak);
      if (nextStreak > bestStreakRef.current) {
        bestStreakRef.current = nextStreak;
        setBestStreak(nextStreak);
      }
      // First match in a streak is free; each extra consecutive match adds juice
      const gained = nextStreak >= 2 ? 20 + (nextStreak - 2) * 10 : 0;
      const nextCombo = comboRef.current + gained;
      comboRef.current = nextCombo;
      setComboPoints(nextCombo);
      pushFeedback("match", nextStreak);

      const t = setTimeout(() => {
        const nextMatches = statsRef.current.matches + 1;
        setCards((prev) =>
          prev.map((c, i) =>
            i === a || i === b ? { ...c, matched: true, flipped: true } : c,
          ),
        );
        setMatches(nextMatches);
        statsRef.current = {
          matches: nextMatches,
          moves: nextMoves,
          comboPoints: nextCombo,
          score: computeScore(nextMatches, nextMoves, nextCombo),
        };
        setSelected([]);
        setLock(false);
        if (nextMatches >= PAIR_COUNT) {
          pendingClear.current = true;
          finalize(true, remainingMsRef.current);
        }
      }, 320);
      flipTimers.current.push(t);
    } else {
      play("wrong");
      streakRef.current = 0;
      setStreak(0);
      setMissIds([a!, b!]);
      pushFeedback("miss", 0);

      const t = setTimeout(() => {
        setCards((prev) =>
          prev.map((c, i) =>
            i === a || i === b ? { ...c, flipped: false } : c,
          ),
        );
        setSelected([]);
        setMissIds([]);
        setLock(false);
      }, 720);
      flipTimers.current.push(t);
    }
  };

  const matchedCount = matches;
  const progress = matchedCount / PAIR_COUNT;

  return (
    <GameShell
      gameId="memory"
      title="Memory Match"
      durationSec={DURATION_SEC}
      supportsHuddle
      onTimeUp={() => {
        if (pendingClear.current) return;
        finalize(false, 0);
      }}
      results={
        results ? (
          <ResultsScreen gameId="memory" title="Memory Match" results={results} />
        ) : undefined
      }
    >
      {({ participants, finish, remainingMs }) => {
        participantsRef.current = participants;
        finishRef.current = finish;
        remainingMsRef.current = remainingMs;
        if (results) return null;

        return (
          <div className="relative mx-auto w-full max-w-2xl px-3 py-3 sm:px-4 sm:py-4">
            {/* HUD */}
            <div className="mb-4 space-y-3">
              <div className="flex items-end justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
                    Pairs found
                  </p>
                  <p className="font-display text-3xl font-extrabold tabular-nums leading-none sm:text-4xl">
                    {matchedCount}
                    <span className="text-lg font-bold text-[var(--fg-muted)] sm:text-xl">
                      /{PAIR_COUNT}
                    </span>
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                  <StatChip label="Moves" value={moves} />
                  <StatChip label="Score" value={score} accent />
                  {bestStreak > 1 && (
                    <StatChip label="Best streak" value={`×${bestStreak}`} />
                  )}
                </div>
              </div>

              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-[var(--primary-from)] to-[var(--accent-2)]"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress * 100}%` }}
                  transition={{ type: "spring", stiffness: 220, damping: 28 }}
                />
              </div>
            </div>

            {/* Board */}
            <div className="relative">
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {cards.map((card, i) => {
                  const faceUp = card.flipped || card.matched;
                  const isSelected = selected.includes(i) && !card.matched;
                  const isMiss = missIds.includes(i);
                  return (
                    <motion.button
                      key={card.id}
                      type="button"
                      initial={{ opacity: 0, y: 18, scale: 0.88 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{
                        delay: 0.03 * i,
                        type: "spring",
                        stiffness: 320,
                        damping: 22,
                      }}
                      className="perspective aspect-square min-h-[4.5rem] touch-manipulation outline-none sm:min-h-[5.5rem] md:min-h-[6.25rem]"
                      disabled={lock || faceUp || finalized.current}
                      aria-label={
                        faceUp
                          ? `Card ${card.emoji}${card.matched ? ", matched" : ""}`
                          : "Hidden card"
                      }
                      onClick={() => flip(i)}
                    >
                      <motion.div
                        className="h-full w-full"
                        animate={isMiss ? { x: [0, -7, 7, -5, 5, 0] } : { x: 0 }}
                        transition={isMiss ? { duration: 0.45 } : { duration: 0.15 }}
                      >
                      <motion.div
                        className="preserve-3d relative h-full w-full"
                        animate={{
                          rotateY: faceUp ? 180 : 0,
                          scale: isSelected ? 1.04 : card.matched ? 0.96 : 1,
                        }}
                        transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                      >
                        {/* Back */}
                        <div className="backface-hidden absolute inset-0 overflow-hidden rounded-xl border border-white/10 sm:rounded-2xl">
                          <div
                            className="absolute inset-0"
                            style={{
                              background:
                                "linear-gradient(145deg, #1a2233 0%, #121820 55%, #0e141c 100%)",
                            }}
                          />
                          <div
                            className="absolute inset-0 opacity-40"
                            style={{
                              backgroundImage:
                                "radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--primary-from) 35%, transparent), transparent 45%), radial-gradient(circle at 80% 80%, color-mix(in srgb, var(--accent-2) 28%, transparent), transparent 40%)",
                            }}
                          />
                          <div
                            className="absolute inset-[10%] rounded-lg opacity-50 sm:rounded-xl"
                            style={{
                              backgroundImage:
                                "repeating-linear-gradient(45deg, transparent, transparent 6px, rgb(255 255 255 / 0.04) 6px, rgb(255 255 255 / 0.04) 7px)",
                            }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="font-display text-xl font-extrabold text-white/25 sm:text-2xl">
                              ?
                            </span>
                          </div>
                        </div>

                        {/* Face */}
                        <div
                          className="backface-hidden absolute inset-0 flex items-center justify-center overflow-hidden rounded-xl border sm:rounded-2xl"
                          style={{
                            transform: "rotateY(180deg)",
                            borderColor: card.matched
                              ? "color-mix(in srgb, var(--primary-from) 55%, transparent)"
                              : "rgb(255 255 255 / 0.12)",
                            background: card.matched
                              ? `linear-gradient(160deg, color-mix(in srgb, ${card.tint} 22%, var(--bg-elevated)), var(--bg-elevated))`
                              : `linear-gradient(160deg, color-mix(in srgb, ${card.tint} 18%, var(--bg-elevated)), var(--bg-elevated))`,
                            boxShadow: card.matched
                              ? `0 0 0 1px color-mix(in srgb, var(--primary-from) 30%, transparent), 0 8px 24px color-mix(in srgb, ${card.tint} 18%, transparent)`
                              : isSelected
                                ? `0 0 0 2px color-mix(in srgb, var(--ring) 70%, transparent), 0 10px 28px rgb(0 0 0 / 0.35)`
                                : "0 6px 18px rgb(0 0 0 / 0.25)",
                          }}
                        >
                          <motion.span
                            className="select-none text-[2rem] leading-none sm:text-[2.75rem]"
                            initial={false}
                            animate={
                              card.matched
                                ? { scale: [1, 1.2, 1], rotate: [0, -8, 5, 0] }
                                : { scale: 1, rotate: 0 }
                            }
                            transition={{ duration: 0.42 }}
                          >
                            {card.emoji}
                          </motion.span>
                          {card.matched && (
                            <motion.span
                              initial={{ opacity: 0, scale: 0.6 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="absolute bottom-1.5 right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-[var(--primary-from)] text-[10px] font-extrabold text-[var(--primary-fg)] sm:bottom-2 sm:right-2 sm:h-6 sm:w-6 sm:text-xs"
                            >
                              ✓
                            </motion.span>
                          )}
                        </div>
                      </motion.div>
                      </motion.div>
                    </motion.button>
                  );
                })}
              </div>

              {/* Floating feedback */}
              <AnimatePresence>
                {feedback && (
                  <motion.div
                    key={feedback.id}
                    initial={{ opacity: 0, y: 12, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.95 }}
                    className="pointer-events-none absolute inset-x-0 top-1/2 z-10 flex -translate-y-1/2 justify-center"
                  >
                    <div
                      className={`rounded-2xl px-4 py-2 font-display text-sm font-extrabold shadow-lg backdrop-blur-md sm:text-base ${
                        feedback.kind === "match"
                          ? "bg-[color-mix(in_srgb,var(--primary-from)_88%,transparent)] text-[var(--primary-fg)]"
                          : "bg-[color-mix(in_srgb,#be123c_85%,transparent)] text-white"
                      }`}
                    >
                      {feedback.kind === "match"
                        ? feedback.streak >= 2
                          ? `Combo ×${feedback.streak}!`
                          : "Match!"
                        : "No match"}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Live streak hint */}
            <AnimatePresence>
              {streak >= 2 && !feedback && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-3 text-center text-sm font-semibold text-[var(--ring)]"
                >
                  Streak ×{streak} — keep matching!
                </motion.p>
              )}
            </AnimatePresence>

            <button
              type="button"
              className="btn-secondary mx-auto mt-5 block"
              disabled={pendingClear.current || finalized.current}
              onClick={() => {
                if (pendingClear.current) return;
                finalize(false, remainingMsRef.current);
              }}
            >
              Finish early
            </button>
          </div>
        );
      }}
    </GameShell>
  );
}

function StatChip({
  label,
  value,
  accent,
}: {
  label: string;
  value: string | number;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl px-2.5 py-1.5 text-right sm:px-3 ${
        accent
          ? "bg-[color-mix(in_srgb,var(--primary-from)_14%,transparent)]"
          : "bg-white/5"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-muted)]">
        {label}
      </p>
      <p
        className={`font-display text-base font-extrabold tabular-nums sm:text-lg ${
          accent ? "text-[var(--ring)]" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
