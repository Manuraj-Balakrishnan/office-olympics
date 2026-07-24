"use client";

import { motion } from "framer-motion";
import confetti from "canvas-confetti";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlayerOrTeam } from "@/types/tournament";
import type { GameId } from "@/types/tournament";
import { useTournamentStore } from "@/store/useTournamentStore";
import { useSound } from "@/hooks/useSound";
import { useSessionPlay } from "@/hooks/SessionPlayContext";
import { loadIdentity, submitPlayerScore } from "@/hooks/useSession";
import { normalizeToThousand } from "@/lib/normalizeScore";

export interface ResultRow {
  participant: PlayerOrTeam;
  score: number;
  detail?: string;
}

export function ResultsScreen({
  gameId,
  title,
  results,
  lowerIsBetter,
}: {
  gameId: GameId;
  title: string;
  results: ResultRow[];
  lowerIsBetter?: boolean;
}) {
  const router = useRouter();
  const addScores = useTournamentStore((s) => s.addScores);
  const markGamePlayed = useTournamentStore((s) => s.markGamePlayed);
  const sessionPlay = useSessionPlay();
  const { play } = useSound();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const submittedRef = useRef(false);
  const inflightRef = useRef(false);

  const sorted = [...results].sort((a, b) =>
    lowerIsBetter ? a.score - b.score : b.score - a.score,
  );
  const max = Math.max(
    ...sorted.map((r) => (lowerIsBetter ? 1 / Math.max(r.score, 1) : r.score)),
    1,
  );

  const mine = sessionPlay
    ? sorted.find((r) => r.participant.id === sessionPlay.playerId)
    : undefined;

  useEffect(() => {
    play("complete");
    void confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.65 },
      colors: ["#0085C7", "#F4C300", "#DF0024", "#009F3D"],
    });
  }, [play]);

  useEffect(() => {
    sessionPlay?.markResultsOpen();
  }, [sessionPlay]);

  const postSessionScore = useCallback(
    async (opts?: { keepalive?: boolean }) => {
      if (!sessionPlay || !mine) return false;
      const token = loadIdentity(sessionPlay.sessionId)?.playerToken;
      const detail =
        mine.detail ?? (lowerIsBetter ? `${mine.score}ms` : String(mine.score));

      if (opts?.keepalive) {
        const body = JSON.stringify({
          action: "score",
          playerId: sessionPlay.playerId,
          gameId: sessionPlay.gameId,
          rawScore: mine.score,
          detail,
          lowerIsBetter,
          playerToken: token,
        });
        try {
          void fetch(`/api/sessions/${sessionPlay.sessionId}`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              ...(token ? { "x-player-token": token } : {}),
            },
            body,
            keepalive: true,
          });
          return true;
        } catch {
          return false;
        }
      }

      await submitPlayerScore(
        sessionPlay.sessionId,
        sessionPlay.playerId,
        sessionPlay.gameId,
        mine.score,
        detail,
        lowerIsBetter,
      );
      return true;
    },
    [sessionPlay, mine, lowerIsBetter],
  );

  const commit = useCallback(async () => {
    if (busy || submittedRef.current || inflightRef.current) return;
    play("click");
    setBusy(true);
    setErr(null);
    inflightRef.current = true;

    if (sessionPlay) {
      if (!mine) {
        setErr("Could not find your score to submit");
        setBusy(false);
        inflightRef.current = false;
        return;
      }
      try {
        await postSessionScore();
        submittedRef.current = true;
        setSubmitted(true);
        sessionPlay.markScoreLocked();
        setBusy(false);
        inflightRef.current = false;
        setTimeout(() => router.replace(`/play/${sessionPlay.sessionId}`), 700);
      } catch (e) {
        setErr(e instanceof Error ? e.message : "Submit failed");
        setBusy(false);
        inflightRef.current = false;
      }
      return;
    }

    addScores(
      sorted.map((r) => {
        const points = lowerIsBetter
          ? normalizeToThousand(gameId, r.score, { lowerIsBetter: true })
          : normalizeToThousand(gameId, r.score);
        return {
          participantId: r.participant.id,
          playerId: r.participant.id,
          gameId,
          score: points,
          rawScore: r.score,
          lowerIsBetter,
          detail: r.detail ?? (lowerIsBetter ? `${r.score}ms` : String(r.score)),
        };
      }),
    );
    markGamePlayed(gameId);
    setBusy(false);
    inflightRef.current = false;
    router.push("/leaderboard");
  }, [
    busy,
    play,
    sessionPlay,
    mine,
    postSessionScore,
    router,
    addScores,
    sorted,
    lowerIsBetter,
    gameId,
    markGamePlayed,
  ]);

  // Session mode: submit as soon as results appear (Strict Mode safe — no sticky "started" flag)
  useEffect(() => {
    if (!sessionPlay || sorted.length === 0 || submittedRef.current) return;
    let alive = true;
    const t = window.setTimeout(() => {
      if (alive) void commit();
    }, 350);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionPlay, sorted.length]);

  // If host advances / page unmounts mid-submit, still push the score
  useEffect(() => {
    if (!sessionPlay || !mine) return;
    return () => {
      if (submittedRef.current || inflightRef.current) return;
      void postSessionScore({ keepalive: true });
      sessionPlay.markScoreLocked();
    };
  }, [sessionPlay, mine, postSessionScore]);

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-4 py-8">
      <div className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-muted)]">
          {submitted ? "Score submitted" : "Results"}
        </p>
        <h2 className="mt-2 font-display text-4xl font-extrabold md:text-5xl">{title}</h2>
        {sessionPlay && !submitted && (
          <p className="mt-2 text-sm text-[var(--fg-muted)]">
            Sending your score to the host board…
          </p>
        )}
        {submitted && (
          <p className="mt-2 text-sm text-emerald-400">Score locked in — returning to lobby…</p>
        )}
      </div>

      <div className="space-y-4">
        {sorted.map((r, i) => {
          const barValue = lowerIsBetter ? 1 / Math.max(r.score, 1) : r.score;
          const width = Math.max(8, (barValue / max) * 100);
          const preview = normalizeToThousand(gameId, r.score, { lowerIsBetter });
          return (
            <div key={r.participant.id} className="card-surface !p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <span className="font-display text-xl font-bold text-[var(--fg-muted)]">
                    #{i + 1}
                  </span>
                  <span className="text-2xl">{r.participant.emoji}</span>
                  <span className="font-display text-lg font-bold">{r.participant.name}</span>
                </div>
                <span
                  className="font-display text-xl font-extrabold"
                  style={{ color: r.participant.color }}
                >
                  {lowerIsBetter ? `${r.score}ms` : r.score}
                  <span className="ml-2 text-sm font-medium text-[var(--fg-muted)]">
                    → {preview}/1000
                  </span>
                </span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: r.participant.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${width}%` }}
                  transition={{ type: "spring", stiffness: 120, damping: 18, delay: i * 0.08 }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {sessionPlay && !submitted && (
        <div className="space-y-3 text-center">
          {err && <p className="text-red-400">{err}</p>}
          <button
            type="button"
            className="btn-primary mx-auto w-full max-w-md text-xl disabled:opacity-50"
            disabled={busy}
            onClick={() => void commit()}
          >
            {busy ? "Submitting…" : err ? "Retry submit" : "Submit score"}
          </button>
        </div>
      )}

      {!sessionPlay && (
        <button
          type="button"
          className="btn-primary mx-auto w-full max-w-md text-xl disabled:opacity-50"
          disabled={busy}
          onClick={() => void commit()}
        >
          {busy ? "Submitting…" : "Add to Leaderboard"}
        </button>
      )}
    </div>
  );
}
