"use client";

import {
  motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
  animate,
} from "framer-motion";
import confetti from "canvas-confetti";
import { ArrowRight, CheckCircle2, Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { PlayerOrTeam } from "@/types/tournament";
import type { GameId } from "@/types/tournament";
import { useTournamentStore } from "@/store/useTournamentStore";
import { useSound } from "@/hooks/useSound";
import { useSessionPlay } from "@/hooks/SessionPlayContext";
import { loadIdentity, submitPlayerScore } from "@/hooks/useSession";
import { normalizeToThousand } from "@/lib/normalizeScore";
import { PlayerAvatar } from "@/components/PlayerAvatar";

export interface ResultRow {
  participant: PlayerOrTeam;
  score: number;
  detail?: string;
}

const MEDAL = ["🥇", "🥈", "🥉"] as const;
const CONFETTI = ["#b8e62e", "#d4ff4f", "#5b8def", "#ff8f5c", "#f4f6f8"];

function ratingFor(points: number): { label: string; tone: string } {
  if (points >= 850) return { label: "Elite run", tone: "text-[var(--primary-from)]" };
  if (points >= 650) return { label: "Strong run", tone: "text-[var(--accent-soft)]" };
  if (points >= 400) return { label: "Solid run", tone: "text-[var(--fg)]" };
  if (points >= 200) return { label: "Nice try", tone: "text-[var(--fg)]" };
  return { label: "Warm-up", tone: "text-[var(--fg-muted)]" };
}

function parseStat(raw: string): { value: string; label?: string } {
  const s = raw.trim();
  const leadWord = s.match(/^([A-Za-z]+)\s+(.+)$/);
  if (leadWord) return { label: leadWord[1], value: leadWord[2]! };
  const leadNum = s.match(/^([\d./]+%?)\s+(.+)$/);
  if (leadNum) return { value: leadNum[1]!, label: leadNum[2] };
  const times = s.match(/^(.+?)\s*[×x]\s*(\d+)$/i);
  if (times) return { label: times[1]!.trim(), value: `×${times[2]}` };
  return { value: s };
}

function AnimatedScore({
  value,
  color,
  onComplete,
}: {
  value: number;
  color: string;
  onComplete?: () => void;
}) {
  const reduceMotion = useReducedMotion();
  const mv = useMotionValue(0);
  const display = useTransform(mv, (v) => Math.round(v));
  const [text, setText] = useState("0");
  const done = useRef(false);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    done.current = false;
    if (reduceMotion) {
      mv.set(value);
      setText(String(value));
      onCompleteRef.current?.();
      return;
    }
    mv.set(0);
    const controls = animate(mv, value, {
      duration: 1.15,
      ease: [0.16, 1, 0.3, 1],
      onComplete: () => {
        if (!done.current) {
          done.current = true;
          onCompleteRef.current?.();
        }
      },
    });
    return () => controls.stop();
  }, [value, mv, reduceMotion]);

  useEffect(() => {
    const unsub = display.on("change", (v) => setText(String(v)));
    return unsub;
  }, [display]);

  return (
    <motion.span
      className="inline-block font-display text-5xl font-extrabold tabular-nums leading-none tracking-tight sm:text-6xl"
      style={{ color }}
      initial={reduceMotion ? false : { scale: 0.55, opacity: 0, y: 18 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 260, damping: 16, delay: 0.28 }}
    >
      {text}
    </motion.span>
  );
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
  const reduceMotion = useReducedMotion();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [scoreReady, setScoreReady] = useState(false);
  const submittedRef = useRef(false);
  const inflightRef = useRef(false);
  const celebrated = useRef(false);

  const sorted = [...results].sort((a, b) =>
    lowerIsBetter ? a.score - b.score : b.score - a.score,
  );

  const mine = sessionPlay
    ? sorted.find((r) => r.participant.id === sessionPlay.playerId)
    : undefined;

  const focus = mine ?? sorted[0];
  const focusPoints = focus
    ? normalizeToThousand(gameId, focus.score, { lowerIsBetter })
    : 0;
  const rating = ratingFor(focusPoints);
  const multi = sorted.length > 1;
  const barPct = Math.max(3, Math.min(100, (focusPoints / 1000) * 100));

  const stats: { value: string; label?: string }[] = (() => {
    if (!focus) return [];
    const parts = (focus.detail ?? "")
      .split("·")
      .map((s) => s.trim())
      .filter(Boolean)
      .map(parseStat);
    if (parts.length > 0) return parts.slice(0, 4);
    return [
      {
        value: lowerIsBetter ? `${focus.score}ms` : String(focus.score),
        label: lowerIsBetter ? "time" : "score",
      },
    ];
  })();

  const statCols =
    stats.length <= 1
      ? "grid-cols-1"
      : stats.length === 2 || stats.length === 4
        ? "grid-cols-2"
        : "grid-cols-3";

  const fireConfetti = useCallback(() => {
    if (reduceMotion || celebrated.current) return;
    celebrated.current = true;
    void confetti({
      particleCount: 55,
      spread: 62,
      startVelocity: 28,
      origin: { y: 0.55 },
      colors: CONFETTI,
    });
    window.setTimeout(() => {
      void confetti({
        particleCount: 40,
        angle: 60,
        spread: 48,
        origin: { x: 0.15, y: 0.7 },
        colors: CONFETTI,
      });
      void confetti({
        particleCount: 40,
        angle: 120,
        spread: 48,
        origin: { x: 0.85, y: 0.7 },
        colors: CONFETTI,
      });
    }, 220);
  }, [reduceMotion]);

  const onScoreComplete = useCallback(() => {
    setScoreReady(true);
    fireConfetti();
  }, [fireConfetti]);

  useEffect(() => {
    play("complete");
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

  useEffect(() => {
    if (!sessionPlay || !mine) return;
    return () => {
      if (submittedRef.current || inflightRef.current) return;
      void postSessionScore({ keepalive: true });
    };
  }, [sessionPlay, mine, postSessionScore]);

  return (
    <div className="relative mx-auto flex w-full max-w-md flex-col justify-center px-4 py-5 sm:max-w-lg sm:py-6">
      {focus && !reduceMotion && (
        <motion.div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-4 h-48 w-48 -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background: `radial-gradient(circle, ${focus.participant.color}, transparent 68%)`,
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.22 }}
          transition={{ duration: 0.5 }}
        />
      )}

      <div className="relative flex flex-col gap-3.5">
        {/* Header */}
        <header className="space-y-1 text-center">
          <motion.p
            className={`font-display text-xs font-bold uppercase tracking-[0.18em] ${rating.tone}`}
            initial={reduceMotion ? false : { opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          >
            {rating.label}
          </motion.p>
          <motion.h2
            className="font-display text-xl font-extrabold tracking-tight sm:text-2xl"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05, ease: [0.22, 1, 0.36, 1] }}
          >
            {title}
          </motion.h2>
          {sessionPlay && !submitted && (
            <motion.p
              className="flex items-center justify-center gap-1.5 text-sm text-[var(--fg-muted)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              Sending to host…
            </motion.p>
          )}
          {submitted && (
            <motion.p
              className="flex items-center justify-center gap-1.5 text-sm text-[var(--primary-from)]"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              Locked — back to lobby…
            </motion.p>
          )}
        </header>

        {/* Score card */}
        {focus && (
          <motion.section
            className="overflow-hidden rounded-[1.5rem] border border-[var(--border)] bg-[color-mix(in_srgb,var(--bg-elevated)_94%,transparent)] shadow-[0_20px_40px_-28px_rgb(0_0_0_/_0.5)]"
            initial={reduceMotion ? false : { opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 240, damping: 24, delay: 0.08 }}
          >
            {/* Player — static, no animation */}
            <div className="flex flex-col items-center gap-1.5 border-b border-[var(--border)] px-5 pb-4 pt-5 sm:px-6">
              <div
                className="flex items-center justify-center rounded-full"
                style={{
                  background: `color-mix(in srgb, ${focus.participant.color} 18%, transparent)`,
                  boxShadow: `0 0 0 2px color-mix(in srgb, ${focus.participant.color} 45%, transparent)`,
                }}
              >
                <PlayerAvatar
                  avatar={focus.participant.emoji}
                  name={focus.participant.name}
                  size="xl"
                  rounded="rounded-full"
                  color={focus.participant.color}
                />
              </div>
              <p className="font-display text-base font-bold sm:text-lg">
                {focus.participant.name}
              </p>
            </div>

            {/* Score */}
            <div className="flex flex-col items-center gap-2 px-5 py-5 sm:px-6">
              <div className="flex items-end justify-center gap-1">
                <AnimatedScore
                  value={focusPoints}
                  color={focus.participant.color}
                  onComplete={onScoreComplete}
                />
                <motion.span
                  className="mb-1 text-sm font-semibold text-[var(--fg-muted)]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  /1000
                </motion.span>
              </div>

              <motion.p
                className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--fg-muted)]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
              >
                Leaderboard points
              </motion.p>

              <div className="relative mt-0.5 h-2 w-full max-w-[12rem] overflow-hidden rounded-full bg-tone-8">
                <motion.div
                  className="relative h-full overflow-hidden rounded-full"
                  style={{
                    background: `linear-gradient(90deg, ${focus.participant.color}, color-mix(in srgb, ${focus.participant.color} 55%, #d4ff4f))`,
                  }}
                  initial={{ width: 0 }}
                  animate={{ width: scoreReady || reduceMotion ? `${barPct}%` : "0%" }}
                  transition={
                    reduceMotion
                      ? { duration: 0 }
                      : { type: "spring", stiffness: 90, damping: 18 }
                  }
                >
                  {!reduceMotion && scoreReady && (
                    <motion.div
                      aria-hidden
                      className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                      initial={{ x: "-100%" }}
                      animate={{ x: "320%" }}
                      transition={{ duration: 1.1, ease: "easeInOut", delay: 0.1 }}
                    />
                  )}
                </motion.div>
              </div>
            </div>

            {/* Stats */}
            {stats.length > 0 && (
              <div
                className={`grid border-t border-[var(--border)] bg-[color-mix(in_srgb,var(--bg)_35%,transparent)] ${statCols}`}
              >
                {stats.map((stat, i) => (
                  <motion.div
                    key={`${stat.label ?? ""}-${stat.value}-${i}`}
                    className={`flex min-h-[3.5rem] flex-col items-center justify-center gap-0.5 px-2.5 py-3 text-center ${
                      i > 0 ? "border-l border-[var(--border)]" : ""
                    } ${stats.length === 4 && i >= 2 ? "border-t border-[var(--border)]" : ""}`}
                    initial={reduceMotion ? false : { opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      delay: reduceMotion ? 0 : 0.75 + i * 0.06,
                      type: "spring",
                      stiffness: 280,
                      damping: 22,
                    }}
                  >
                    <p className="font-display text-sm font-extrabold tabular-nums leading-none sm:text-base">
                      {stat.value}
                    </p>
                    {stat.label && (
                      <p className="text-[10px] font-medium capitalize tracking-wide text-[var(--fg-muted)]">
                        {stat.label}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.section>
        )}

        {/* Multi standings */}
        {multi && (
          <motion.ol
            className="overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.35 }}
          >
            {sorted.map((r, i) => {
              const points = normalizeToThousand(gameId, r.score, { lowerIsBetter });
              const isFocus = focus?.participant.id === r.participant.id;
              return (
                <motion.li
                  key={r.participant.id}
                  className={`grid grid-cols-[2rem_1.75rem_minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-2.5 ${
                    i > 0 ? "border-t border-[var(--border)]" : ""
                  } ${
                    isFocus
                      ? "bg-[color-mix(in_srgb,var(--primary-from)_10%,transparent)]"
                      : ""
                  }`}
                  initial={reduceMotion ? false : { opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.95 + i * 0.05 }}
                >
                  <span className="text-center text-sm">
                    {i < 3 ? MEDAL[i] : <span className="text-[var(--fg-muted)]">#{i + 1}</span>}
                  </span>
                  <PlayerAvatar
                    avatar={r.participant.emoji}
                    name={r.participant.name}
                    size="sm"
                    rounded="rounded-lg"
                    className="justify-self-center"
                    color={r.participant.color}
                  />
                  <p className="truncate font-display text-sm font-bold">{r.participant.name}</p>
                  <p
                    className="font-display text-base font-extrabold tabular-nums"
                    style={{ color: r.participant.color }}
                  >
                    {points}
                  </p>
                </motion.li>
              );
            })}
          </motion.ol>
        )}

        {/* CTA */}
        {sessionPlay && !submitted && (
          <motion.div
            className="space-y-2"
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, type: "spring", stiffness: 240, damping: 22 }}
          >
            {err && <p className="text-center text-sm text-red-400">{err}</p>}
            <motion.button
              type="button"
              className="btn-primary w-full disabled:opacity-50"
              disabled={busy}
              onClick={() => void commit()}
              whileHover={busy ? undefined : { scale: 1.02 }}
              whileTap={busy ? undefined : { scale: 0.98 }}
            >
              {busy ? "Submitting…" : err ? "Retry submit" : "Submit score"}
              {!busy && !err && <ArrowRight className="h-4 w-4" />}
            </motion.button>
          </motion.div>
        )}

        {!sessionPlay && (
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, type: "spring", stiffness: 240, damping: 22 }}
          >
            <motion.button
              type="button"
              className="btn-primary w-full disabled:opacity-50"
              disabled={busy}
              onClick={() => void commit()}
              whileHover={busy ? undefined : { scale: 1.02 }}
              whileTap={busy ? undefined : { scale: 0.98 }}
            >
              {busy ? "Submitting…" : "Add to Leaderboard"}
              {!busy && <ArrowRight className="h-4 w-4" />}
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
