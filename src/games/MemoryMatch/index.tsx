"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, LayoutGrid } from "lucide-react";
import { GameShell } from "../shared/GameShell";
import { ResultsScreen, type ResultRow } from "../shared/ResultsScreen";
import { useSound } from "@/hooks/useSound";

const PAIR_COUNT = 8;
/** Clear under this for a full speed bonus (photos need a bit of study time). */
const SPEED_REF_MS = 60_000;
const SPEED_BONUS_MAX = 100;

const IMG = (id: string, focal = "") =>
  `https://images.unsplash.com/${id}?w=520&h=520&fit=crop&q=80&auto=format${focal}`;

/**
 * High-contrast single subjects — easy to tell apart at card size.
 * Solid / bold backgrounds help matches pop in a 4×4 grid.
 */
const PAIRS = [
  {
    id: "coffee",
    label: "Coffee",
    tint: "#c4783a",
    src: IMG("photo-1495474472287-4d71bcdd2085", "&crop=entropy"),
  },
  {
    id: "laptop",
    label: "Laptop",
    tint: "#7c5cff",
    src: IMG("photo-1517336714731-489689fd1ca8"),
  },
  {
    id: "headphones",
    label: "Headphones",
    tint: "#e8b923",
    src: IMG("photo-1505740420928-5e560c06d30e"),
  },
  {
    id: "mouse",
    label: "Mouse",
    tint: "#8b95a8",
    src: IMG("photo-1527864550417-7fd91fc51a46"),
  },
  {
    id: "plant",
    label: "Desk plant",
    tint: "#2f9e6b",
    src: IMG("photo-1459411552884-841db9b3cc2a"),
  },
  {
    id: "glasses",
    label: "Glasses",
    tint: "#1f2937",
    src: IMG("photo-1572635196237-14b3f281503f"),
  },
  {
    id: "clock",
    label: "Clock",
    tint: "#ef6c3a",
    src: IMG("photo-1563861826100-9cb868fdbe1c"),
  },
  {
    id: "chair",
    label: "Chair",
    tint: "#3d8b9c",
    src: IMG("photo-1592078615290-033ee584e267"),
  },
] as const;

type PairDef = (typeof PAIRS)[number];

interface Card {
  id: number;
  pairKey: string;
  label: string;
  tint: string;
  src: string;
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
    pairKey: pair.id,
    label: pair.label,
    tint: pair.tint,
    src: pair.src,
    flipped: false,
    matched: false,
  }));
}

/**
 * Raw score (clamped ≤1200, normalized /1100):
 * - 100 per match
 * - efficiency: leftover attempts under 2×matches × 15 (perfect clear = +120)
 * - combo: modest streak bonuses (full 8-streak ≈ +77)
 * - clear: +100
 * - speed: up to +100 for finishing under SPEED_REF_MS
 */
function computeScore(
  matches: number,
  moves: number,
  comboPoints: number,
  cleared = false,
  elapsedMs = 0,
) {
  if (matches <= 0) return 0;
  const efficiency = Math.max(0, matches * 2 - moves) * 15;
  const clearBonus = cleared ? 100 : 0;
  const speedBonus = cleared
    ? Math.round(
        Math.max(0, 1 - Math.max(0, elapsedMs) / SPEED_REF_MS) *
          SPEED_BONUS_MAX,
      )
    : 0;
  return matches * 100 + efficiency + comboPoints + clearBonus + speedBonus;
}

function comboGain(streak: number) {
  if (streak < 2) return 0;
  return 5 + (streak - 2) * 2;
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
  const [justMatched, setJustMatched] = useState<number[]>([]);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const participantsRef = useRef<ResultRow["participant"][]>([]);
  const finishRef = useRef<(() => void) | null>(null);
  const startedAt = useRef(0);
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

  useEffect(() => {
    for (const pair of PAIRS) {
      const img = new Image();
      img.src = pair.src;
    }
  }, []);

  const ensureStarted = () => {
    if (startedAt.current === 0) startedAt.current = Date.now();
  };

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

  const elapsedNow = () =>
    startedAt.current > 0 ? Date.now() - startedAt.current : 0;

  const finalize = (cleared = false, elapsedMs?: number) => {
    if (finalized.current) return;
    finalized.current = true;
    const s = statsRef.current;
    const elapsed = Math.max(0, elapsedMs ?? elapsedNow());
    const finalScore = computeScore(
      s.matches,
      s.moves,
      s.comboPoints,
      cleared,
      elapsed,
    );
    const elapsedSec = (elapsed / 1000).toFixed(1);
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
    ensureStarted();
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
      const gained = comboGain(nextStreak);
      const nextCombo = comboRef.current + gained;
      comboRef.current = nextCombo;
      setComboPoints(nextCombo);
      pushFeedback("match", nextStreak);

      const t = setTimeout(() => {
        const nextMatches = statsRef.current.matches + 1;
        setJustMatched([a!, b!]);
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
        const clearPulse = setTimeout(() => setJustMatched([]), 520);
        flipTimers.current.push(clearPulse);
        if (nextMatches >= PAIR_COUNT) {
          pendingClear.current = true;
          finalize(true, elapsedNow());
        }
      }, 420);
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
      }, 780);
      flipTimers.current.push(t);
    }
  };

  const matchedCount = matches;

  return (
    <GameShell
      gameId="memory"
      title="Memory Match"
      durationSec={90}
      supportsHuddle
      hideTimer
      results={
        results ? (
          <ResultsScreen gameId="memory" title="Memory Match" results={results} />
        ) : undefined
      }
    >
      {({ participants, phase: shellPhase, finish }) => {
        participantsRef.current = participants;
        finishRef.current = finish;
        if (results || shellPhase !== "playing") return null;

        return (
          <div className="relative mx-auto flex w-full max-w-xl flex-1 flex-col items-center px-3 pb-3 pt-1 sm:px-4 sm:pb-4">
            {/* Atmosphere */}
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-8 -z-10 mx-auto h-56 w-[85%] max-w-md rounded-full opacity-50 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in srgb, var(--primary-from) 18%, transparent), color-mix(in srgb, var(--accent-2) 12%, transparent) 50%, transparent 70%)",
              }}
            />

            {/* HUD */}
            <div className="mb-3 flex w-full items-end justify-between gap-3 sm:mb-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--fg-muted)] sm:text-[11px]">
                  Pairs found
                </p>
                <div className="mt-0.5 flex items-baseline gap-1">
                  <motion.span
                    key={matchedCount}
                    initial={{ y: 6, opacity: 0.35 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="font-display text-3xl font-extrabold tabular-nums leading-none sm:text-4xl"
                  >
                    {matchedCount}
                  </motion.span>
                  <span className="font-display text-base font-bold text-[var(--fg-muted)] sm:text-lg">
                    /{PAIR_COUNT}
                  </span>
                </div>
              </div>

              <div className="flex items-end gap-3 sm:gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
                    Moves
                  </p>
                  <p className="font-display text-xl font-extrabold tabular-nums leading-none sm:text-2xl">
                    {moves}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
                    Score
                  </p>
                  <p className="font-display text-xl font-extrabold tabular-nums leading-none text-[var(--ring)] sm:text-2xl">
                    {score}
                  </p>
                </div>
                {bestStreak > 1 && (
                  <div className="hidden text-right sm:block">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
                      Best
                    </p>
                    <p className="font-display text-xl font-extrabold tabular-nums leading-none sm:text-2xl">
                      ×{bestStreak}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Pair dots */}
            <div className="mb-3 flex items-center justify-center gap-1.5 sm:mb-4 sm:gap-2">
              {Array.from({ length: PAIR_COUNT }, (_, i) => (
                <motion.span
                  key={i}
                  animate={{
                    scale: i < matchedCount ? 1 : 0.85,
                    opacity: i < matchedCount ? 1 : 0.35,
                  }}
                  className={`h-1.5 rounded-full transition-colors sm:h-2 ${
                    i < matchedCount
                      ? "w-4 bg-[var(--ring)] sm:w-5"
                      : "w-1.5 bg-white/25 sm:w-2"
                  }`}
                />
              ))}
            </div>

            {/* Board tray */}
            <div
              className="relative w-full shrink-0 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-2 shadow-[inset_0_1px_0_rgb(255_255_255_/_0.06)] sm:rounded-3xl sm:p-3"
              style={{
                width: "min(100%, 34rem, calc(100dvh - 13rem))",
              }}
            >
              <div className="grid aspect-square grid-cols-4 gap-1.5 sm:gap-2.5">
                {cards.map((card, i) => (
                  <MemoryCard
                    key={card.id}
                    card={card}
                    index={i}
                    faceUp={card.flipped || card.matched}
                    isSelected={selected.includes(i) && !card.matched}
                    isMiss={missIds.includes(i)}
                    justMatched={justMatched.includes(i)}
                    disabled={
                      lock ||
                      card.flipped ||
                      card.matched ||
                      finalized.current
                    }
                    onFlip={() => flip(i)}
                  />
                ))}
              </div>

              <AnimatePresence>
                {feedback && (
                  <motion.div
                    key={feedback.id}
                    initial={{ opacity: 0, y: 12, scale: 0.92 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -12, scale: 0.95 }}
                    transition={{ type: "spring", stiffness: 400, damping: 24 }}
                    className="pointer-events-none absolute inset-x-0 top-[42%] z-20 flex -translate-y-1/2 justify-center px-4"
                  >
                    <div
                      className={`rounded-2xl px-4 py-2 font-display text-sm font-extrabold shadow-[0_12px_36px_rgb(0_0_0_/_0.45)] backdrop-blur-md sm:px-5 sm:text-base ${
                        feedback.kind === "match"
                          ? "bg-[color-mix(in_srgb,var(--primary-from)_92%,transparent)] text-[var(--primary-fg)]"
                          : "bg-[color-mix(in_srgb,#be123c_90%,transparent)] text-white"
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

            <div className="mt-3 flex min-h-[1.5rem] flex-col items-center gap-2 sm:mt-4">
              <AnimatePresence>
                {streak >= 2 && !feedback && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-center text-xs font-semibold text-[var(--ring)]"
                  >
                    Streak ×{streak} — keep matching!
                  </motion.p>
                )}
              </AnimatePresence>

              <button
                type="button"
                className="btn-secondary !min-h-9 !rounded-xl !px-3.5 !py-1.5 text-xs sm:text-sm"
                disabled={pendingClear.current || finalized.current}
                onClick={() => {
                  if (pendingClear.current) return;
                  finalize(false, elapsedNow());
                }}
              >
                Finish early
              </button>
            </div>
          </div>
        );
      }}
    </GameShell>
  );
}

function MemoryCard({
  card,
  index,
  faceUp,
  isSelected,
  isMiss,
  justMatched,
  disabled,
  onFlip,
}: {
  card: Card;
  index: number;
  faceUp: boolean;
  isSelected: boolean;
  isMiss: boolean;
  justMatched: boolean;
  disabled: boolean;
  onFlip: () => void;
}) {
  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 14, scale: 0.92 }}
      animate={{
        opacity: card.matched ? 0.92 : 1,
        y: 0,
        scale: 1,
      }}
      transition={{
        delay: 0.022 * index,
        type: "spring",
        stiffness: 360,
        damping: 24,
      }}
      whileHover={disabled ? undefined : { y: -3 }}
      whileTap={disabled ? undefined : { scale: 0.95 }}
      className="perspective relative aspect-square min-h-0 min-w-0 w-full touch-manipulation outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg)]"
      disabled={disabled}
      aria-label={
        faceUp
          ? `${card.label}${card.matched ? ", matched" : ""}`
          : "Hidden card"
      }
      onClick={onFlip}
    >
      <motion.div
        className="h-full w-full"
        animate={
          isMiss
            ? { x: [0, -7, 7, -5, 5, 0] }
            : justMatched
              ? { scale: [1, 1.07, 1] }
              : { x: 0, scale: 1 }
        }
        transition={
          isMiss
            ? { duration: 0.4 }
            : justMatched
              ? { duration: 0.42, ease: [0.22, 1, 0.36, 1] }
              : { duration: 0.16 }
        }
      >
        <motion.div
          className="preserve-3d relative h-full w-full"
          animate={{ rotateY: faceUp ? 180 : 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0.05, 0.2, 1] }}
          style={{ transformStyle: "preserve-3d" }}
        >
          {/* Back */}
          <div
            className="backface-hidden absolute inset-0 overflow-hidden rounded-xl sm:rounded-2xl"
            style={{
              transform: "translateZ(1px)",
              boxShadow: isSelected
                ? "0 0 0 2px color-mix(in srgb, var(--ring) 75%, transparent), 0 12px 28px rgb(0 0 0 / 0.4)"
                : "0 6px 16px rgb(0 0 0 / 0.3)",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(160deg, #252d3d 0%, #151b27 48%, #0e131c 100%)",
              }}
            />
            <div
              className="absolute inset-0 opacity-70"
              style={{
                backgroundImage:
                  "radial-gradient(circle at 30% 25%, color-mix(in srgb, var(--primary-from) 28%, transparent), transparent 50%), radial-gradient(circle at 75% 80%, color-mix(in srgb, var(--accent-2) 22%, transparent), transparent 48%)",
              }}
            />
            <div
              className="absolute inset-[12%] rounded-lg opacity-[0.45] sm:rounded-xl"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(-18deg, transparent, transparent 4px, rgb(255 255 255 / 0.04) 4px, rgb(255 255 255 / 0.04) 5px)",
              }}
            />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/25 ring-1 ring-white/12 backdrop-blur-[2px] sm:h-12 sm:w-12">
                <LayoutGrid className="h-[1.125rem] w-[1.125rem] text-[var(--primary-from)] sm:h-5 sm:w-5" strokeWidth={2.25} />
              </span>
            </div>
            <div className="pointer-events-none absolute inset-0 rounded-[inherit] ring-1 ring-inset ring-white/10" />
          </div>

          {/* Face — full-bleed photo */}
          <div
            className="backface-hidden absolute inset-0 overflow-hidden rounded-xl sm:rounded-2xl"
            style={{
              transform: "rotateY(180deg) translateZ(1px)",
              boxShadow: card.matched
                ? `0 0 0 2px color-mix(in srgb, var(--primary-from) 65%, transparent), 0 10px 28px color-mix(in srgb, ${card.tint} 28%, transparent)`
                : isSelected
                  ? "0 0 0 2px color-mix(in srgb, var(--ring) 70%, transparent), 0 14px 32px rgb(0 0 0 / 0.4)"
                  : "0 6px 18px rgb(0 0 0 / 0.32)",
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={card.src}
              alt={card.label}
              draggable={false}
              className="h-full w-full select-none object-cover"
              style={{
                filter: card.matched
                  ? "saturate(0.9) brightness(0.95)"
                  : "none",
                transform: justMatched ? "scale(1.05)" : "scale(1)",
                transition: "filter 0.35s ease, transform 0.4s ease",
              }}
            />
            <div
              className="pointer-events-none absolute inset-0"
              style={{
                background: card.matched
                  ? `linear-gradient(180deg, color-mix(in srgb, ${card.tint} 25%, transparent), transparent 40%), linear-gradient(0deg, color-mix(in srgb, var(--primary-from) 28%, transparent), transparent 50%)`
                  : `linear-gradient(180deg, transparent 50%, color-mix(in srgb, #0a0c10 75%, ${card.tint}) 100%)`,
              }}
            />

            <div className="pointer-events-none absolute inset-x-0 bottom-0 px-1.5 pb-1.5 sm:px-2 sm:pb-2">
              <p className="truncate text-center font-display text-[9px] font-bold tracking-wide text-white drop-shadow sm:text-[11px]">
                {card.label}
              </p>
            </div>

            <AnimatePresence>
              {card.matched && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.45 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--primary-from)] text-[var(--primary-fg)] shadow-[0_8px_20px_color-mix(in_srgb,var(--primary-from)_45%,transparent)] sm:h-8 sm:w-8">
                    <Check className="h-3.5 w-3.5 stroke-[3] sm:h-4 sm:w-4" />
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </motion.button>
  );
}
