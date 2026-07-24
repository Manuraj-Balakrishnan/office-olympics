"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { Trophy } from "lucide-react";
import { MuteToggle } from "./MuteToggle";
import { ThemeToggle } from "./ThemeToggle";
import { useTournamentStore } from "@/store/useTournamentStore";

export function Header() {
  const pathname = usePathname();
  const tournamentStarted = useTournamentStore((s) => s.tournamentStarted);
  const multiplayerRoute =
    pathname.startsWith("/host") ||
    pathname.startsWith("/join") ||
    pathname.startsWith("/play") ||
    /^\/leaderboard\/[^/]+/.test(pathname);
  const showNav =
    tournamentStarted && !pathname.startsWith("/setup") && !multiplayerRoute;

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className="sticky top-0 z-40 flex items-center justify-between gap-4 border-b border-white/10 bg-[var(--bg)]/70 px-4 py-3 backdrop-blur-xl md:px-8"
    >
      <Link
        href="/"
        className="group flex items-center gap-2 font-display text-xl font-extrabold tracking-tight"
      >
        <motion.span
          whileHover={{ rotate: -8, scale: 1.08 }}
          whileTap={{ scale: 0.95 }}
          className="flex h-9 w-9 items-center justify-center rounded-xl gradient-primary text-white shadow-lg shadow-teal-500/25"
        >
          <Trophy className="h-5 w-5" />
        </motion.span>
        <span className="text-gradient transition group-hover:brightness-110">
          Office Olympics
        </span>
      </Link>

      {showNav && (
        <nav className="hidden items-center gap-1 sm:flex">
          <NavLink href="/dashboard" active={pathname === "/dashboard"}>
            Games
          </NavLink>
          <NavLink href="/leaderboard" active={pathname === "/leaderboard"}>
            Leaderboard
          </NavLink>
        </nav>
      )}

      <div className="flex items-center gap-2">
        <ThemeToggle />
        <MuteToggle />
      </div>
    </motion.header>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`relative rounded-xl px-4 py-2 text-sm font-semibold transition ${
        active
          ? "text-[var(--fg)]"
          : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
      }`}
    >
      {active && (
        <motion.span
          layoutId="nav-pill"
          className="absolute inset-0 rounded-xl bg-white/10"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </Link>
  );
}
