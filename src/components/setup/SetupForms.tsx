"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { TEAM_EMOJIS } from "@/data/games";
import { useTournamentStore } from "@/store/useTournamentStore";
import { Trash2 } from "lucide-react";

export function ModeToggle() {
  const mode = useTournamentStore((s) => s.mode);
  const setMode = useTournamentStore((s) => s.setMode);

  return (
    <div className="grid grid-cols-2 gap-3">
      {(
        [
          ["individuals", "Individuals", "Solo glory — every player scores alone"],
          ["teams", "Teams", "Squad up with colors & emoji mascots"],
        ] as const
      ).map(([value, label, desc]) => (
        <motion.button
          key={value}
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setMode(value)}
          className={`relative overflow-hidden rounded-2xl border p-5 text-left transition ${
            mode === value
              ? "border-transparent gradient-primary text-white shadow-lg shadow-teal-500/25"
              : "border-white/10 bg-white/5 hover:bg-white/10"
          }`}
        >
          <p className="font-display text-xl font-bold">{label}</p>
          <p className={`mt-1 text-sm ${mode === value ? "text-white/80" : "text-[var(--fg-muted)]"}`}>
            {desc}
          </p>
        </motion.button>
      ))}
    </div>
  );
}

export function TeamForm() {
  const teams = useTournamentStore((s) => s.teams);
  const addTeam = useTournamentStore((s) => s.addTeam);
  const removeTeam = useTournamentStore((s) => s.removeTeam);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState(TEAM_EMOJIS[0]!);

  return (
    <div className="space-y-4">
      <h3 className="font-display text-xl font-bold">Create teams</h3>
      <div className="flex flex-wrap gap-2">
        {TEAM_EMOJIS.map((e) => (
          <button
            key={e}
            type="button"
            onClick={() => setEmoji(e)}
            className={`rounded-xl px-3 py-2 text-2xl transition ${
              emoji === e ? "bg-white/20 ring-2 ring-[var(--ring)]" : "bg-white/5 hover:bg-white/10"
            }`}
          >
            {e}
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Team name"
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--ring)]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              addTeam(name, emoji);
              setName("");
            }
          }}
        />
        <button
          type="button"
          className="btn-primary !px-4"
          onClick={() => {
            addTeam(name, emoji);
            setName("");
          }}
        >
          Add
        </button>
      </div>
      <ul className="space-y-2">
        <AnimatePresence initial={false}>
          {teams.map((t) => (
            <motion.li
              key={t.id}
              layout
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 12 }}
              className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3"
            >
              <span>
                <span className="mr-2 text-xl">{t.emoji}</span>
                <span className="font-semibold" style={{ color: t.color }}>
                  {t.name}
                </span>
              </span>
              <button type="button" aria-label="Remove team" onClick={() => removeTeam(t.id)}>
                <Trash2 className="h-4 w-4 text-[var(--fg-muted)]" />
              </button>
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>
    </div>
  );
}

export function PlayerForm() {
  const mode = useTournamentStore((s) => s.mode);
  const players = useTournamentStore((s) => s.players);
  const teams = useTournamentStore((s) => s.teams);
  const addPlayer = useTournamentStore((s) => s.addPlayer);
  const removePlayer = useTournamentStore((s) => s.removePlayer);
  const assignPlayerTeam = useTournamentStore((s) => s.assignPlayerTeam);
  const reorderPlayers = useTournamentStore((s) => s.reorderPlayers);
  const [name, setName] = useState("");
  const [teamId, setTeamId] = useState<string>("");

  return (
    <div className="space-y-4">
      <h3 className="font-display text-xl font-bold">Add players</h3>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Player name"
          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--ring)]"
          onKeyDown={(e) => {
            if (e.key === "Enter" && name.trim()) {
              addPlayer(name, mode === "teams" ? teamId || undefined : undefined);
              setName("");
            }
          }}
        />
        {mode === "teams" && (
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="rounded-xl border border-white/10 bg-[var(--bg-elevated)] px-4 py-3"
          >
            <option value="">No team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.emoji} {t.name}
              </option>
            ))}
          </select>
        )}
        <button
          type="button"
          className="btn-primary"
          onClick={() => {
            addPlayer(name, mode === "teams" ? teamId || undefined : undefined);
            setName("");
          }}
        >
          Add
        </button>
      </div>
      <ul className="space-y-2">
        {players.map((p, i) => (
          <motion.li
            key={p.id}
            layout
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-white/5 px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="text-xs text-[var(--fg-muted)]"
                disabled={i === 0}
                onClick={() => reorderPlayers(i, i - 1)}
              >
                ↑
              </button>
              <button
                type="button"
                className="text-xs text-[var(--fg-muted)]"
                disabled={i === players.length - 1}
                onClick={() => reorderPlayers(i, i + 1)}
              >
                ↓
              </button>
              <span className="font-semibold">{p.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {mode === "teams" && (
                <select
                  value={p.teamId ?? ""}
                  onChange={(e) =>
                    assignPlayerTeam(p.id, e.target.value || undefined)
                  }
                  className="rounded-lg border border-white/10 bg-[var(--bg-elevated)] px-2 py-1 text-sm"
                >
                  <option value="">Unassigned</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.emoji} {t.name}
                    </option>
                  ))}
                </select>
              )}
              <button type="button" aria-label="Remove player" onClick={() => removePlayer(p.id)}>
                <Trash2 className="h-4 w-4 text-[var(--fg-muted)]" />
              </button>
            </div>
          </motion.li>
        ))}
      </ul>
    </div>
  );
}
