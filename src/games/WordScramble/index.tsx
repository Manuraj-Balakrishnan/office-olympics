"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GameShell } from "../shared/GameShell";
import { ResultsScreen, type ResultRow } from "../shared/ResultsScreen";
import { SCRAMBLE_WORDS, scrambleWord } from "@/data/scrambleWords";
import { useSound } from "@/hooks/useSound";

function nextWord(used: Set<string>) {
  const pool = SCRAMBLE_WORDS.filter((w) => !used.has(w));
  const word = (pool.length ? pool : SCRAMBLE_WORDS)[
    Math.floor(Math.random() * (pool.length || SCRAMBLE_WORDS.length))
  ]!;
  return { word, scrambled: scrambleWord(word) };
}

export function WordScramble() {
  const { play } = useSound();
  const initial = useMemo(() => nextWord(new Set()), []);
  const [used, setUsed] = useState(() => new Set([initial.word]));
  const [word, setWord] = useState(initial.word);
  const [scrambled, setScrambled] = useState(initial.scrambled);
  const [input, setInput] = useState("");
  const [hintLetter, setHintLetter] = useState<string | null>(null);
  const [solved, setSolved] = useState(0);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const participantsRef = useRef<ResultRow["participant"][]>([]);
  const finishRef = useRef<(() => void) | null>(null);
  const solvedRef = useRef(0);
  const finalized = useRef(false);

  const finalize = (count: number) => {
    if (finalized.current) return;
    finalized.current = true;
    setResults(
      participantsRef.current.map((p) => ({
        participant: p,
        score: count,
        detail: `${count} words`,
      })),
    );
    finishRef.current?.();
  };

  const advance = () => {
    const nxt = nextWord(used);
    setUsed(new Set([...used, nxt.word]));
    setWord(nxt.word);
    setScrambled(nxt.scrambled);
    setInput("");
    setHintLetter(null);
  };

  const submit = () => {
    if (finalized.current) return;
    if (input.trim().toUpperCase() === word) {
      play("correct");
      const n = solvedRef.current + 1;
      solvedRef.current = n;
      setSolved(n);
      advance();
    } else {
      play("wrong");
    }
  };

  const pass = () => {
    if (finalized.current) return;
    play("click");
    advance();
  };

  const useHint = () => {
    if (finalized.current || hintLetter) return;
    play("click");
    const first = word[0]!;
    setHintLetter(first);
    setInput((prev) => (prev.length === 0 ? first : prev));
  };

  return (
    <GameShell
      gameId="word-scramble"
      title="Word Scramble Sprint"
      durationSec={60}
      onTimeUp={() => finalize(solvedRef.current)}
      results={
        results ? (
          <ResultsScreen
            gameId="word-scramble"
            title="Word Scramble Sprint"
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
          <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-8 px-4 py-8">
            <p className="font-display text-2xl font-bold">Words solved: {solved}</p>
            <div className="flex flex-wrap justify-center gap-2">
              {scrambled.split("").map((letter, i) => (
                <motion.span
                  key={`${scrambled}-${i}`}
                  initial={{ y: -24, opacity: 0, rotate: -12 }}
                  animate={{ y: 0, opacity: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 14, delay: i * 0.04 }}
                  className="flex h-14 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-teal-600 font-display text-2xl font-extrabold text-white shadow-lg md:h-16 md:w-14"
                >
                  {letter}
                </motion.span>
              ))}
            </div>
            {hintLetter && (
              <p className="text-sm font-semibold text-[var(--fg-muted)]">
                Starts with <span className="font-display text-lg text-[var(--ring)]">{hintLetter}</span>
              </p>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.toUpperCase())}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              className="w-full rounded-2xl border border-white/15 bg-[var(--bg-elevated)] px-5 py-4 text-center font-display text-2xl font-bold tracking-widest outline-none focus:ring-2 focus:ring-[var(--ring)]"
              placeholder="TYPE WORD"
              autoFocus
              autoCapitalize="characters"
            />
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button type="button" className="btn-primary" onClick={submit}>
                Check
              </button>
              <button
                type="button"
                className="btn-secondary text-sm disabled:opacity-50"
                disabled={!!hintLetter}
                onClick={useHint}
              >
                {hintLetter ? "Hint used" : "Hint · first letter"}
              </button>
              <button type="button" className="btn-secondary" onClick={pass}>
                Pass
              </button>
            </div>
            <button
              type="button"
              className="btn-secondary text-sm"
              onClick={() => finalize(solvedRef.current)}
            >
              End sprint
            </button>
          </div>
        );
      }}
    </GameShell>
  );
}
