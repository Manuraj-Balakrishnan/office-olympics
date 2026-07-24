"use client";

import { Volume2, VolumeX } from "lucide-react";
import { useTournamentStore } from "@/store/useTournamentStore";
import { useSound } from "@/hooks/useSound";

export function MuteToggle() {
  const muted = useTournamentStore((s) => s.muted);
  const setMuted = useTournamentStore((s) => s.setMuted);
  const { play } = useSound();

  return (
    <button
      type="button"
      aria-label={muted ? "Unmute sounds" : "Mute sounds"}
      className="header-control"
      onClick={() => {
        const next = !muted;
        setMuted(next);
        if (!next) play("click");
      }}
    >
      {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
    </button>
  );
}
