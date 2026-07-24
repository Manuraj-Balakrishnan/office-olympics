# Office Olympics

Polished multiplayer mini-game tournament platform for office team-building.

## Stack

- **Next.js** (App Router) + TypeScript
- **Tailwind CSS** + Framer Motion + Zustand (local prefs / classic mode)
- **Cloudflare Workers** via OpenNext + **D1** for multiplayer session state
- **howler.js** · canvas-confetti · html2canvas · qrcode.react

## Multiplayer flow

1. **Host** → `/host` → choose Individuals/Teams + Host-paced or Self-paced → get **OFFICE-####** code + QR  
2. **Players** → `/join` or scan QR → name + team (or solo) → `/play/[sessionId]`  
3. Host starts tournament; unlocks games (host-paced) or opens a time window (self-paced)  
4. Scores normalize to **0–1000** per game and stream to **`/leaderboard/[sessionId]`** (cast this)  
5. Final podium + MVP callouts + team/individual breakdown  

## Local development

```bash
npm install
npm run cf:migrate:local   # apply D1 schema to local SQLite (database: office)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

`initOpenNextCloudflareForDev` in `next.config.ts` exposes local D1 bindings during `next dev`. Classic single-device mode remains at `/setup`.

If you see **Session not found**, create a **new** host session (old in-memory lobby URLs will not exist in D1). Also make sure local migrations have been applied.

Preview the Workers runtime locally:

```bash
npm run preview
```

## Deploy on Cloudflare

1. Create a D1 database and paste its id into `wrangler.jsonc`:

```bash
npx wrangler d1 create office-olympics-db
# update database_id in wrangler.jsonc
```

2. Apply migrations to remote D1:

```bash
npm run cf:migrate
```

3. Deploy:

```bash
npm run deploy
```

Or connect the GitHub repo in the Cloudflare dashboard (Workers → Create → connect repo) with build command `npx opennextjs-cloudflare build`.
