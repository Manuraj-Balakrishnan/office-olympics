"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { MuteToggle } from "./MuteToggle";
import { ThemeToggle } from "./ThemeToggle";
import { useTournamentStore } from "@/store/useTournamentStore";

export function Header() {
  const pathname = usePathname();
  const tournamentStarted = useTournamentStore((s) => s.tournamentStarted);
  const [menuOpen, setMenuOpen] = useState(false);
  const multiplayerRoute =
    pathname.startsWith("/host") ||
    pathname.startsWith("/join") ||
    pathname.startsWith("/play") ||
    /^\/leaderboard\/[^/]+/.test(pathname);
  const showNav =
    tournamentStarted && !pathname.startsWith("/setup") && !multiplayerRoute;

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  const onGameRoute =
    pathname.startsWith("/game/") || /\/play\/[^/]+\/game\//.test(pathname);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 300, damping: 28 }}
      className="sticky top-0 z-40 px-3 pt-[max(0.75rem,env(safe-area-inset-top))]"
    >
      <div
        className={`site-header mx-auto w-full ${
          onGameRoute ? "max-w-6xl" : "max-w-7xl"
        }`}
      >
        <div
          className={`flex items-center gap-2 px-3 sm:gap-3 sm:px-4 ${
            onGameRoute ? "h-12" : "h-12 sm:h-14"
          }`}
        >
          <Link
            href="/"
            className="group min-w-0 shrink-0"
            aria-label="Office Olympics home"
          >
            <span className="font-display text-[0.98rem] font-extrabold tracking-[-0.045em] sm:text-[1.125rem]">
              <span className="text-[var(--fg)] transition-colors group-hover:text-[var(--accent-soft)]">
                Office
              </span>
              <span className="text-[var(--primary-from)] transition group-hover:brightness-110">
                {" "}
                Olympics
              </span>
            </span>
          </Link>

          {showNav && (
            <>
              <span
                className="mx-0.5 hidden h-4 w-px bg-[var(--border-strong)] sm:block"
                aria-hidden
              />
              <nav
                className="hidden items-center gap-0.5 sm:flex"
                aria-label="Primary"
              >
                <NavLink href="/dashboard" active={pathname === "/dashboard"}>
                  Games
                </NavLink>
                <NavLink
                  href="/leaderboard"
                  active={pathname === "/leaderboard"}
                >
                  Leaderboard
                </NavLink>
              </nav>
            </>
          )}

          <div className="ml-auto flex shrink-0 items-center gap-0.5">
            {showNav && (
              <button
                type="button"
                className="header-control max-sm-only"
                aria-expanded={menuOpen}
                aria-label={menuOpen ? "Close menu" : "Open menu"}
                onClick={() => setMenuOpen((o) => !o)}
              >
                {menuOpen ? (
                  <X className="h-4 w-4" />
                ) : (
                  <Menu className="h-4 w-4" />
                )}
              </button>
            )}
            <ThemeToggle />
            <MuteToggle />
          </div>
        </div>

        <AnimatePresence>
          {showNav && menuOpen && (
            <motion.nav
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden border-t border-[var(--border)] sm:hidden"
              aria-label="Mobile"
            >
              <div className="flex flex-col gap-0.5 px-2 py-2">
                <NavLink
                  href="/dashboard"
                  active={pathname === "/dashboard"}
                  onNavigate={() => setMenuOpen(false)}
                  mobile
                >
                  Games
                </NavLink>
                <NavLink
                  href="/leaderboard"
                  active={pathname === "/leaderboard"}
                  onNavigate={() => setMenuOpen(false)}
                  mobile
                >
                  Leaderboard
                </NavLink>
              </div>
            </motion.nav>
          )}
        </AnimatePresence>
      </div>
    </motion.header>
  );
}

function NavLink({
  href,
  active,
  children,
  onNavigate,
  mobile,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
  onNavigate?: () => void;
  mobile?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`relative font-medium transition-colors ${
        mobile
          ? "block w-full rounded-xl px-3.5 py-2.5 text-sm font-semibold"
          : "px-2.5 py-1.5 text-[0.8125rem] tracking-[0.01em]"
      } ${
        active
          ? "text-[var(--fg)]"
          : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
      }`}
    >
      {active && mobile && (
        <motion.span
          layoutId="nav-pill-mobile"
          className="absolute inset-0 rounded-xl bg-[color-mix(in_srgb,var(--primary-from)_16%,transparent)]"
          transition={{ type: "spring", stiffness: 420, damping: 32 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </Link>
  );
}
