"use client";

import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { ModeToggle, PlayerForm, TeamForm } from "@/components/setup/SetupForms";
import { useTournamentStore } from "@/store/useTournamentStore";
import { useSound } from "@/hooks/useSound";
import { PageEnter, PageItem } from "@/components/layout/PageEnter";

export default function SetupPage() {
  const router = useRouter();
  const mode = useTournamentStore((s) => s.mode);
  const players = useTournamentStore((s) => s.players);
  const teams = useTournamentStore((s) => s.teams);
  const settings = useTournamentStore((s) => s.settings);
  const updateSettings = useTournamentStore((s) => s.updateSettings);
  const beginTournament = useTournamentStore((s) => s.beginTournament);
  const { play } = useSound();

  const canStart =
    mode === "individuals"
      ? players.length >= 1
      : mode === "teams" && teams.length >= 2 && players.length >= 2;

  return (
    <PageEnter className="mx-auto w-full max-w-3xl space-y-10 px-4 py-10">
      <PageItem>
        <h1 className="font-display text-4xl font-extrabold md:text-5xl">
          Tournament Setup
        </h1>
        <p className="mt-2 text-[var(--fg-muted)]">
          Pass-the-phone mode on one device. Each game run scores the first player on the
          roster — for full simultaneous play, use Host tournament instead.
        </p>
      </PageItem>

      <PageItem className="space-y-4">
        <h2 className="font-display text-2xl font-bold">1. Mode</h2>
        <ModeToggle />
      </PageItem>

      {mode === "teams" && (
        <PageItem>
          <section className="card-surface">
            <TeamForm />
          </section>
        </PageItem>
      )}

      {mode && (
        <PageItem>
          <section className="card-surface">
            <PlayerForm />
          </section>
        </PageItem>
      )}

      {mode && (
        <PageItem>
          <section className="card-surface space-y-4">
            <h3 className="font-display text-xl font-bold">Game settings</h3>
            {mode === "teams" && (
              <label className="flex items-center justify-between gap-4">
                <span>
                  <span className="font-semibold">Team play style</span>
                  <span className="mt-0.5 block text-sm text-[var(--fg-muted)]">
                    One rep per round vs everyone plays
                  </span>
                </span>
                <select
                  value={settings.teamPlayMode}
                  onChange={(e) =>
                    updateSettings({
                      teamPlayMode: e.target.value as "everyone" | "one-rep",
                    })
                  }
                  className="rounded-xl border border-white/10 bg-[var(--bg-elevated)] px-3 py-2"
                >
                  <option value="one-rep">One Rep Per Round</option>
                  <option value="everyone">Everyone Plays</option>
                </select>
              </label>
            )}
            <label className="flex items-center justify-between gap-4">
              <span>
                <span className="font-semibold">Assist mode</span>
                <span className="mt-0.5 block text-sm text-[var(--fg-muted)]">
                  Extra text labels for color-blind accessibility
                </span>
              </span>
              <input
                type="checkbox"
                checked={settings.assistMode}
                onChange={(e) => updateSettings({ assistMode: e.target.checked })}
                className="h-5 w-5 accent-[var(--ring)]"
              />
            </label>
            {mode === "teams" && (
              <label className="flex items-center justify-between gap-4">
                <span>
                  <span className="font-semibold">Team huddle timer</span>
                  <span className="mt-0.5 block text-sm text-[var(--fg-muted)]">
                    10s strategize before memory games
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.huddleEnabled}
                  onChange={(e) => updateSettings({ huddleEnabled: e.target.checked })}
                  className="h-5 w-5 accent-[var(--ring)]"
                />
              </label>
            )}
          </section>
        </PageItem>
      )}

      <PageItem>
        <motion.button
          type="button"
          disabled={!canStart}
          whileHover={canStart ? { scale: 1.02 } : undefined}
          whileTap={canStart ? { scale: 0.98 } : undefined}
          className="btn-primary w-full text-xl disabled:cursor-not-allowed disabled:opacity-40"
          onClick={() => {
            play("fanfare");
            beginTournament();
            router.push("/dashboard");
          }}
        >
          Begin Olympics
        </motion.button>
        {!canStart && mode && (
          <p className="mt-3 text-center text-sm text-[var(--fg-muted)]">
            {mode === "teams"
              ? "Need at least 2 teams and 2 players."
              : "Add at least one player."}
          </p>
        )}
      </PageItem>
    </PageEnter>
  );
}
