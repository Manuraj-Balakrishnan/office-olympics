"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { motion } from "framer-motion";
import { GameShell } from "../shared/GameShell";
import { ResultsScreen, type ResultRow } from "../shared/ResultsScreen";
import { useSound } from "@/hooks/useSound";

const GRID = 3;
const PIECE_COUNT = GRID * GRID;
const DURATION_SEC = 90;
const CELL = 100;
/** Max tab protrusion — must cover classic knob height (~20% of cell) */
const TAB = 24;
const SNAP_RATIO = 0.45;
/** Pause on the completed puzzle before results */
const REVEAL_MS = 2800;

type Edge = -1 | 0 | 1;
type PieceEdges = { top: Edge; right: Edge; bottom: Edge; left: Edge };

type LoosePiece = {
  id: number;
  rot: number;
};

function shuffleLoose(): LoosePiece[] {
  return Array.from({ length: PIECE_COUNT }, (_, i) => i)
    .sort(() => Math.random() - 0.5)
    .map((id) => ({
      id,
      rot: Math.random() * 36 - 18,
    }));
}

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const rem = Math.floor((ms % 1000) / 10);
  return `${s}.${rem.toString().padStart(2, "0")}s`;
}

/** Faster solve → more points (0–1000). Incomplete → small partial credit. */
function puzzlePoints(ms: number, cleared: boolean, placedCount: number) {
  if (!cleared) {
    return Math.round((placedCount / PIECE_COUNT) * 150);
  }
  // Elite ~20s → 1000; 45s → ~640; 90s → 0
  const t = Math.max(12_000, ms);
  return Math.max(0, Math.min(1000, Math.round(1000 - (t - 20_000) / 70)));
}

const PUZZLE_SVG = encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300" fill="none">
  <defs>
    <linearGradient id="paper" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#FAFAF9"/>
      <stop offset="100%" stop-color="#E7E5E4"/>
    </linearGradient>
  </defs>
  <rect width="300" height="300" fill="url(#paper)"/>
  <rect x="16" y="16" width="268" height="268" rx="10" fill="none" stroke="#31BBAC" stroke-width="4" opacity="0.4"/>
  <rect x="28" y="28" width="244" height="244" rx="6" fill="none" stroke="#454242" stroke-width="1.5" opacity="0.12"/>
  <g transform="translate(28 132) scale(1.64)">
    <path d="M32.9359 0L25.1663 13.4153C22.663 17.7285 20.9322 17.9407 16.4519 17.9407L24.225 4.52199C26.7249 0.208812 28.459 0 32.9359 0ZM18.8743 4.78557H14.873L16.4115 2.04362C17.265 0.513473 18.0882 0 19.7042 0H26.3741C23.5907 4.74449 21.2426 4.78557 18.8776 4.78557" fill="#454242"/>
    <path d="M0 17.9964L7.77304 4.57765C10.2763 0.2679 12.0071 0.0556641 16.484 0.0556641L8.71094 13.471C6.20764 17.7842 4.47692 17.9998 0 17.9998M14.0617 13.2108H18.0629L16.5278 15.9528C15.6709 17.4795 14.8511 17.9964 13.2351 17.9964H6.56525C9.34857 13.2485 11.6967 13.2108 14.0583 13.2108" fill="#31BBAC"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M98.8958 2.44739H103.043V10.8724C103.043 11.5332 103.456 12.5344 104.765 12.5344H108.24C109.544 12.5344 109.962 11.5332 109.962 10.8724V2.44739H114.104V10.7022C114.104 12.5344 114.226 15.558 109.962 15.558H103.048C98.7786 15.558 98.9009 12.5344 98.9009 10.7022V2.44739H98.8958ZM82.2662 2.44739H93.2099C95.9765 2.44739 97.3266 4.56992 97.3266 5.7263V15.558H93.1794V7.47339C93.1794 6.08173 92.8074 5.44096 91.009 5.44096H89.5162V15.558H85.374V5.44096H83.9169C82.9591 5.44096 81.9401 5.78638 81.9401 7.15301V15.553H77.798V5.94657C77.798 3.59876 79.7748 2.44238 82.2713 2.44238M55.2226 2.44739H59.3647V15.558H55.2226V2.44739ZM38.4707 2.44739H42.6128V10.8724C42.6128 11.5332 43.0306 12.5344 44.3349 12.5344H53.6432V15.558H42.6179C38.3535 15.558 38.4758 12.5344 38.4758 10.7022V2.44739H38.4707ZM70.6244 5.44096V15.558H66.4823V5.44096H61.1174V2.44739H76.1625V5.44096H70.6244ZM126.087 11.7585C126.765 12.0589 126.714 12.5344 125.904 12.5344H115.704V15.558H126.316C132.502 15.558 133.24 10.8074 129.012 9.37065L120.381 6.31201C119.703 6.01665 119.759 5.471 120.508 5.471H131.228V2.44238H120.615C113.946 2.44238 114.822 8.0691 118.659 9.10534L126.087 11.7535V11.7585Z" fill="#454242"/>
    <path fill-rule="evenodd" clip-rule="evenodd" d="M138.102 15.5573H132.514L143.582 6.58366C144.149 6.32828 144.266 5.59216 143.633 5.47198H132.723V2.44238H143.353C150.385 2.44238 148.788 8.15605 146.328 9.20764L138.097 15.5523L138.102 15.5573Z" fill="#31BBAC"/>
  </g>
</svg>
`);

const PUZZLE_HREF = `data:image/svg+xml,${PUZZLE_SVG}`;

function seededSign(seed: number): 1 | -1 {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x) > 0.5 ? 1 : -1;
}

function buildEdgeMap(): PieceEdges[] {
  const edges: PieceEdges[] = Array.from({ length: PIECE_COUNT }, () => ({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }));

  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      const i = r * GRID + c;
      if (c < GRID - 1) {
        const knob = seededSign(i * 17 + 3);
        edges[i]!.right = knob;
        edges[i + 1]!.left = (-knob) as Edge;
      }
      if (r < GRID - 1) {
        const knob = seededSign(i * 31 + 7);
        edges[i]!.bottom = knob;
        edges[i + GRID]!.top = (-knob) as Edge;
      }
    }
  }
  return edges;
}

/**
 * Classic die-cut jigsaw knob (narrow neck + round head).
 * edge: +1 tab outward, -1 socket inward, 0 flat.
 * outward: which way is "out" of the piece along the axis.
 */
function horizKnob(
  x1: number,
  y: number,
  x2: number,
  edge: Edge,
  outward: 1 | -1,
): string {
  if (edge === 0) return `L ${x2} ${y}`;

  const travel = Math.sign(x2 - x1) || 1;
  const len = Math.abs(x2 - x1);
  const neck = len * 0.13;
  const shoulder = len * 0.06;
  const rise = len * 0.2;
  const bulb = len * 0.115;
  const mid = len / 2;

  const px = (t: number) => x1 + travel * t;
  const py = (d: number) => y + outward * edge * d;

  const a = mid - neck - shoulder;
  const b = mid + neck + shoulder;
  const n1 = mid - neck;
  const n2 = mid + neck;
  const neckY = rise * 0.34;

  return [
    `L ${px(a)} ${y}`,
    `C ${px(a + shoulder * 0.85)} ${y}`,
    `${px(n1)} ${py(rise * 0.08)}`,
    `${px(n1)} ${py(neckY)}`,
    `C ${px(n1 - bulb * 0.15)} ${py(rise * 0.62)}`,
    `${px(mid - bulb)} ${py(rise)}`,
    `${px(mid)} ${py(rise)}`,
    `C ${px(mid + bulb)} ${py(rise)}`,
    `${px(n2 + bulb * 0.15)} ${py(rise * 0.62)}`,
    `${px(n2)} ${py(neckY)}`,
    `C ${px(n2)} ${py(rise * 0.08)}`,
    `${px(b - shoulder * 0.85)} ${y}`,
    `${px(b)} ${y}`,
    `L ${x2} ${y}`,
  ].join(" ");
}

function vertKnob(
  x: number,
  y1: number,
  y2: number,
  edge: Edge,
  outward: 1 | -1,
): string {
  if (edge === 0) return `L ${x} ${y2}`;

  const travel = Math.sign(y2 - y1) || 1;
  const len = Math.abs(y2 - y1);
  const neck = len * 0.13;
  const shoulder = len * 0.06;
  const rise = len * 0.2;
  const bulb = len * 0.115;
  const mid = len / 2;

  const py = (t: number) => y1 + travel * t;
  const px = (d: number) => x + outward * edge * d;

  const a = mid - neck - shoulder;
  const b = mid + neck + shoulder;
  const n1 = mid - neck;
  const n2 = mid + neck;
  const neckX = rise * 0.34;

  return [
    `L ${x} ${py(a)}`,
    `C ${x} ${py(a + shoulder * 0.85)}`,
    `${px(rise * 0.08)} ${py(n1)}`,
    `${px(neckX)} ${py(n1)}`,
    `C ${px(rise * 0.62)} ${py(n1 - bulb * 0.15)}`,
    `${px(rise)} ${py(mid - bulb)}`,
    `${px(rise)} ${py(mid)}`,
    `C ${px(rise)} ${py(mid + bulb)}`,
    `${px(rise * 0.62)} ${py(n2 + bulb * 0.15)}`,
    `${px(neckX)} ${py(n2)}`,
    `C ${px(rise * 0.08)} ${py(n2)}`,
    `${x} ${py(b - shoulder * 0.85)}`,
    `${x} ${py(b)}`,
    `L ${x} ${y2}`,
  ].join(" ");
}

/** Clockwise outline: top → right → bottom → left */
function jigsawPath(e: PieceEdges): string {
  const s = CELL;
  return [
    `M 0 0`,
    horizKnob(0, 0, s, e.top, -1),
    vertKnob(s, 0, s, e.right, 1),
    horizKnob(s, s, 0, e.bottom, 1),
    vertKnob(0, s, 0, e.left, -1),
    `Z`,
  ].join(" ");
}

function PieceArt({
  pieceId,
  edges,
  uid,
  ghost,
}: {
  pieceId: number;
  edges: PieceEdges;
  uid: string;
  ghost?: boolean;
  placed?: boolean;
}) {
  const row = Math.floor(pieceId / GRID);
  const col = pieceId % GRID;
  const path = jigsawPath(edges);
  const clipId = `${uid}-${ghost ? "g" : "p"}-${pieceId}`;
  const pad = TAB;
  const vb = `${-pad} ${-pad} ${CELL + pad * 2} ${CELL + pad * 2}`;

  if (ghost) {
    return (
      <svg
        viewBox={vb}
        className="pointer-events-none h-full w-full overflow-visible"
        aria-hidden
      >
        <path
          d={path}
          fill="rgba(255,255,255,0.04)"
          stroke="rgba(255,255,255,0.32)"
          strokeWidth={1.8}
          strokeDasharray="4 3"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox={vb}
      className="pointer-events-none h-full w-full overflow-visible"
      aria-hidden
    >
      <defs>
        <clipPath id={clipId}>
          <path d={path} />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <image
          href={PUZZLE_HREF}
          x={-col * CELL}
          y={-row * CELL}
          width={GRID * CELL}
          height={GRID * CELL}
          preserveAspectRatio="none"
          style={{ pointerEvents: "none", WebkitUserDrag: "none" } as CSSProperties}
        />
      </g>
    </svg>
  );
}

/** Ghost slot guides — sized so jigsaw tabs sit in the right place on the board. */
function slotBoxStyle(slot: number) {
  const r = Math.floor(slot / GRID);
  const c = slot % GRID;
  const core = 100 / GRID;
  const overlap = (TAB / CELL) * core;
  const size = core + overlap * 2;
  return {
    width: `${size}%`,
    height: `${size}%`,
    left: `${c * core - overlap}%`,
    top: `${r * core - overlap}%`,
  } as const;
}

/** One seamless image masked by all placed jigsaw outlines — no per-piece seams. */
function PlacedPuzzleLayer({
  placed,
  edgeMap,
  uid,
}: {
  placed: Set<number>;
  edgeMap: PieceEdges[];
  uid: string;
}) {
  if (placed.size === 0) return null;
  const board = GRID * CELL;
  const pad = TAB;
  const maskId = `${uid}-placed-mask`;
  const ids = Array.from(placed);
  // ViewBox includes tab padding; expand the SVG so coords 0..board map to the board box
  const bleedPct = (pad / board) * 100;
  const sizePct = ((board + pad * 2) / board) * 100;

  return (
    <svg
      viewBox={`${-pad} ${-pad} ${board + pad * 2} ${board + pad * 2}`}
      className="pointer-events-none absolute overflow-visible"
      style={{
        left: `${-bleedPct}%`,
        top: `${-bleedPct}%`,
        width: `${sizePct}%`,
        height: `${sizePct}%`,
      }}
      aria-hidden
    >
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect
            x={-pad}
            y={-pad}
            width={board + pad * 2}
            height={board + pad * 2}
            fill="black"
          />
          {ids.map((id) => {
            const r = Math.floor(id / GRID);
            const c = id % GRID;
            return (
              <path
                key={id}
                d={jigsawPath(edgeMap[id]!)}
                fill="white"
                stroke="white"
                strokeWidth={2.5}
                strokeLinejoin="round"
                transform={`translate(${c * CELL} ${r * CELL})`}
              />
            );
          })}
        </mask>
      </defs>
      <image
        href={PUZZLE_HREF}
        x={0}
        y={0}
        width={board}
        height={board}
        preserveAspectRatio="none"
        mask={`url(#${maskId})`}
      />
    </svg>
  );
}

export function SpeedPuzzle() {
  const uid = useId().replace(/:/g, "");
  const { play } = useSound();
  const edgeMap = useMemo(() => buildEdgeMap(), []);

  const [placed, setPlaced] = useState<Set<number>>(() => new Set());
  const [loose, setLoose] = useState<LoosePiece[]>(() => shuffleLoose());
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState({ x: 50, y: 50 });
  const [hoverSlot, setHoverSlot] = useState<number | null>(null);
  const [pieceSizePct, setPieceSizePct] = useState(22);
  const [boardPx, setBoardPx] = useState(280);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [results, setResults] = useState<ResultRow[] | null>(null);

  const playfieldRef = useRef<HTMLDivElement>(null);
  const boardInnerRef = useRef<HTMLDivElement>(null);
  const participantsRef = useRef<ResultRow["participant"][]>([]);
  const finishRef = useRef<(() => void) | null>(null);
  const finalized = useRef(false);
  const revealingRef = useRef(false);
  const solveMsRef = useRef(0);
  const startedAt = useRef(0);
  const placedRef = useRef(placed);
  const dragPosRef = useRef(dragPos);
  placedRef.current = placed;
  dragPosRef.current = dragPos;
  revealingRef.current = revealing;

  const measureLayout = useCallback(() => {
    const field = playfieldRef.current;
    if (!field) return;
    const fr = field.getBoundingClientRect();
    if (fr.width <= 0 || fr.height <= 0) return;

    // Leave room for a 3×3 tray (~3 rows of ~72px + padding) on phones
    const trayBudget = Math.min(260, Math.max(168, fr.height * 0.4));
    const side = Math.round(
      Math.max(150, Math.min(420, fr.width - 20, fr.height - trayBudget - 12)),
    );
    setBoardPx(side);

    const board = boardInnerRef.current;
    const br = board?.getBoundingClientRect();
    const boardW = br && br.width > 0 ? br.width : side * 0.94;
    const cell = boardW / GRID;
    const piecePx = cell * ((CELL + TAB * 2) / CELL);
    setPieceSizePct(Math.min(28, Math.max(16, (piecePx / fr.width) * 100)));
  }, []);

  useEffect(() => {
    measureLayout();
    window.addEventListener("resize", measureLayout);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", measureLayout);
    const field = playfieldRef.current;
    const ro =
      field && typeof ResizeObserver !== "undefined"
        ? new ResizeObserver(() => measureLayout())
        : null;
    if (field && ro) ro.observe(field);
    return () => {
      window.removeEventListener("resize", measureLayout);
      vv?.removeEventListener("resize", measureLayout);
      ro?.disconnect();
    };
  }, [measureLayout, playing]);

  const slotCenterPct = useCallback((slot: number) => {
    const field = playfieldRef.current;
    const board = boardInnerRef.current;
    if (!field || !board) return null;
    const fr = field.getBoundingClientRect();
    const br = board.getBoundingClientRect();
    const r = Math.floor(slot / GRID);
    const c = slot % GRID;
    const cellW = br.width / GRID;
    const cellH = br.height / GRID;
    const cx = br.left - fr.left + (c + 0.5) * cellW;
    const cy = br.top - fr.top + (r + 0.5) * cellH;
    return {
      x: (cx / fr.width) * 100,
      y: (cy / fr.height) * 100,
      snap: (cellW / fr.width) * 100 * SNAP_RATIO,
    };
  }, []);

  const finalize = (ms: number, cleared: boolean) => {
    if (finalized.current) return;
    finalized.current = true;
    const n = placedRef.current.size;
    const points = puzzlePoints(ms, cleared, n);
    setResults(
      participantsRef.current.map((p) => ({
        participant: p,
        score: points,
        detail: cleared
          ? `${points} pts · solved in ${formatTime(ms)}`
          : `${points} pts · ${n}/${PIECE_COUNT} placed`,
      })),
    );
    finishRef.current?.();
  };

  useEffect(() => {
    if (!playing || results || finalized.current || revealing) return;
    startedAt.current = Date.now();
    const id = setInterval(() => setElapsedMs(Date.now() - startedAt.current), 50);
    return () => clearInterval(id);
  }, [playing, results, revealing]);

  // After the last piece snaps, show the full puzzle briefly, then score
  useEffect(() => {
    if (!revealing || finalized.current) return;
    play("fanfare");
    const t = setTimeout(() => {
      finalize(solveMsRef.current, true);
    }, REVEAL_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealing]);

  const beginReveal = (ms: number) => {
    if (revealingRef.current || finalized.current) return;
    revealingRef.current = true;
    solveMsRef.current = ms;
    setElapsedMs(ms);
    setDraggingId(null);
    setHoverSlot(null);
    setRevealing(true);
  };

  const clientToPct = (clientX: number, clientY: number) => {
    const field = playfieldRef.current;
    if (!field) return { x: 0, y: 0 };
    const fr = field.getBoundingClientRect();
    return {
      x: ((clientX - fr.left) / fr.width) * 100,
      y: ((clientY - fr.top) / fr.height) * 100,
    };
  };

  const onPointerDown = (pieceId: number, e: React.PointerEvent) => {
    if (finalized.current || revealingRef.current || !playing || placedRef.current.has(pieceId))
      return;
    // Stop iOS Safari image-callout / native drag (shows white selection handles)
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    play("click");
    const pt = clientToPct(e.clientX, e.clientY);
    dragPosRef.current = pt;
    setDragPos(pt);
    setDraggingId(pieceId);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (draggingId === null) return;
    const pt = clientToPct(e.clientX, e.clientY);
    const x = Math.min(94, Math.max(6, pt.x));
    const y = Math.min(94, Math.max(6, pt.y));
    dragPosRef.current = { x, y };
    setDragPos({ x, y });

    const home = slotCenterPct(draggingId);
    if (home) {
      setHoverSlot(Math.hypot(x - home.x, y - home.y) < home.snap ? draggingId : null);
    }
  };

  const onPointerUp = () => {
    if (draggingId === null) return;
    const id = draggingId;
    const pos = dragPosRef.current;
    setDraggingId(null);
    setHoverSlot(null);

    const home = slotCenterPct(id);
    if (home && Math.hypot(pos.x - home.x, pos.y - home.y) < home.snap) {
      play("correct");
      const nextPlaced = new Set(placedRef.current);
      nextPlaced.add(id);
      placedRef.current = nextPlaced;
      setPlaced(nextPlaced);
      setLoose((prev) => prev.filter((p) => p.id !== id));
      if (nextPlaced.size >= PIECE_COUNT) {
        beginReveal(Date.now() - startedAt.current);
      }
    } else {
      play("click");
    }
  };

  const draggingPiece = draggingId != null ? loose.find((p) => p.id === draggingId) : null;
  const showFullPuzzle = revealing || placed.size >= PIECE_COUNT;

  return (
    <GameShell
      gameId="speed-puzzle"
      title="Speed Puzzle"
      durationSec={DURATION_SEC}
      supportsHuddle
      hideTimer
      onTimeUp={() => {
        if (revealingRef.current || finalized.current) return;
        finalize(Date.now() - startedAt.current, false);
      }}
      results={
        results ? (
          <ResultsScreen
            gameId="speed-puzzle"
            title="Speed Puzzle"
            results={results}
          />
        ) : undefined
      }
    >
      {({ participants, finish, phase, remainingMs }) => {
        participantsRef.current = participants;
        finishRef.current = finish;
        if (phase === "playing" && !playing && !results) {
          queueMicrotask(() => {
            setPlaying(true);
            requestAnimationFrame(() => {
              measureLayout();
              requestAnimationFrame(measureLayout);
            });
          });
        }
        if (results) return null;

        return (
          <div
            className="mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col gap-1 px-2 pt-1 sm:max-w-xl sm:gap-2 sm:px-4 sm:pt-2"
            style={{
              paddingBottom: "max(0.5rem, calc(env(safe-area-inset-bottom, 0px) + 0.35rem))",
            }}
          >
            <div className="flex shrink-0 items-center justify-between gap-2 px-1 text-sm text-[var(--fg-muted)]">
              <span className="tabular-nums">
                {placed.size}/{PIECE_COUNT}
              </span>
              <span className="font-display text-base font-bold tabular-nums text-[var(--fg)] sm:text-lg">
                {revealing ? "Complete!" : formatTime(elapsedMs)}
              </span>
              <span
                className={`tabular-nums ${
                  !revealing && remainingMs < 15_000 ? "font-semibold text-amber-300" : ""
                }`}
              >
                {revealing ? "Nice work" : `${(remainingMs / 1000).toFixed(0)}s left`}
              </span>
            </div>

            <div
              ref={playfieldRef}
              className="relative isolate flex min-h-0 w-full flex-1 flex-col overflow-hidden rounded-2xl select-none sm:rounded-3xl"
              style={{
                background: `
                  radial-gradient(ellipse at 25% 15%, rgba(49,187,172,0.14), transparent 45%),
                  radial-gradient(ellipse at 85% 90%, rgba(0,0,0,0.4), transparent 50%),
                  linear-gradient(165deg, #323c4a 0%, #1c232e 50%, #12171f 100%)
                `,
                boxShadow: "inset 0 1px 0 rgba(255,255,255,0.08)",
                touchAction: "none",
                WebkitTouchCallout: "none",
                WebkitUserSelect: "none",
                userSelect: "none",
              }}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              onContextMenu={(e) => e.preventDefault()}
            >
              {/* Board — JS-sized so it never collapses on mobile Safari */}
              <div className="relative z-10 flex w-full shrink-0 flex-col items-center px-2 pt-1.5 sm:px-6 sm:pt-4">
                <div
                  className="relative rounded-2xl"
                  style={{
                    width: boardPx,
                    height: boardPx,
                    background:
                      "linear-gradient(145deg, #d2b48c 0%, #b8956c 42%, #8b6914 100%)",
                    boxShadow:
                      "inset 0 2px 3px rgba(255,255,255,0.35), inset 0 -4px 10px rgba(0,0,0,0.3), 0 10px 28px rgba(0,0,0,0.4)",
                    padding: "3%",
                  }}
                >
                  <div
                    ref={boardInnerRef}
                    className="relative h-full w-full overflow-hidden rounded-md"
                    style={{
                      background:
                        "radial-gradient(circle at 40% 30%, #3a4556, #1a2030 70%)",
                      boxShadow: "inset 0 3px 14px rgba(0,0,0,0.55)",
                    }}
                  >
                    {showFullPuzzle ? (
                      <motion.img
                        src={PUZZLE_HREF}
                        alt="Completed puzzle"
                        draggable={false}
                        className="pointer-events-none absolute inset-0 h-full w-full rounded-md object-cover"
                        style={{ WebkitUserDrag: "none" } as CSSProperties}
                        initial={{ opacity: 0.7, scale: 0.98 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ type: "spring", stiffness: 280, damping: 22 }}
                      />
                    ) : (
                      <>
                        {Array.from({ length: PIECE_COUNT }).map((_, slot) => {
                          if (placed.has(slot)) return null;
                          const glowing = hoverSlot === slot;
                          return (
                            <div
                              key={slot}
                              className="absolute z-[1]"
                              style={slotBoxStyle(slot)}
                            >
                              <div style={{ opacity: glowing ? 1 : 0.9 }}>
                                <PieceArt
                                  pieceId={slot}
                                  edges={edgeMap[slot]!}
                                  uid={uid}
                                  ghost
                                />
                              </div>
                            </div>
                          );
                        })}

                        <div className="absolute inset-0 z-[5]">
                          <PlacedPuzzleLayer
                            placed={placed}
                            edgeMap={edgeMap}
                            uid={uid}
                          />
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Tray — shrink-0 so all loose pieces stay visible */}
              {!showFullPuzzle && (
              <div
                className="relative z-10 mx-2 mb-1 mt-1.5 min-h-0 flex-1 overflow-y-auto overscroll-contain rounded-2xl sm:mx-4 sm:mb-3 sm:mt-3"
                style={{
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0.12), rgba(0,0,0,0.28))",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.05)",
                  paddingBottom: "max(0.25rem, env(safe-area-inset-bottom, 0px))",
                }}
              >
                <div className="grid grid-cols-3 gap-1 p-1.5 sm:gap-2.5 sm:p-3">
                  {loose.map((piece) => {
                    const isDragging = draggingId === piece.id;
                    return (
                      <button
                        key={piece.id}
                        type="button"
                        aria-label={`Puzzle piece ${piece.id + 1}`}
                        className="relative mx-auto flex aspect-square w-full max-w-[4.5rem] touch-none items-center justify-center rounded-xl bg-tone-5 outline-none sm:max-w-[6rem]"
                        style={{
                          opacity: isDragging ? 0.25 : 1,
                          cursor: isDragging ? "grabbing" : "grab",
                          WebkitTouchCallout: "none",
                          WebkitUserSelect: "none",
                          userSelect: "none",
                        }}
                        onPointerDown={(e) => onPointerDown(piece.id, e)}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerUp}
                        onContextMenu={(e) => e.preventDefault()}
                        onDragStart={(e) => e.preventDefault()}
                      >
                        <motion.div
                          className="pointer-events-none h-[90%] w-[90%]"
                          animate={{ rotate: isDragging ? 0 : piece.rot }}
                          transition={{ type: "spring", stiffness: 400, damping: 26 }}
                        >
                          <PieceArt
                            pieceId={piece.id}
                            edges={edgeMap[piece.id]!}
                            uid={uid}
                          />
                        </motion.div>
                      </button>
                    );
                  })}
                </div>
              </div>
              )}

              {revealing && (
                <motion.p
                  className="px-2 pb-2 text-center text-sm text-[var(--fg-muted)] sm:text-base"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  Solved in {formatTime(solveMsRef.current)} — scoring…
                </motion.p>
              )}

              {/* Floating piece while dragging */}
              {draggingPiece && (
                <div
                  className="pointer-events-none absolute z-50"
                  style={{
                    width: `${pieceSizePct}%`,
                    left: `${dragPos.x}%`,
                    top: `${dragPos.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <motion.div
                    initial={false}
                    animate={{ scale: 1.12 }}
                  >
                    <PieceArt
                      pieceId={draggingPiece.id}
                      edges={edgeMap[draggingPiece.id]!}
                      uid={`${uid}-drag`}
                    />
                  </motion.div>
                </div>
              )}
            </div>
          </div>
        );
      }}
    </GameShell>
  );
}
