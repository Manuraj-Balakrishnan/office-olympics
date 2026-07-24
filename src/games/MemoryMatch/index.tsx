"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GameShell } from "../shared/GameShell";
import { ResultsScreen, type ResultRow } from "../shared/ResultsScreen";
import { useSound } from "@/hooks/useSound";

const ICONS = ["📎", "☕", "🖨️", "📅", "🖊️", "💼", "📊", "🖥️"];

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

function buildDeck(): Card[] {
  return [...ICONS, ...ICONS]
    .map((emoji, i) => ({ id: i, emoji, flipped: false, matched: false }))
    .sort(() => Math.random() - 0.5)
    .map((c, i) => ({ ...c, id: i }));
}

function computeScore(matches: number, moves: number, cleared = false) {
  if (matches <= 0) return 0;
  // 100 per match + efficiency bonus that shrinks with extra moves + clear bonus
  const efficiency = matches > 0 ? Math.max(0, (matches * 2 - moves) * 15) : 0;
  return matches * 100 + efficiency + (cleared ? 150 : 0);
}

export function MemoryMatch() {
  const { play } = useSound();
  const [cards, setCards] = useState<Card[]>(() => buildDeck());
  const [selected, setSelected] = useState<number[]>([]);
  const [moves, setMoves] = useState(0);
  const [matches, setMatches] = useState(0);
  const [lock, setLock] = useState(false);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const participantsRef = useRef<ResultRow["participant"][]>([]);
  const finishRef = useRef<(() => void) | null>(null);
  const finalized = useRef(false);
  const statsRef = useRef({ matches: 0, moves: 0, score: 0 });
  const pendingClear = useRef(false);

  const score = useMemo(() => computeScore(matches, moves), [matches, moves]);
  statsRef.current = { matches, moves, score };

  const finalize = (cleared = false) => {
    if (finalized.current) return;
    finalized.current = true;
    const s = statsRef.current;
    const finalScore = computeScore(s.matches, s.moves, cleared);
    setResults(
      participantsRef.current.map((p) => ({
        participant: p,
        score: finalScore,
        detail: `${s.matches}/8 matches · ${s.moves} moves${cleared ? " · cleared" : ""}`,
      })),
    );
    finishRef.current?.();
  };

  const flip = (index: number) => {
    if (lock || finalized.current || pendingClear.current || cards[index]?.flipped || cards[index]?.matched)
      return;
    play("click");
    const next = cards.map((c, i) => (i === index ? { ...c, flipped: true } : c));
    const nextSelected = [...selected, index];
    setCards(next);
    setSelected(nextSelected);

    if (nextSelected.length === 2) {
      setLock(true);
      const nextMoves = moves + 1;
      setMoves(nextMoves);
      const [a, b] = nextSelected;
      if (next[a!]!.emoji === next[b!]!.emoji) {
        play("correct");
        setTimeout(() => {
          const nextMatches = statsRef.current.matches + 1;
          setCards((prev) =>
            prev.map((c, i) => (i === a || i === b ? { ...c, matched: true } : c)),
          );
          setMatches(nextMatches);
          statsRef.current = {
            matches: nextMatches,
            moves: nextMoves,
            score: computeScore(nextMatches, nextMoves),
          };
          setSelected([]);
          setLock(false);
          if (nextMatches >= 8) {
            pendingClear.current = true;
            finalize(true);
          }
        }, 350);
      } else {
        play("wrong");
        setTimeout(() => {
          setCards((prev) =>
            prev.map((c, i) =>
              i === a || i === b ? { ...c, flipped: false } : c,
            ),
          );
          setSelected([]);
          setLock(false);
        }, 700);
      }
    }
  };

  return (
    <GameShell
      gameId="memory"
      title="Memory Match"
      durationSec={90}
      supportsHuddle
      onTimeUp={() => {
        if (pendingClear.current) return;
        finalize(false);
      }}
      results={
        results ? (
          <ResultsScreen gameId="memory" title="Memory Match" results={results} />
        ) : undefined
      }
    >
      {({ participants, finish }) => {
        participantsRef.current = participants;
        finishRef.current = finish;
        if (results) return null;

        return (
          <div className="mx-auto w-full max-w-2xl px-4 py-4">
            <div className="mb-4 flex justify-between font-display text-lg font-bold">
              <span>Matches: {matches}/8</span>
              <span>Moves: {moves}</span>
              <span>Score: {score}</span>
            </div>
            <div className="grid grid-cols-4 gap-3">
              {cards.map((card, i) => (
                <button
                  key={card.id}
                  type="button"
                  className="perspective h-20 md:h-28"
                  onClick={() => flip(i)}
                >
                  <motion.div
                    className="preserve-3d relative h-full w-full"
                    animate={{ rotateY: card.flipped || card.matched ? 180 : 0 }}
                    transition={{ duration: 0.35 }}
                  >
                    <div className="backface-hidden absolute inset-0 flex items-center justify-center rounded-2xl bg-gradient-to-br from-violet-600 to-fuchsia-600 font-display text-2xl font-bold text-white">
                      ?
                    </div>
                    <div
                      className="backface-hidden absolute inset-0 flex items-center justify-center rounded-2xl bg-[var(--bg-elevated)] text-4xl"
                      style={{ transform: "rotateY(180deg)" }}
                    >
                      {card.emoji}
                    </div>
                  </motion.div>
                </button>
              ))}
            </div>
            <button
              type="button"
              className="btn-secondary mx-auto mt-6 block"
              disabled={pendingClear.current || finalized.current}
              onClick={() => {
                if (pendingClear.current) return;
                finalize(false);
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
