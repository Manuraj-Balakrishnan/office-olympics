"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { GameShell } from "../shared/GameShell";
import { ResultsScreen, type ResultRow } from "../shared/ResultsScreen";
import { useSound } from "@/hooks/useSound";
import type { PlayerOrTeam } from "@/types/tournament";

type Stage = "wait" | "go" | "too-soon" | "done";

export function ReactionTest() {
  const { play } = useSound();
  const [results, setResults] = useState<ResultRow[] | null>(null);
  const [current, setCurrent] = useState<PlayerOrTeam | null>(null);
  const [stage, setStage] = useState<Stage>("wait");
  const goAt = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedRef = useRef(false);
  const finishRef = useRef<(() => void) | null>(null);
  const participantRef = useRef<PlayerOrTeam | null>(null);
  const finalized = useRef(false);

  const falseStartTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const endWith = useCallback((score: number, detail: string, participant: PlayerOrTeam) => {
    if (finalized.current) return;
    finalized.current = true;
    setResults([{ participant, score, detail }]);
    finishRef.current?.();
  }, []);

  const startWait = useCallback(
    (participant: PlayerOrTeam) => {
      participantRef.current = participant;
      setCurrent(participant);
      setStage("wait");
      if (timer.current) clearTimeout(timer.current);
      if (falseStartTimer.current) clearTimeout(falseStartTimer.current);
      if (doneTimer.current) clearTimeout(doneTimer.current);
      const delay = 2000 + Math.random() * 3000;
      timer.current = setTimeout(() => {
        goAt.current = performance.now();
        setStage("go");
        play("go");
      }, delay);
    },
    [play],
  );

  const onTap = (e?: React.PointerEvent | React.KeyboardEvent) => {
    if (e && "button" in e && e.button !== 0) return;
    const participant = participantRef.current;
    if (!participant || finalized.current) return;
    if (stage === "wait") {
      if (timer.current) clearTimeout(timer.current);
      play("wrong");
      setStage("too-soon");
      falseStartTimer.current = setTimeout(
        () => endWith(1200, "False start (+penalty)", participant),
        800,
      );
      return;
    }
    if (stage === "go") {
      const ms = Math.max(1, Math.round(performance.now() - goAt.current));
      play("correct");
      setStage("done");
      doneTimer.current = setTimeout(() => endWith(ms, `${ms}ms`, participant), 500);
    }
  };

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
      if (falseStartTimer.current) clearTimeout(falseStartTimer.current);
      if (doneTimer.current) clearTimeout(doneTimer.current);
    },
    [],
  );

  return (
    <GameShell
      gameId="reaction"
      title="Reaction Time"
      durationSec={60}
      hideTimer
      results={
        results ? (
          <ResultsScreen
            gameId="reaction"
            title="Reaction Time"
            results={results}
            lowerIsBetter
          />
        ) : undefined
      }
    >
      {({ participants, phase, finish }) => {
        finishRef.current = finish;
        if (phase === "playing" && !startedRef.current && participants[0] && !results) {
          startedRef.current = true;
          queueMicrotask(() => startWait(participants[0]!));
        }
        if (results) return null;

        return (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault();
              onTap(e);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onTap(e);
              }
            }}
            className={`flex min-h-[min(60vh,520px)] w-full flex-1 flex-col items-center justify-center touch-manipulation transition-colors duration-200 ${
              stage === "go"
                ? "bg-emerald-500"
                : stage === "too-soon"
                  ? "bg-amber-500"
                  : "bg-red-600"
            }`}
          >
            <motion.div
              animate={stage === "wait" ? { scale: [1, 1.04, 1] } : { scale: 1 }}
              transition={{ repeat: Infinity, duration: 1.4 }}
              className="px-6 text-center"
            >
              <p className="mb-3 text-lg font-semibold text-white/80">
                {current?.emoji} {current?.name}
              </p>
              <p className="font-display text-4xl font-extrabold text-white sm:text-5xl md:text-7xl">
                {stage === "wait" && "Wait for it…"}
                {stage === "go" && "CLICK NOW!"}
                {stage === "too-soon" && "Too soon!"}
                {stage === "done" && "Nice!"}
              </p>
              {stage === "wait" && (
                <p className="mt-4 text-white/70">Don&apos;t click until green</p>
              )}
            </motion.div>
          </button>
        );
      }}
    </GameShell>
  );
}
