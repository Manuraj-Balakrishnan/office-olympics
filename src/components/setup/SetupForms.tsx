"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { DEFAULT_PLAYER_AVATAR, nextPlayerAvatar } from "@/data/playerAvatars";
import { DEFAULT_TEAM_EMBLEM, nextTeamEmblem, getTeamEmblem } from "@/data/teamEmblems";
import {
  AvatarPicker,
  PlayerAvatar,
  TeamEmblemPicker,
} from "@/components/PlayerAvatar";
import { useTournamentStore } from "@/store/useTournamentStore";
import { Trash2 } from "lucide-react";

export function ModeToggle() {
  const mode = useTournamentStore((s) => s.mode);
  const setMode = useTournamentStore((s) => s.setMode);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {(
        [
          ["individuals", "Individuals", "Solo glory — every player scores alone"],
          ["teams", "Teams", "Squad up with colors & emblem mascots"],
        ] as const
      ).map(([value, label, desc]) => (
        <motion.button
          key={value}
          type="button"
          whileHover={{ y: -2 }}
          whileTap={{ scale: 0.98 }}
          onClick={() => setMode(value)}
          className={`relative overflow-hidden rounded-2xl border p-4 text-left transition sm:p-5 ${
            mode === value
              ? "border-transparent gradient-primary text-[var(--primary-fg)] shadow-lg shadow-[color-mix(in_srgb,var(--primary-from)_35%,transparent)]"
              : "border-[var(--border)] bg-tone-5 hover:bg-tone-10"
          }`}
        >
          <p className="font-display text-lg font-bold sm:text-xl">{label}</p>
          <p className={`mt-1 text-sm ${mode === value ? "opacity-75" : "text-[var(--fg-muted)]"}`}>
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
  const [emblem, setEmblem] = useState(DEFAULT_TEAM_EMBLEM);

  const submitTeam = () => {
    if (!name.trim()) return;
    addTeam(name, emblem);
    setName("");
    setEmblem(nextTeamEmblem([...teams.map((t) => t.emoji), emblem]));
  };

  return (
    <div className="space-y-5">
      <h3 className="font-display text-xl font-bold">Create teams</h3>
      <div className="rounded-2xl border border-[var(--border)] bg-tone-4 p-4 sm:p-5">
        <TeamEmblemPicker value={emblem} onChange={setEmblem} />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Team name"
          className="flex-1 rounded-xl border border-[var(--border)] bg-tone-5 px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--ring)]"
          onKeyDown={(e) => {
            if (e.key === "Enter") submitTeam();
          }}
        />
        <button type="button" className="btn-primary sm:!px-4" onClick={submitTeam}>
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
              className="flex items-center justify-between rounded-xl bg-tone-5 px-4 py-3"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <PlayerAvatar
                  avatar={t.emoji}
                  name={t.name}
                  size="sm"
                  rounded="rounded-lg"
                  color={(getTeamEmblem(t.emoji)?.color ?? null) ?? t.color}
                />
                <span
                  className="truncate font-semibold"
                  style={{ color: (getTeamEmblem(t.emoji)?.color ?? null) ?? t.color }}
                >
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
  const [avatar, setAvatar] = useState(DEFAULT_PLAYER_AVATAR);

  const submitPlayer = () => {
    if (!name.trim()) return;
    addPlayer(
      name,
      mode === "teams" ? teamId || undefined : undefined,
      avatar,
    );
    setName("");
    const used = [...players.map((p) => p.emoji), avatar];
    setAvatar(nextPlayerAvatar(used));
  };

  return (
    <div className="space-y-5">
      <h3 className="font-display text-xl font-bold">Add players</h3>
      <div className="rounded-2xl border border-[var(--border)] bg-tone-4 p-4 sm:p-5">
        <AvatarPicker value={avatar} onChange={setAvatar} />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Player name"
          className="flex-1 rounded-xl border border-[var(--border)] bg-tone-5 px-4 py-3 outline-none focus:ring-2 focus:ring-[var(--ring)]"
          onKeyDown={(e) => {
            if (e.key === "Enter") submitPlayer();
          }}
        />
        {mode === "teams" && (
          <select
            value={teamId}
            onChange={(e) => setTeamId(e.target.value)}
            className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] px-4 py-3"
          >
            <option value="">No team</option>
            {teams.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        )}
        <button type="button" className="btn-primary" onClick={submitPlayer}>
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
            className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-tone-5 px-4 py-3"
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
              <PlayerAvatar avatar={p.emoji} name={p.name} size="sm" rounded="rounded-lg" />
              <span className="font-semibold">{p.name}</span>
            </div>
            <div className="flex items-center gap-2">
              {mode === "teams" && (
                <select
                  value={p.teamId ?? ""}
                  onChange={(e) =>
                    assignPlayerTeam(p.id, e.target.value || undefined)
                  }
                  className="rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-sm"
                >
                  <option value="">Unassigned</option>
                  {teams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
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
