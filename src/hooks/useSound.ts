"use client";

import { useCallback, useEffect, useRef } from "react";
import { Howl } from "howler";
import { useTournamentStore } from "@/store/useTournamentStore";

/** Tiny procedural WAV tones as data URIs — no external assets required */
function toneDataUri(
  freq: number,
  durationSec: number,
  type: "sine" | "square" | "triangle" = "sine",
  volume = 0.35,
): string {
  const sampleRate = 22050;
  const samples = Math.floor(sampleRate * durationSec);
  const buffer = new ArrayBuffer(44 + samples * 2);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) view.setUint8(offset + i, str.charCodeAt(i));
  };

  writeStr(0, "RIFF");
  view.setUint32(4, 36 + samples * 2, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true);
  view.setUint16(22, 1, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeStr(36, "data");
  view.setUint32(40, samples * 2, true);

  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const env = Math.min(1, t * 40) * Math.max(0, 1 - t / durationSec);
    let sample = 0;
    const phase = 2 * Math.PI * freq * t;
    if (type === "sine") sample = Math.sin(phase);
    else if (type === "square") sample = Math.sin(phase) > 0 ? 1 : -1;
    else sample = 2 * Math.abs(2 * ((freq * t) % 1) - 1) - 1;
    const val = Math.max(-1, Math.min(1, sample * env * volume));
    view.setInt16(44 + i * 2, val * 32767, true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]!);
  return `data:audio/wav;base64,${btoa(binary)}`;
}

type Sfx =
  | "click"
  | "tick"
  | "go"
  | "correct"
  | "wrong"
  | "timesup"
  | "complete"
  | "fanfare"
  | "simon0"
  | "simon1"
  | "simon2"
  | "simon3";

let cache: Partial<Record<Sfx, Howl>> | null = null;

function getSounds(): Record<Sfx, Howl> {
  if (cache && cache.click) return cache as Record<Sfx, Howl>;
  cache = {
    click: new Howl({ src: [toneDataUri(800, 0.05, "sine", 0.2)], volume: 0.4 }),
    tick: new Howl({ src: [toneDataUri(520, 0.12, "sine", 0.35)], volume: 0.5 }),
    go: new Howl({ src: [toneDataUri(880, 0.25, "triangle", 0.45)], volume: 0.6 }),
    correct: new Howl({ src: [toneDataUri(660, 0.12, "sine", 0.4)], volume: 0.55 }),
    wrong: new Howl({ src: [toneDataUri(180, 0.18, "triangle", 0.25)], volume: 0.35 }),
    timesup: new Howl({ src: [toneDataUri(440, 0.35, "square", 0.2)], volume: 0.45 }),
    complete: new Howl({ src: [toneDataUri(523, 0.4, "sine", 0.4)], volume: 0.55 }),
    fanfare: new Howl({ src: [toneDataUri(784, 0.55, "triangle", 0.45)], volume: 0.65 }),
    simon0: new Howl({ src: [toneDataUri(329.63, 0.28, "sine", 0.4)], volume: 0.5 }),
    simon1: new Howl({ src: [toneDataUri(392.0, 0.28, "sine", 0.4)], volume: 0.5 }),
    simon2: new Howl({ src: [toneDataUri(493.88, 0.28, "sine", 0.4)], volume: 0.5 }),
    simon3: new Howl({ src: [toneDataUri(587.33, 0.28, "sine", 0.4)], volume: 0.5 }),
  };
  return cache as Record<Sfx, Howl>;
}

export function useSound() {
  const muted = useTournamentStore((s) => s.muted);
  const mutedRef = useRef(muted);
  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const play = useCallback((name: Sfx) => {
    if (mutedRef.current) return;
    try {
      getSounds()[name].play();
    } catch {
      /* ignore audio errors */
    }
  }, []);

  return { play, muted };
}
