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
      className="btn-secondary !rounded-xl !px-3 !py-2"
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
