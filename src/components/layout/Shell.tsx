"use client";

import { Header } from "./Header";
import { AmbientOrbs } from "./AmbientOrbs";
import { LoadingPulse } from "./LoadingPulse";
import { useEffect } from "react";
import { useTournamentStore } from "@/store/useTournamentStore";
import { useCloudSync } from "@/hooks/useCloudSync";

export function Shell({ children }: { children: React.ReactNode }) {
  const theme = useTournamentStore((s) => s.theme);
  const hydrated = useTournamentStore((s) => s.hydrated);
  const setHydrated = useTournamentStore((s) => s.setHydrated);

  useCloudSync(true);

  useEffect(() => {
    if (!hydrated) {
      const t = setTimeout(() => setHydrated(true), 50);
      return () => clearTimeout(t);
    }
  }, [hydrated, setHydrated]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  if (!hydrated) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden gradient-olympics">
        <AmbientOrbs />
        <LoadingPulse label="Loading Olympics…" />
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen flex-col overflow-x-hidden gradient-olympics">
      <AmbientOrbs />
      <Header />
      <main className="relative z-10 flex flex-1 flex-col">{children}</main>
    </div>
  );
}
