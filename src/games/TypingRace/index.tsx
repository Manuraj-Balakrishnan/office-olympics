"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Flag, Gauge, Target } from "lucide-react";
import { GameShell } from "../shared/GameShell";
import { ResultsScreen, type ResultRow } from "../shared/ResultsScreen";
import { pickTypingSentence } from "@/data/typingSentences";
import { useSound } from "@/hooks/useSound";
import { springSnappy, springSoft } from "@/lib/motion";

export function TypingRace() {
  const { play } = useSound();
  const sentence = useMemo(() => pickTypingSentence(), []);
  const [input, setInput] = useState("");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [finalStats, setFinalStats] = useState<{
    wpm: number;
    accuracy: number;
    score: number;
    elapsedSec: number;
    correctChars: number;
  } | null>(null);
  const finalized = useRef(false);
  const participantsRef = useRef<ResultRow["participant"][]>([]);
  const finishRef = useRef<(() => void) | null>(null);
  const statsRef = useRef({
    wpm: 0,
    accuracy: 100,
    score: 0,
    elapsedSec: 0,
    correctChars: 0,
    typedChars: 0,
  });
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!startedAt || results) return;
    const id = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(id);
  }, [startedAt, results]);

  const correctChars = [...input].filter((ch, i) => sentence[i] === ch).length;
  const accuracy = input.length === 0 ? 100 : Math.round((correctChars / input.length) * 100);
  const elapsedSec = startedAt ? Math.max((now - startedAt) / 1000, 1) : 0;
  // Min 1 second elapsed once typing starts — blocks paste-instant 1000s
  const elapsedMin = startedAt
    ? Math.max((now - startedAt) / 60000, 1 / 60)
    : 1 / 60;
  const rawWpm = correctChars / 5 / elapsedMin;
  const wpm = Math.min(150, Math.round(rawWpm)); // hard cap honest elite WPM
  const progress = Math.min(1, input.length / sentence.length);
  const score = Math.round(wpm * (accuracy / 100) * 10);
  const caretIndex = Math.min(input.length, sentence.length);
  const hasTypo = input.length > 0 && input !== sentence.slice(0, input.length);
  statsRef.current = {
    wpm,
    accuracy,
    score,
    elapsedSec: Math.round(elapsedSec * 10) / 10,
    correctChars,
    typedChars: input.length,
  };

  const finalize = () => {
    if (finalized.current) return;
    finalized.current = true;
    const s = statsRef.current;
    const timeLabel =
      s.elapsedSec >= 60
        ? `${Math.floor(s.elapsedSec / 60)}m ${Math.round(s.elapsedSec % 60)}s`
        : `${s.elapsedSec.toFixed(1)}s`;
    setFinalStats({
      wpm: s.wpm,
      accuracy: s.accuracy,
      score: s.score,
      elapsedSec: s.elapsedSec,
      correctChars: s.correctChars,
    });
    setResults(
      participantsRef.current.map((p) => ({
        participant: p,
        score: s.score,
        detail: `${s.wpm} WPM · ${s.accuracy}% accuracy · ${timeLabel} · ${s.correctChars}/${sentence.length} chars`,
      })),
    );
    finishRef.current?.();
  };

  useEffect(() => {
    if (input === sentence && sentence.length > 0) {
      play("correct");
      finalize();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [input, sentence]);

  return (
    <GameShell
      gameId="typing"
      title="Typing Speed Race"
      durationSec={90}
      hideTimer
      results={
        results && finalStats ? (
          <>
            <div className="mx-auto grid w-full max-w-3xl grid-cols-2 gap-2 px-4 pt-4 sm:grid-cols-4 sm:gap-3 sm:pt-6">
              <StatTile label="WPM" value={String(finalStats.wpm)} highlight />
              <StatTile label="Accuracy" value={`${finalStats.accuracy}%`} />
              <StatTile
                label="Time"
                value={
                  finalStats.elapsedSec >= 60
                    ? `${Math.floor(finalStats.elapsedSec / 60)}:${String(
                        Math.round(finalStats.elapsedSec % 60),
                      ).padStart(2, "0")}`
                    : `${finalStats.elapsedSec.toFixed(1)}s`
                }
              />
              <StatTile
                label="Chars"
                value={`${finalStats.correctChars}/${sentence.length}`}
              />
            </div>
            <ResultsScreen gameId="typing" title="Typing Speed Race" results={results} />
          </>
        ) : undefined
      }
    >
      {({ participants, finish }) => {
        participantsRef.current = participants;
        finishRef.current = finish;
        if (results) return null;

        return (
          <div className="mx-auto flex w-full max-w-3xl flex-col gap-5 px-4 py-4 sm:gap-6 sm:py-6">
            {/* Live metrics */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <Metric
                icon={<Gauge className="h-3.5 w-3.5" strokeWidth={2.4} />}
                label="WPM"
                value={String(wpm)}
                accent={startedAt ? "lime" : "muted"}
              />
              <Metric
                icon={<Target className="h-3.5 w-3.5" strokeWidth={2.4} />}
                label="Accuracy"
                value={`${accuracy}%`}
                accent={hasTypo ? "warm" : startedAt ? "lime" : "muted"}
              />
              <Metric
                icon={<Flag className="h-3.5 w-3.5" strokeWidth={2.4} />}
                label="Progress"
                value={`${Math.round(progress * 100)}%`}
                accent={progress >= 1 ? "lime" : "muted"}
              />
            </div>

            {/* Race lane */}
            <div className="relative rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-4 sm:px-4 sm:py-5">
              <div
                className="pointer-events-none absolute inset-0 overflow-hidden rounded-2xl opacity-40"
                style={{
                  background:
                    "repeating-linear-gradient(90deg, transparent 0, transparent 18px, rgb(255 255 255 / 0.04) 18px, rgb(255 255 255 / 0.04) 20px)",
                }}
                aria-hidden
              />
              <div className="relative flex items-center gap-2.5 sm:gap-3">
                <div className="relative h-10 min-w-0 flex-1 sm:h-11">
                  <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 overflow-hidden rounded-full bg-tone-10">
                    <motion.div
                      className="h-full rounded-full bg-gradient-to-r from-[var(--accent-2)]/70 to-[var(--ring)]"
                      animate={{ width: `${progress * 100}%` }}
                      transition={springSnappy}
                    />
                  </div>

                  <motion.div
                    className="absolute top-1/2 z-10"
                    animate={{
                      left: `${Math.min(1, Math.max(0, progress)) * 100}%`,
                      x: `${-Math.min(1, Math.max(0, progress)) * 100}%`,
                      y: "-50%",
                    }}
                    transition={springSnappy}
                  >
                    <motion.div
                      animate={
                        startedAt && progress < 1
                          ? { y: [0, -2, 0], rotate: [-2, 2, -2] }
                          : { y: 0, rotate: 0 }
                      }
                      transition={
                        startedAt && progress < 1
                          ? { duration: 0.45, repeat: Infinity, ease: "easeInOut" }
                          : springSoft
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--ring)] text-[var(--primary-fg)] shadow-[0_0_20px_color-mix(in_srgb,var(--ring)_40%,transparent)] sm:h-10 sm:w-10"
                    >
                      <span className="font-display text-sm font-extrabold tabular-nums sm:text-base">
                        {Math.round(progress * 100)}
                      </span>
                    </motion.div>
                  </motion.div>
                </div>

                <div className="flex shrink-0 items-center gap-1.5 rounded-lg border border-[var(--border-strong)] bg-[var(--bg-card)] px-2 py-1.5">
                  <Flag className="h-3.5 w-3.5 text-[var(--ring)]" strokeWidth={2.5} />
                  <span className="text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[var(--fg-muted)]">
                    Finish
                  </span>
                </div>
              </div>
              <p className="relative mt-3 text-center text-xs text-[var(--fg-muted)] sm:text-sm">
                {startedAt
                  ? hasTypo
                    ? "Fix the red letters — accuracy counts"
                    : progress >= 1
                      ? "Done!"
                      : "Keep the rhythm — green means go"
                  : "Start typing to begin the race"}
              </p>
            </div>

            {/* Prompt */}
            <button
              type="button"
              onClick={() => inputRef.current?.focus()}
              className="w-full rounded-2xl border border-[var(--border)] bg-[var(--bg-card)] p-4 text-left outline-none transition hover:border-tone-16 focus-visible:ring-2 focus-visible:ring-[var(--ring)] sm:p-5 md:p-6"
              aria-label="Focus typing field"
            >
              <p className="mb-3 text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--fg-muted)]">
                Type this paragraph
              </p>
              <p className="font-display text-lg leading-[1.65] tracking-wide sm:text-xl md:text-2xl md:leading-[1.7]">
                {sentence.split("").map((ch, i) => {
                  const typed = i < input.length;
                  const isCaret = i === caretIndex;
                  const ok = typed && input[i] === ch;
                  const bad = typed && input[i] !== ch;

                  let color = "text-[var(--fg-muted)]/70";
                  if (ok) color = "text-[var(--ring)]";
                  if (bad) color = "text-[var(--accent-warm)]";
                  if (isCaret && !typed) color = "text-[var(--fg)]";

                  return (
                    <span
                      key={i}
                      className={`relative inline whitespace-pre-wrap ${color} ${
                        bad ? "rounded-sm bg-[color-mix(in_srgb,var(--accent-warm)_18%,transparent)]" : ""
                      } ${isCaret ? "rounded-sm bg-tone-10" : ""}`}
                    >
                      {ch === " " && bad ? "·" : ch}
                      {isCaret && (
                        <motion.span
                          aria-hidden
                          className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full bg-[var(--ring)]"
                          animate={{ opacity: [1, 0.15, 1] }}
                          transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                        />
                      )}
                    </span>
                  );
                })}
              </p>
            </button>

            {/* Input */}
            <div className="space-y-2">
              <label
                htmlFor="typing-race-input"
                className="block text-[0.65rem] font-semibold uppercase tracking-[0.2em] text-[var(--fg-muted)]"
              >
                Your keys
              </label>
              <input
                id="typing-race-input"
                ref={inputRef}
                autoFocus
                value={input}
                onPaste={(e) => e.preventDefault()}
                onChange={(e) => {
                  if (!startedAt) setStartedAt(Date.now());
                  setInput(e.target.value.slice(0, sentence.length));
                }}
                className={`w-full rounded-2xl border bg-[var(--bg-elevated)] px-4 py-3.5 font-mono text-base outline-none transition sm:px-5 sm:py-4 sm:text-lg ${
                  hasTypo
                    ? "border-[color-mix(in_srgb,var(--accent-warm)_55%,transparent)] ring-2 ring-[color-mix(in_srgb,var(--accent-warm)_35%,transparent)]"
                    : "border-[var(--border-strong)] focus:border-[color-mix(in_srgb,var(--ring)_55%,transparent)] focus:ring-2 focus:ring-[color-mix(in_srgb,var(--ring)_40%,transparent)]"
                }`}
                placeholder="Start typing here…"
                aria-label="Type the paragraph"
                autoComplete="off"
                autoCorrect="off"
                spellCheck={false}
              />
            </div>
          </div>
        );
      }}
    </GameShell>
  );
}

function Metric({
  icon,
  label,
  value,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  accent: "lime" | "warm" | "muted";
}) {
  const valueColor =
    accent === "lime"
      ? "text-[var(--ring)]"
      : accent === "warm"
        ? "text-[var(--accent-warm)]"
        : "text-[var(--fg)]";

  return (
    <div className="rounded-2xl border border-[var(--border)] bg-tone-3 px-2.5 py-3 sm:px-3.5 sm:py-3.5">
      <div className="mb-1.5 flex items-center gap-1.5 text-[var(--fg-muted)]">
        {icon}
        <span className="text-[0.65rem] font-semibold uppercase tracking-[0.16em]">{label}</span>
      </div>
      <motion.p
        key={value}
        initial={{ opacity: 0.55, y: 4 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.18 }}
        className={`font-display text-xl font-extrabold leading-none tabular-nums sm:text-2xl md:text-3xl ${valueColor}`}
      >
        {value}
      </motion.p>
    </div>
  );
}

function StatTile({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-[var(--border)] bg-tone-4 px-3 py-3 text-center sm:py-3.5">
      <p className="text-[0.65rem] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
        {label}
      </p>
      <p
        className={`mt-1 font-display text-2xl font-extrabold tabular-nums sm:text-3xl ${
          highlight ? "text-[var(--ring)]" : "text-[var(--fg)]"
        }`}
      >
        {value}
      </p>
    </div>
  );
}
