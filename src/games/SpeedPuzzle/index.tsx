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

/** Level 1: 3×3 (9), Level 2: 4×4 (16) */
const LEVEL_GRIDS = [3, 4] as const;
const LEVEL_DURATION_SEC = [60, 180] as const;
const TOTAL_PIECES = LEVEL_GRIDS.reduce((sum, g) => sum + g * g, 0);
/** Level 1 easier → 400 max; level 2 harder → 600 max (sum 1000). */
const LEVEL_MAX_POINTS = [400, 600] as const;
/** Elite clear targets for full level points. */
const LEVEL_ELITE_MS = [15_000, 50_000] as const;
const CELL = 100;
/** Max tab protrusion — must cover classic knob height (~20% of cell) */
const TAB = 24;
const SNAP_RATIO = 0.45;
/** Pause on a completed level before advancing / scoring */
const REVEAL_MS = 2200;

type Edge = -1 | 0 | 1;
type PieceEdges = { top: Edge; right: Edge; bottom: Edge; left: Edge };

type LoosePiece = {
  id: number;
  rot: number;
};

function shuffleLoose(pieceCount: number): LoosePiece[] {
  return Array.from({ length: pieceCount }, (_, i) => i)
    .sort(() => Math.random() - 0.5)
    .map((id) => ({
      id,
      rot: Math.random() * 36 - 18,
    }));
}

function emptyBoard(count: number): (number | null)[] {
  return Array.from({ length: count }, () => null);
}

function correctCount(board: (number | null)[]): number {
  let n = 0;
  for (let i = 0; i < board.length; i++) {
    if (board[i] === i) n++;
  }
  return n;
}

function isBoardSolved(board: (number | null)[]): boolean {
  return board.length > 0 && board.every((pieceId, slot) => pieceId === slot);
}

function formatTime(ms: number) {
  const s = Math.floor(ms / 1000);
  const rem = Math.floor((ms % 1000) / 10);
  return `${s}.${rem.toString().padStart(2, "0")}s`;
}

/** Points for one level: faster clear → more of that level's max. Incomplete → small partial. */
function scoreLevel(
  levelIndex: number,
  ms: number,
  cleared: boolean,
  placed: number,
  pieceCount: number,
): number {
  const maxPts = LEVEL_MAX_POINTS[levelIndex] ?? 400;
  if (!cleared) {
    return Math.round((placed / Math.max(1, pieceCount)) * maxPts * 0.3);
  }
  const elite = LEVEL_ELITE_MS[levelIndex] ?? 15_000;
  const limit = (LEVEL_DURATION_SEC[levelIndex] ?? 60) * 1000;
  const span = Math.max(1, limit - elite);
  const t = Math.min(limit, Math.max(elite, ms));
  return Math.max(0, Math.min(maxPts, Math.round(maxPts * (1 - (t - elite) / span))));
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

const PUZZLE_LEVEL_1 = `data:image/svg+xml,${PUZZLE_SVG}`;
const PUZZLE_LEVEL_2 = "/puzzles/level-2.svg";
const PUZZLE_IMAGES = [PUZZLE_LEVEL_1, PUZZLE_LEVEL_2] as const;

function seededSign(seed: number): 1 | -1 {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x) > 0.5 ? 1 : -1;
}

function buildEdgeMap(grid: number): PieceEdges[] {
  const pieceCount = grid * grid;
  const edges: PieceEdges[] = Array.from({ length: pieceCount }, () => ({
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  }));

  for (let r = 0; r < grid; r++) {
    for (let c = 0; c < grid; c++) {
      const i = r * grid + c;
      if (c < grid - 1) {
        const knob = seededSign(i * 17 + 3 + grid * 100);
        edges[i]!.right = knob;
        edges[i + 1]!.left = (-knob) as Edge;
      }
      if (r < grid - 1) {
        const knob = seededSign(i * 31 + 7 + grid * 100);
        edges[i]!.bottom = knob;
        edges[i + grid]!.top = (-knob) as Edge;
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
  grid,
  imageHref,
  ghost,
  placed,
}: {
  pieceId: number;
  edges: PieceEdges;
  uid: string;
  grid: number;
  imageHref: string;
  ghost?: boolean;
  placed?: boolean;
}) {
  const row = Math.floor(pieceId / grid);
  const col = pieceId % grid;
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
          fill={
            placed
              ? "color-mix(in srgb, var(--primary-from) 18%, transparent)"
              : "rgba(255,255,255,0.045)"
          }
          stroke={
            placed
              ? "color-mix(in srgb, var(--primary-from) 85%, white)"
              : "rgba(255,255,255,0.28)"
          }
          strokeWidth={placed ? 2.2 : 1.6}
          strokeDasharray={placed ? "0" : "5 4"}
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
          href={imageHref}
          x={-col * CELL}
          y={-row * CELL}
          width={grid * CELL}
          height={grid * CELL}
          preserveAspectRatio="none"
          style={{ pointerEvents: "none", WebkitUserDrag: "none" } as CSSProperties}
        />
      </g>
    </svg>
  );
}

/** Ghost slot guides — sized so jigsaw tabs sit in the right place on the board. */
function slotBoxStyle(slot: number, grid: number) {
  const r = Math.floor(slot / grid);
  const c = slot % grid;
  const core = 100 / grid;
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
  grid,
  imageHref,
}: {
  placed: Set<number>;
  edgeMap: PieceEdges[];
  uid: string;
  grid: number;
  imageHref: string;
}) {
  if (placed.size === 0) return null;
  const board = grid * CELL;
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
            const r = Math.floor(id / grid);
            const c = id % grid;
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
        href={imageHref}
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

  const [levelIndex, setLevelIndex] = useState(0);
  const grid = LEVEL_GRIDS[levelIndex]!;
  const pieceCount = grid * grid;
  const isLastLevel = levelIndex >= LEVEL_GRIDS.length - 1;
  const puzzleImage = PUZZLE_IMAGES[levelIndex] ?? PUZZLE_LEVEL_1;
  const edgeMap = useMemo(() => buildEdgeMap(grid), [grid]);

  const [board, setBoard] = useState<(number | null)[]>(() =>
    emptyBoard(LEVEL_GRIDS[0]! * LEVEL_GRIDS[0]!),
  );
  const [loose, setLoose] = useState<LoosePiece[]>(() =>
    shuffleLoose(LEVEL_GRIDS[0]! * LEVEL_GRIDS[0]!),
  );
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [dragPos, setDragPos] = useState({ x: 50, y: 50 });
  const [hoverSlot, setHoverSlot] = useState<number | null>(null);
  const [pieceSizePct, setPieceSizePct] = useState(22);
  /** Safe mobile default — equal goal+board at 280 overflows phones before measure. */
  const [boardPx, setBoardPx] = useState(148);
  const [goalPx, setGoalPx] = useState(148);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [results, setResults] = useState<ResultRow[] | null>(null);
  /** Short landscape — tray sits beside the board+reference row. */
  const [sideBySide, setSideBySide] = useState(false);
  /** Narrow portrait — small goal thumbnail + larger board. */
  const [compactGoal, setCompactGoal] = useState(false);

  const playfieldRef = useRef<HTMLDivElement>(null);
  const boardInnerRef = useRef<HTMLDivElement>(null);
  const participantsRef = useRef<ResultRow["participant"][]>([]);
  const finishRef = useRef<(() => void) | null>(null);
  const finalized = useRef(false);
  const revealingRef = useRef(false);
  const solveMsRef = useRef(0);
  const startedAt = useRef(0);
  const boardRef = useRef(board);
  const dragPosRef = useRef(dragPos);
  const levelIndexRef = useRef(levelIndex);
  const pieceCountRef = useRef(pieceCount);
  const boardPxRef = useRef(boardPx);
  const goalPxRef = useRef(goalPx);
  const sideBySideRef = useRef(sideBySide);
  const compactGoalRef = useRef(compactGoal);
  /** Points banked from completed levels. */
  const priorScoreRef = useRef(0);
  /** Correct pieces cleared on previous levels (for result detail). */
  const priorPlacedRef = useRef(0);
  /** Solve time for the level currently being revealed. */
  const levelSolveMsRef = useRef(0);
  /** Where the current drag started — tray, or a board slot. */
  const dragOriginRef = useRef<{ kind: "tray" } | { kind: "board"; slot: number } | null>(
    null,
  );
  boardRef.current = board;
  dragPosRef.current = dragPos;
  revealingRef.current = revealing;
  levelIndexRef.current = levelIndex;
  pieceCountRef.current = pieceCount;
  boardPxRef.current = boardPx;
  goalPxRef.current = goalPx;
  sideBySideRef.current = sideBySide;
  compactGoalRef.current = compactGoal;

  const measureLayout = useCallback((opts?: { force?: boolean }) => {
    const field = playfieldRef.current;
    if (!field) return;
    const fr = field.getBoundingClientRect();
    if (fr.width <= 0 || fr.height <= 0) return;

    const g = LEVEL_GRIDS[levelIndexRef.current]!;
    const landscape = fr.width > fr.height && fr.height < 560;
    // Equal goal+board pair overflows / cramps below ~420px; use compact thumbnail.
    const compact = !landscape && fr.width < 420;
    sideBySideRef.current = landscape;
    compactGoalRef.current = compact;
    setSideBySide(landscape);
    setCompactGoal(compact);

    const gap = fr.width < 360 ? 8 : 12;

    let side: number;
    let goal: number;
    if (landscape) {
      const trayW = Math.min(fr.width * 0.36, 240);
      const stageW = fr.width - trayW - 20;
      const byW = (stageW - gap) / 2;
      const byH = fr.height - 24;
      side = Math.round(Math.max(110, Math.min(byW, byH, 320)));
      goal = side;
    } else if (compact) {
      const trayFrac = g >= 4 ? 0.36 : 0.34;
      const trayMin = fr.height < 640 ? (g >= 4 ? 112 : 100) : g >= 4 ? 148 : 132;
      const trayMax = fr.height < 640 ? (g >= 4 ? 188 : 168) : g >= 4 ? 220 : 200;
      const trayBudget = Math.min(trayMax, Math.max(trayMin, fr.height * trayFrac));
      const padX = 12;
      const stageW = Math.max(120, fr.width - padX * 2);
      const stageH = Math.max(96, fr.height - trayBudget - 8);
      // Readable goal thumbnail — closer to board, still leaves board primary.
      goal = Math.round(
        Math.max(100, Math.min(132, stageW * 0.38, stageH * 0.62)),
      );
      const boardBudgetW = Math.max(96, stageW - goal - gap);
      side = Math.round(
        Math.max(96, Math.min(boardBudgetW, stageH, fr.width < 360 ? 196 : 228)),
      );
      // Keep goal from competing with board on very short viewports.
      if (goal + 8 > side) {
        goal = Math.round(Math.max(88, Math.min(goal, side * 0.65)));
      }
    } else {
      const trayFrac = g >= 4 ? 0.33 : 0.31;
      const trayMin = fr.height < 640 ? (g >= 4 ? 120 : 108) : g >= 4 ? 160 : 140;
      const trayMax = fr.height < 640 ? (g >= 4 ? 200 : 180) : g >= 4 ? 248 : 220;
      const trayBudget = Math.min(trayMax, Math.max(trayMin, fr.height * trayFrac));
      const stageW = fr.width - 16;
      const stageH = fr.height - trayBudget - 8;
      const byW = (stageW - gap) / 2;
      const byH = stageH;
      const maxBoard = fr.width < 520 ? 200 : 260;
      side = Math.round(Math.max(110, Math.min(maxBoard, byW, byH)));
      goal = side;
    }

    const sideStable =
      !opts?.force && Math.abs(side - boardPxRef.current) < 8;
    const goalStable =
      !opts?.force && Math.abs(goal - goalPxRef.current) < 8;
    if (sideStable && goalStable) {
      const boardEl = boardInnerRef.current;
      const br = boardEl?.getBoundingClientRect();
      const boardW = br && br.width > 0 ? br.width : boardPxRef.current * 0.94;
      const cell = boardW / g;
      const piecePx = cell * ((CELL + TAB * 2) / CELL);
      const pct = (piecePx / fr.width) * 100;
      setPieceSizePct(Math.min(landscape ? 34 : compact ? 30 : 28, Math.max(12, pct)));
      return;
    }

    boardPxRef.current = side;
    goalPxRef.current = goal;
    setBoardPx(side);
    setGoalPx(goal);

    const boardEl = boardInnerRef.current;
    const br = boardEl?.getBoundingClientRect();
    const boardW = br && br.width > 0 ? br.width : side * 0.94;
    const cell = boardW / g;
    const piecePx = cell * ((CELL + TAB * 2) / CELL);
    const pct = (piecePx / fr.width) * 100;
    setPieceSizePct(Math.min(landscape ? 34 : compact ? 30 : 28, Math.max(12, pct)));
  }, []);

  useEffect(() => {
    measureLayout({ force: true });
    const onWinResize = () => measureLayout({ force: true });
    window.addEventListener("resize", onWinResize);
    const vv = window.visualViewport;
    vv?.addEventListener("resize", onWinResize);
    const field = playfieldRef.current;
    const ro =
      typeof ResizeObserver !== "undefined" && field
        ? new ResizeObserver(() => measureLayout({ force: true }))
        : null;
    if (field && ro) ro.observe(field);
    return () => {
      window.removeEventListener("resize", onWinResize);
      vv?.removeEventListener("resize", onWinResize);
      ro?.disconnect();
    };
  }, [measureLayout, playing, levelIndex]);

  const slotCenterPct = useCallback((slot: number) => {
    const field = playfieldRef.current;
    const board = boardInnerRef.current;
    if (!field || !board) return null;
    const g = LEVEL_GRIDS[levelIndexRef.current]!;
    const fr = field.getBoundingClientRect();
    const br = board.getBoundingClientRect();
    const r = Math.floor(slot / g);
    const c = slot % g;
    const cellW = br.width / g;
    const cellH = br.height / g;
    const cx = br.left - fr.left + (c + 0.5) * cellW;
    const cy = br.top - fr.top + (r + 0.5) * cellH;
    return {
      x: (cx / fr.width) * 100,
      y: (cy / fr.height) * 100,
      snap: (cellW / fr.width) * 100 * SNAP_RATIO,
    };
  }, []);

  const endGame = (opts: {
    totalScore: number;
    detail: string;
  }) => {
    if (finalized.current) return;
    finalized.current = true;
    const points = Math.max(0, Math.min(1000, Math.round(opts.totalScore)));
    setResults(
      participantsRef.current.map((p) => ({
        participant: p,
        score: points,
        detail: opts.detail,
      })),
    );
    finishRef.current?.();
  };

  const startNextLevel = useCallback(() => {
    const next = levelIndexRef.current + 1;
    if (next >= LEVEL_GRIDS.length) return;
    priorPlacedRef.current += pieceCountRef.current;
    const nextGrid = LEVEL_GRIDS[next]!;
    const nextCount = nextGrid * nextGrid;
    revealingRef.current = false;
    setRevealing(false);
    setDraggingId(null);
    setHoverSlot(null);
    dragOriginRef.current = null;
    const cleared = emptyBoard(nextCount);
    boardRef.current = cleared;
    setBoard(cleared);
    setLoose(shuffleLoose(nextCount));
    startedAt.current = Date.now();
    setElapsedMs(0);
    setLevelIndex(next);
    requestAnimationFrame(() => {
      measureLayout({ force: true });
      requestAnimationFrame(() => measureLayout({ force: true }));
    });
  }, [measureLayout]);

  useEffect(() => {
    if (!playing || results || finalized.current || revealing) return;
    if (!startedAt.current) startedAt.current = Date.now();
    const id = setInterval(() => setElapsedMs(Date.now() - startedAt.current), 50);
    return () => clearInterval(id);
  }, [playing, results, revealing, levelIndex]);

  // After a level clears, show the full puzzle briefly, then advance or score
  useEffect(() => {
    if (!revealing || finalized.current) return;
    play(isLastLevel ? "fanfare" : "correct");
    const t = setTimeout(() => {
      const level = levelIndexRef.current;
      const ms = levelSolveMsRef.current;
      const levelPts = scoreLevel(
        level,
        ms,
        true,
        pieceCountRef.current,
        pieceCountRef.current,
      );
      if (level >= LEVEL_GRIDS.length - 1) {
        const total = priorScoreRef.current + levelPts;
        endGame({
          totalScore: total,
          detail: `${total} pts · both levels cleared`,
        });
      } else {
        priorScoreRef.current = levelPts;
        startNextLevel();
      }
    }, REVEAL_MS);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealing]);

  const beginReveal = (ms: number) => {
    if (revealingRef.current || finalized.current) return;
    revealingRef.current = true;
    levelSolveMsRef.current = ms;
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

  /** Nearest empty slot under the pointer (any slot — wrong pieces allowed). */
  const nearestEmptySlot = useCallback(
    (x: number, y: number) => {
      const slots = boardRef.current;
      let best: number | null = null;
      let bestDist = Infinity;
      for (let slot = 0; slot < slots.length; slot++) {
        if (slots[slot] != null) continue;
        const home = slotCenterPct(slot);
        if (!home) continue;
        const d = Math.hypot(x - home.x, y - home.y);
        if (d < home.snap && d < bestDist) {
          bestDist = d;
          best = slot;
        }
      }
      return best;
    },
    [slotCenterPct],
  );

  const beginDrag = (pieceId: number, e: React.PointerEvent) => {
    if (finalized.current || revealingRef.current || !playing) return;
    e.preventDefault();
    e.stopPropagation();
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    play("click");
    const pt = clientToPct(e.clientX, e.clientY);
    dragPosRef.current = pt;
    setDragPos(pt);
    setDraggingId(pieceId);
  };

  const onTrayPointerDown = (pieceId: number, e: React.PointerEvent) => {
    dragOriginRef.current = { kind: "tray" };
    beginDrag(pieceId, e);
  };

  const onBoardPointerDown = (slot: number, pieceId: number, e: React.PointerEvent) => {
    // Lift off the board so the slot frees for drop targeting / repositioning
    const next = boardRef.current.slice();
    next[slot] = null;
    boardRef.current = next;
    setBoard(next);
    dragOriginRef.current = { kind: "board", slot };
    beginDrag(pieceId, e);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (draggingId === null) return;
    const pt = clientToPct(e.clientX, e.clientY);
    const x = Math.min(94, Math.max(6, pt.x));
    const y = Math.min(94, Math.max(6, pt.y));
    dragPosRef.current = { x, y };
    setDragPos({ x, y });
    setHoverSlot(nearestEmptySlot(x, y));
  };

  const onPointerUp = () => {
    if (draggingId === null) return;
    const id = draggingId;
    const pos = dragPosRef.current;
    const origin = dragOriginRef.current;
    setDraggingId(null);
    setHoverSlot(null);
    dragOriginRef.current = null;

    const target = nearestEmptySlot(pos.x, pos.y);
    if (target != null) {
      const next = boardRef.current.slice();
      next[target] = id;
      boardRef.current = next;
      setBoard(next);
      if (origin?.kind === "tray") {
        setLoose((prev) => prev.filter((p) => p.id !== id));
      }
      play(id === target ? "correct" : "click");
      if (isBoardSolved(next)) {
        beginReveal(Date.now() - startedAt.current);
      }
      return;
    }

    // Missed the board — return to tray (from tray or from a lifted board piece)
    if (origin?.kind === "board") {
      setLoose((prev) => {
        if (prev.some((p) => p.id === id)) return prev;
        return [
          ...prev,
          { id, rot: Math.random() * 36 - 18 },
        ];
      });
    }
    play("click");
  };

  const correctPlaced = useMemo(() => {
    const set = new Set<number>();
    board.forEach((pieceId, slot) => {
      if (pieceId === slot) set.add(slot);
    });
    return set;
  }, [board]);

  const solvedCount = correctPlaced.size;
  const draggingPieceId = draggingId;
  const showFullPuzzle = revealing || isBoardSolved(board);
  const trayCols = grid >= 4 ? 4 : 3;

  return (
    <GameShell
      gameId="speed-puzzle"
      title="Speed Puzzle"
      durationSec={LEVEL_DURATION_SEC[levelIndex] ?? 60}
      supportsHuddle
      hideTimer
      onTimeUp={() => {
        if (finalized.current) return;
        // Cleared current level; let the reveal timeout bank score / advance
        if (revealingRef.current) {
          if (levelIndexRef.current >= LEVEL_GRIDS.length - 1) {
            const l2 = scoreLevel(
              levelIndexRef.current,
              levelSolveMsRef.current,
              true,
              pieceCountRef.current,
              pieceCountRef.current,
            );
            endGame({
              totalScore: priorScoreRef.current + l2,
              detail: `${priorScoreRef.current + l2} pts · both levels cleared`,
            });
          }
          return;
        }
        const level = levelIndexRef.current;
        const ms = Date.now() - startedAt.current;
        const correct = correctCount(boardRef.current);
        const partial = scoreLevel(
          level,
          ms,
          false,
          correct,
          pieceCountRef.current,
        );
        const total = priorScoreRef.current + partial;
        const placedTotal = priorPlacedRef.current + correct;
        endGame({
          totalScore: total,
          detail: `${total} pts · ${placedTotal}/${TOTAL_PIECES} placed`,
        });
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
            startedAt.current = Date.now();
            requestAnimationFrame(() => {
              measureLayout({ force: true });
              requestAnimationFrame(() => measureLayout({ force: true }));
            });
          });
        }
        if (results) return null;

        const remainSec = Math.ceil(remainingMs / 1000);
        const lowTime = !revealing && remainingMs < 15_000;

        return (
          <div
            className="relative mx-auto flex min-h-0 w-full max-w-lg flex-1 flex-col overflow-x-hidden px-2 pt-1 sm:max-w-xl sm:px-4 sm:pt-2 md:max-w-2xl"
            style={{
              paddingBottom: "max(0.35rem, calc(env(safe-area-inset-bottom, 0px) + 0.25rem))",
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-4 -z-10 mx-auto h-48 w-[90%] max-w-lg rounded-full opacity-60 blur-3xl"
              style={{
                background:
                  "radial-gradient(circle, color-mix(in srgb, var(--primary-from) 16%, transparent), color-mix(in srgb, var(--accent-2) 12%, transparent) 55%, transparent 72%)",
              }}
            />

            {/* HUD — stats only; reference lives beside the board */}
            <div className="mb-2 flex w-full shrink-0 items-end justify-between gap-2 sm:mb-3">
              <div className="min-w-0">
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--fg-muted)] sm:text-[11px]">
                  Level {levelIndex + 1}
                  <span className="text-[var(--fg-muted)]/70"> / {LEVEL_GRIDS.length}</span>
                </p>
                <div className="mt-0.5 flex items-baseline gap-1">
                  <motion.span
                    key={solvedCount}
                    initial={{ y: 5, opacity: 0.4 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="font-display text-3xl font-extrabold tabular-nums leading-none sm:text-4xl"
                  >
                    {solvedCount}
                  </motion.span>
                  <span className="font-display text-base font-bold text-[var(--fg-muted)] sm:text-lg">
                    /{pieceCount}
                  </span>
                </div>
                <div className="mt-1.5 h-1 w-24 overflow-hidden rounded-full bg-white/10 sm:w-28">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      background:
                        "linear-gradient(90deg, var(--primary-from), var(--accent-2))",
                    }}
                    initial={false}
                    animate={{ width: `${(solvedCount / pieceCount) * 100}%` }}
                    transition={{ type: "spring", stiffness: 280, damping: 28 }}
                  />
                </div>
              </div>

              <div className="flex items-end gap-3 sm:gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
                    Elapsed
                  </p>
                  <p className="font-display text-xl font-extrabold tabular-nums leading-none sm:text-2xl">
                    {revealing
                      ? isLastLevel
                        ? "Done"
                        : "Clear"
                      : formatTime(elapsedMs)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[var(--fg-muted)]">
                    Left
                  </p>
                  <p
                    className={`font-display text-xl font-extrabold tabular-nums leading-none sm:text-2xl ${
                      lowTime ? "text-amber-300" : "text-[var(--ring)]"
                    }`}
                  >
                    {revealing ? "—" : `${remainSec}s`}
                  </p>
                </div>
              </div>
            </div>

            <div
              ref={playfieldRef}
              className={`relative isolate flex min-h-0 w-full min-w-0 flex-1 overflow-hidden rounded-2xl border border-white/[0.08] select-none sm:rounded-3xl ${
                sideBySide ? "flex-row items-stretch gap-2 p-2" : "flex-col"
              }`}
              style={{
                background: `
                  radial-gradient(ellipse at 20% 0%, color-mix(in srgb, var(--primary-from) 10%, transparent), transparent 45%),
                  radial-gradient(ellipse at 90% 100%, color-mix(in srgb, var(--accent-2) 12%, transparent), transparent 50%),
                  linear-gradient(165deg, #1a2030 0%, #12171f 48%, #0c1018 100%)
                `,
                boxShadow:
                  "inset 0 1px 0 rgba(255,255,255,0.06), 0 18px 40px rgba(0,0,0,0.35)",
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
              {/* Reference + board row */}
              <div
                className={`relative z-10 flex min-w-0 shrink-0 items-center justify-center ${
                  sideBySide
                    ? "flex-1 gap-2 px-1 py-1"
                    : compactGoal
                      ? "w-full gap-2 px-2.5 pt-2"
                      : "w-full gap-2 px-2 pt-2 sm:gap-3 sm:px-4 sm:pt-3"
                }`}
              >
                {!showFullPuzzle && (
                  <motion.div
                    key={`goal-${levelIndex}`}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={`relative shrink-0 overflow-hidden ring-1 ring-white/15 ${
                      compactGoal ? "rounded-lg" : "rounded-xl sm:rounded-2xl"
                    }`}
                    style={{
                      width: goalPx,
                      height: goalPx,
                      boxShadow:
                        "0 10px 24px rgba(0,0,0,0.4), 0 0 0 1px color-mix(in srgb, var(--primary-from) 22%, transparent)",
                      background: "var(--bg-elevated)",
                    }}
                    title="Puzzle reference"
                  >
                    <img
                      src={puzzleImage}
                      alt="Puzzle reference"
                      draggable={false}
                      className="h-full w-full object-cover"
                      style={{ WebkitUserDrag: "none" } as CSSProperties}
                    />
                    <span
                      className={`absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent text-center font-semibold uppercase tracking-[0.18em] text-white/90 ${
                        compactGoal
                          ? "px-1.5 pb-1 pt-5 text-[9px]"
                          : "px-2 pb-1.5 pt-6 text-[10px] sm:text-[11px]"
                      }`}
                    >
                      Goal
                    </span>
                  </motion.div>
                )}

                <div
                  className={`relative shrink-0 ${
                    compactGoal ? "rounded-lg" : "rounded-xl sm:rounded-2xl"
                  }`}
                  style={{
                    width: boardPx,
                    height: boardPx,
                    maxWidth: showFullPuzzle || compactGoal ? "100%" : undefined,
                    background:
                      "linear-gradient(145deg, #c4a574 0%, #a8845a 40%, #7a5c32 100%)",
                    boxShadow:
                      "inset 0 2px 3px rgba(255,255,255,0.4), inset 0 -5px 12px rgba(0,0,0,0.35), 0 14px 32px rgba(0,0,0,0.45)",
                    padding: boardPx < 180 ? "2.5%" : "3.25%",
                  }}
                >
                  <div
                    ref={boardInnerRef}
                    className="relative h-full w-full overflow-hidden rounded-md sm:rounded-lg"
                    style={{
                      background:
                        "radial-gradient(circle at 38% 28%, #2a3344, #121820 72%)",
                      boxShadow:
                        "inset 0 3px 16px rgba(0,0,0,0.6), inset 0 0 0 1px rgba(255,255,255,0.04)",
                    }}
                  >
                    {showFullPuzzle ? (
                      <motion.img
                        key={`full-${levelIndex}`}
                        src={puzzleImage}
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
                        {Array.from({ length: pieceCount }).map((_, slot) => {
                          if (board[slot] != null) return null;
                          const glowing = hoverSlot === slot;
                          return (
                            <div
                              key={`${levelIndex}-ghost-${slot}`}
                              className="absolute z-[1] transition-opacity"
                              style={slotBoxStyle(slot, grid)}
                            >
                              <PieceArt
                                pieceId={slot}
                                edges={edgeMap[slot]!}
                                uid={`${uid}-l${levelIndex}`}
                                grid={grid}
                                imageHref={puzzleImage}
                                ghost
                                placed={glowing}
                              />
                            </div>
                          );
                        })}

                        <div className="pointer-events-none absolute inset-0 z-[5]">
                          <PlacedPuzzleLayer
                            placed={correctPlaced}
                            edgeMap={edgeMap}
                            uid={`${uid}-l${levelIndex}`}
                            grid={grid}
                            imageHref={puzzleImage}
                          />
                        </div>

                        {board.map((pieceId, slot) => {
                          if (pieceId == null) return null;
                          const isCorrect = pieceId === slot;
                          return (
                            <button
                              key={`${levelIndex}-board-${slot}-${pieceId}`}
                              type="button"
                              aria-label={
                                isCorrect
                                  ? `Move correct piece ${pieceId + 1}`
                                  : `Move misplaced piece ${pieceId + 1}`
                              }
                              className="absolute z-[6] touch-none outline-none"
                              style={{
                                ...slotBoxStyle(slot, grid),
                                cursor: "grab",
                                WebkitTouchCallout: "none",
                                WebkitUserSelect: "none",
                                userSelect: "none",
                              }}
                              onPointerDown={(e) => onBoardPointerDown(slot, pieceId, e)}
                              onPointerMove={onPointerMove}
                              onPointerUp={onPointerUp}
                              onPointerCancel={onPointerUp}
                              onContextMenu={(e) => e.preventDefault()}
                              onDragStart={(e) => e.preventDefault()}
                            >
                              {isCorrect ? null : (
                                <div
                                  className="pointer-events-none h-full w-full"
                                  style={{
                                    filter:
                                      "drop-shadow(0 4px 10px rgba(0,0,0,0.45))",
                                  }}
                                >
                                  <PieceArt
                                    pieceId={pieceId}
                                    edges={edgeMap[pieceId]!}
                                    uid={`${uid}-l${levelIndex}-mis`}
                                    grid={grid}
                                    imageHref={puzzleImage}
                                  />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Tray */}
              {!showFullPuzzle && (
              <div
                className={`relative z-10 flex min-h-0 min-w-0 flex-col overflow-hidden ${
                  sideBySide
                    ? "mx-0 mb-0 mt-0 w-[min(42%,17rem)] flex-1 rounded-xl"
                    : compactGoal
                      ? "mx-2 mb-2 mt-1.5 min-h-[5.75rem] max-h-[40%] flex-1 rounded-xl"
                      : "mx-2 mb-2 mt-2 min-h-[6.5rem] max-h-[42%] flex-1 rounded-2xl sm:mx-4 sm:mb-3 sm:mt-2.5 sm:min-h-[8rem] sm:rounded-3xl"
                }`}
                style={{
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.04), rgba(0,0,0,0.22))",
                  boxShadow: "inset 0 1px 0 rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  paddingBottom: sideBySide
                    ? "0.25rem"
                    : "max(0.25rem, env(safe-area-inset-bottom, 0px))",
                }}
              >
                <div className="flex shrink-0 items-center justify-between px-2.5 pt-2 sm:px-3 sm:pt-2.5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-muted)]">
                    Pieces
                  </p>
                  <p className="text-[11px] tabular-nums text-[var(--fg-muted)]">
                    {loose.length} left
                  </p>
                </div>
                <div
                  className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto overscroll-contain"
                  style={{ scrollbarGutter: "stable" }}
                >
                  <div
                    className={`grid p-2 sm:p-3 ${
                      trayCols === 4
                        ? "grid-cols-4 gap-1.5 sm:gap-2"
                        : compactGoal
                          ? "grid-cols-3 gap-1.5"
                          : "grid-cols-3 gap-1.5 sm:gap-2.5"
                    } ${sideBySide ? "auto-rows-max content-start" : ""}`}
                  >
                    {loose.map((piece) => {
                      const isDragging = draggingId === piece.id;
                      return (
                        <button
                          key={`${levelIndex}-${piece.id}`}
                          type="button"
                          aria-label={`Puzzle piece ${piece.id + 1}`}
                          className={`relative mx-auto flex aspect-square w-full touch-none items-center justify-center overflow-hidden outline-none ${
                            compactGoal ? "rounded-lg" : "rounded-xl sm:rounded-2xl"
                          } ${
                            trayCols === 4
                              ? "max-w-[3.25rem] sm:max-w-[4.75rem] md:max-w-[5.25rem]"
                              : compactGoal
                                ? "max-w-[3.5rem]"
                                : "max-w-[3.75rem] sm:max-w-[5.5rem] md:max-w-[6rem]"
                          }`}
                          style={{
                            opacity: isDragging ? 0.22 : 1,
                            cursor: isDragging ? "grabbing" : "grab",
                            background:
                              "linear-gradient(160deg, rgba(255,255,255,0.07), rgba(255,255,255,0.02))",
                            boxShadow: isDragging
                              ? "none"
                              : "inset 0 1px 0 rgba(255,255,255,0.08), 0 6px 14px rgba(0,0,0,0.25)",
                            border: "1px solid rgba(255,255,255,0.08)",
                            WebkitTouchCallout: "none",
                            WebkitUserSelect: "none",
                            userSelect: "none",
                          }}
                          onPointerDown={(e) => onTrayPointerDown(piece.id, e)}
                          onPointerMove={onPointerMove}
                          onPointerUp={onPointerUp}
                          onPointerCancel={onPointerUp}
                          onContextMenu={(e) => e.preventDefault()}
                          onDragStart={(e) => e.preventDefault()}
                        >
                          <motion.div
                            className="pointer-events-none h-[90%] w-[90%] overflow-hidden"
                            animate={{ rotate: isDragging ? 0 : piece.rot }}
                            transition={{ type: "spring", stiffness: 400, damping: 26 }}
                          >
                            <PieceArt
                              pieceId={piece.id}
                              edges={edgeMap[piece.id]!}
                              uid={`${uid}-l${levelIndex}`}
                              grid={grid}
                              imageHref={puzzleImage}
                            />
                          </motion.div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
              )}

              {revealing && (
                <motion.div
                  className={`z-20 px-3 pb-3 text-center ${
                    sideBySide ? "absolute inset-x-0 bottom-1" : ""
                  }`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <p className="inline-flex rounded-full border border-white/10 bg-black/35 px-3.5 py-1.5 text-sm text-[var(--fg)] backdrop-blur-sm sm:text-base">
                    {isLastLevel
                      ? `Solved in ${formatTime(solveMsRef.current)} — scoring…`
                      : "Next up: 16-piece puzzle…"}
                  </p>
                </motion.div>
              )}

              {draggingPieceId != null && (
                <div
                  className="pointer-events-none absolute z-50"
                  style={{
                    width: `${pieceSizePct}%`,
                    left: `${dragPos.x}%`,
                    top: `${dragPos.y}%`,
                    transform: "translate(-50%, -50%)",
                    filter: "drop-shadow(0 12px 24px rgba(0,0,0,0.55))",
                  }}
                >
                  <motion.div initial={false} animate={{ scale: 1.14 }}>
                    <PieceArt
                      pieceId={draggingPieceId}
                      edges={edgeMap[draggingPieceId]!}
                      uid={`${uid}-drag`}
                      grid={grid}
                      imageHref={puzzleImage}
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
