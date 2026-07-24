# Office Olympics

Polished multiplayer mini-game tournament platform for office team-building.

## Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** + Framer Motion + Zustand (local prefs / classic mode)
- **Session API** (in-memory + Cloudflare D1 schema) for multiplayer
- **howler.js** · canvas-confetti · html2canvas · qrcode.react

## Multiplayer flow

1. **Host** → `/host` → choose Individuals/Teams + Host-paced or Self-paced → get **OFFICE-####** code + QR  
2. **Players** → `/join` or scan QR → name + team (or solo) → `/play/[sessionId]`  
3. Host starts tournament; unlocks games (host-paced) or opens a time window (self-paced)  
4. Scores normalize to **0–1000** per game and stream to **`/leaderboard/[sessionId]`** (cast this)  
5. Final podium + MVP callouts + team/individual breakdown  

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Classic single-device mode remains at `/setup`.

## Cloudflare D1 (optional)

Schema includes `sessions` in `migrations/0001_init.sql`. Runtime uses an in-process session store for local/dev; wire D1 persistence when deploying with OpenNext.
