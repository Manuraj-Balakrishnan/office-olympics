"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { TEAM_EMOJIS } from "@/data/games";
import { saveIdentity } from "@/hooks/useSession";
import type { TournamentSession } from "@/types/tournament";
import { PageEnter, PageItem } from "@/components/layout/PageEnter";
import { LoadingPulse } from "@/components/layout/LoadingPulse";

export default function JoinWithCodePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const [preview, setPreview] = useState<Omit<TournamentSession, "hostToken"> | null>(null);
  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState("");
  const [createTeam, setCreateTeam] = useState(false);
  const [newTeamName, setNewTeamName] = useState("");
  const [emoji, setEmoji] = useState(TEAM_EMOJIS[0]!);
  const [asIndividual, setAsIndividual] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void (async () => {
      const res = await fetch(`/api/sessions/join?code=${encodeURIComponent(code)}`);
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Not found");
        return;
      }
      setPreview(json.session);
      if (json.session.teams[0]) setTeamId(json.session.teams[0].id);
    })();
  }, [code]);

  const join = async () => {
    setBusy(true);
    setError(null);
    try {
      if (preview?.mode === "teams" && !createTeam && !asIndividual && !teamId) {
        throw new Error("Select a team or create one");
      }
      if (preview?.mode === "teams" && createTeam && !newTeamName.trim() && !name.trim()) {
        throw new Error("Enter a team name");
      }
      const res = await fetch("/api/sessions/join", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          name,
          teamId: createTeam || asIndividual ? undefined : teamId || undefined,
          createTeam:
            createTeam && preview?.mode === "teams"
              ? { name: newTeamName.trim() || `${name.trim()}'s Team`, emoji }
              : undefined,
          asIndividual: preview?.mode === "individuals" || asIndividual,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Join failed");
      saveIdentity({
        sessionId: json.session.id,
        playerId: json.player.id,
        playerToken: json.player.playerToken,
        role: "player",
      });
      router.push(`/play/${json.session.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  if (error && !preview) {
    return (
      <PageEnter className="mx-auto max-w-md space-y-4 p-10 text-center">
        <PageItem>
          <p className="font-display text-2xl font-bold text-red-400">{error}</p>
        </PageItem>
        <PageItem>
          <Link href="/join" className="btn-primary inline-flex">
            Try another code
          </Link>
        </PageItem>
      </PageEnter>
    );
  }

  if (!preview) {
    return <LoadingPulse label={`Looking up ${code}…`} />;
  }

  return (
    <PageEnter className="mx-auto w-full max-w-md space-y-6 px-4 py-10">
      <PageItem className="text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-[var(--fg-muted)]">
          Joining
        </p>
        <motion.h1
          className="font-display text-4xl font-extrabold text-gradient"
          animate={{ backgroundPosition: ["0% center", "100% center", "0% center"] }}
          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        >
          {preview.joinCode}
        </motion.h1>
        <p className="mt-2 text-[var(--fg-muted)]">
          {preview.mode === "teams" ? "Team tournament" : "Individual tournament"} · Host-paced
        </p>
      </PageItem>

      <PageItem>
        <label className="block space-y-2">
          <span className="text-sm font-semibold">Your name</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="input-field"
            placeholder="Alex"
            autoFocus
          />
        </label>
      </PageItem>

      {preview.mode === "teams" && (
        <PageItem>
          <div className="card-surface space-y-4 !p-4">
            <p className="font-display font-bold">Team</p>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={!createTeam && !asIndividual}
                onChange={() => {
                  setCreateTeam(false);
                  setAsIndividual(false);
                }}
              />
              Join existing team
            </label>
            {!createTeam && !asIndividual && (
              <select
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-[var(--bg-elevated)] px-3 py-2"
              >
                <option value="">Select a team…</option>
                {preview.teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.emoji} {t.name}
                  </option>
                ))}
              </select>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={createTeam}
                onChange={() => {
                  setCreateTeam(true);
                  setAsIndividual(false);
                }}
              />
              Create a new team
            </label>
            {createTeam && (
              <div className="space-y-2">
                <input
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Team name"
                  className="input-field !rounded-xl"
                />
                <div className="flex flex-wrap gap-1">
                  {TEAM_EMOJIS.map((e) => (
                    <motion.button
                      key={e}
                      type="button"
                      whileTap={{ scale: 0.9 }}
                      className={`rounded-lg px-2 py-1 text-xl transition ${emoji === e ? "bg-white/20 ring-2 ring-[var(--ring)]" : "bg-white/5"}`}
                      onClick={() => setEmoji(e)}
                    >
                      {e}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                checked={asIndividual}
                onChange={() => {
                  setAsIndividual(true);
                  setCreateTeam(false);
                }}
              />
              Play without a team (solo name on roster)
            </label>
          </div>
        </PageItem>
      )}

      {error && (
        <PageItem>
          <p className="text-center text-sm text-red-400">{error}</p>
        </PageItem>
      )}

      <PageItem>
        <button
          type="button"
          className="btn-primary w-full text-xl disabled:opacity-40"
          disabled={
            busy ||
            !name.trim() ||
            (preview.mode === "teams" && !createTeam && !asIndividual && !teamId)
          }
          onClick={() => void join()}
        >
          {busy ? "Joining…" : "Enter lobby"}
        </button>
      </PageItem>
    </PageEnter>
  );
}
