"use client";

import { Moon, Sun } from "lucide-react";
import { useEffect } from "react";
import { useTournamentStore } from "@/store/useTournamentStore";

export function ThemeToggle() {
  const theme = useTournamentStore((s) => s.theme);
  const setTheme = useTournamentStore((s) => s.setTheme);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <button
      type="button"
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      className="header-control"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </button>
  );
}
