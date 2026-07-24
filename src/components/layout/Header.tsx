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

  return (
    <motion.header
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 26 }}
      className="site-header relative sticky top-0 z-40 pt-[env(safe-area-inset-top)]"
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5">
        <Link
          href="/"
          className="group min-w-0 font-display text-[0.95rem] font-extrabold tracking-[-0.03em] sm:text-lg"
        >
          <span className="text-[var(--fg)] transition group-hover:text-[var(--accent-soft)]">
            Office
          </span>{" "}
          <span className="text-[var(--primary-from)] transition group-hover:brightness-110">
            Olympics
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1 sm:gap-2">
          {showNav && (
            <nav className="mr-1 hidden items-center gap-0.5 sm:flex">
              <NavLink href="/dashboard" active={pathname === "/dashboard"}>
                Games
              </NavLink>
              <NavLink href="/leaderboard" active={pathname === "/leaderboard"}>
                Leaderboard
              </NavLink>
            </nav>
          )}

          {showNav && (
            <button
              type="button"
              className="header-control sm:hidden"
              aria-expanded={menuOpen}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
              onClick={() => setMenuOpen((o) => !o)}
            >
              {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
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
          >
            <div className="flex flex-col gap-1 px-4 py-3">
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
      className={`relative rounded-xl px-3.5 py-2 text-sm font-semibold transition ${
        mobile ? "block w-full" : ""
      } ${
        active
          ? "text-[var(--fg)]"
          : "text-[var(--fg-muted)] hover:text-[var(--fg)]"
      }`}
    >
      {active && (
        <motion.span
          layoutId={mobile ? "nav-pill-mobile" : "nav-pill"}
          className="absolute inset-0 rounded-xl bg-[color-mix(in_srgb,var(--fg)_8%,transparent)]"
          transition={{ type: "spring", stiffness: 380, damping: 30 }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </Link>
  );
}
