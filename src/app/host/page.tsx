"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Users } from "lucide-react";
import { saveIdentity } from "@/hooks/useSession";
import type { TournamentMode } from "@/types/tournament";
import { PageEnter, PageItem } from "@/components/layout/PageEnter";

export default function HostCreatePage() {
  const router = useRouter();
  const [mode, setMode] = useState<TournamentMode>("individuals");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = async () => {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          pacing: "host",
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Create failed");
      saveIdentity({
        sessionId: json.session.id,
        hostToken: json.hostToken,
        role: "host",
      });
      router.push(`/host/${json.session.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <PageEnter className="mx-auto w-full max-w-2xl space-y-8 px-4 py-10">
      <PageItem>
        <Link href="/" className="btn-secondary inline-flex !py-2 text-sm">
          <ArrowLeft className="h-4 w-4" /> Home
        </Link>
      </PageItem>

      <PageItem>
        <h1 className="font-display text-4xl font-extrabold md:text-5xl">
          Host a tournament
        </h1>
        <p className="mt-2 text-[var(--fg-muted)]">
          Games run in order. Everyone plays each round at the same time — you control the
          pace.
        </p>
      </PageItem>

      <PageItem>
        <section className="card-surface space-y-4">
          <h2 className="font-display text-xl font-bold">Competition mode</h2>
          <div className="grid grid-cols-2 gap-3">
            {(
              [
                ["individuals", "Individuals"],
                ["teams", "Teams"],
              ] as const
            ).map(([value, label]) => (
              <motion.button
                key={value}
                type="button"
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setMode(value)}
                className={`rounded-2xl border p-4 text-left transition ${
                  mode === value
                    ? "border-transparent gradient-primary text-[var(--primary-fg)] shadow-lg shadow-[color-mix(in_srgb,var(--primary-from)_35%,transparent)]"
                    : "border-white/10 bg-white/5"
                }`}
              >
                <Users className="mb-2 h-5 w-5" />
                <p className="font-display font-bold">{label}</p>
              </motion.button>
            ))}
          </div>
        </section>
      </PageItem>

      <PageItem>
        <div className="card-surface text-sm text-[var(--fg-muted)]">
          <p className="font-semibold text-[var(--fg)]">How it works</p>
          <ol className="mt-2 list-decimal space-y-1 pl-5">
            <li>Share the code / QR — players join on their phones</li>
            <li>Start the tournament — game 1 auto-opens for everyone</li>
            <li>Watch live scores as they finish on your control screen</li>
            <li>When the round is done (or you skip ahead), start the next game</li>
          </ol>
        </div>
      </PageItem>

      {error && (
        <PageItem>
          <p className="text-center text-red-400">{error}</p>
        </PageItem>
      )}

      <PageItem>
        <button
          type="button"
          className="btn-primary w-full text-xl disabled:opacity-50"
          disabled={busy}
          onClick={() => void create()}
        >
          {busy ? "Creating…" : "Create session"}
        </button>
      </PageItem>
    </PageEnter>
  );
}
