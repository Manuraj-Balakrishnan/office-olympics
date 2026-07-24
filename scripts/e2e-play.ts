import {
  createSession,
  joinSession,
  startSession,
  submitScore,
  markGameComplete,
  resetCurrentGame,
  isRoundComplete,
  getGameScoreboard,
  getLeaderboard,
  finishSession,
  getSession,
  skipTurn,
} from "../src/lib/sessionStore";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

const created = createSession({ mode: "individuals", pacing: "host" });
const host = created.hostToken;
const id = created.id;
const code = created.joinCode;

const a = joinSession({ code, name: "Ada" });
const b = joinSession({ code, name: "Bob" });
assert(a.player.playerToken && b.player.playerToken, "missing tokens");

startSession(id, host);
let s = getSession(id)!;
assert(s.status === "active", "not active");
assert(s.currentGameId === "reaction", `expected reaction, got ${s.currentGameId}`);

submitScore(id, a.player.id, "reaction", 220, "220ms", true, a.player.playerToken);
submitScore(id, b.player.id, "reaction", 310, "310ms", true, b.player.playerToken);
s = getSession(id)!;
assert(isRoundComplete(s), "round should be complete");

const board = getGameScoreboard(s, "reaction");
assert(board[0]?.name === "Ada", `Ada should lead, got ${board[0]?.name}`);
assert(board[0]!.score! > board[1]!.score!, "faster reaction should normalize higher");

markGameComplete(id, host);
s = getSession(id)!;
assert(s.currentGameId === "simon", `expected simon, got ${s.currentGameId}`);
assert(s.playedGames.includes("reaction"), "reaction should be played");

submitScore(id, a.player.id, "simon", 5, "5 steps", false, a.player.playerToken);
resetCurrentGame(id, host);
s = getSession(id)!;
assert(!s.scores.some((x) => x.gameId === "simon"), "simon scores should clear");
assert(s.currentGameId === "simon", "still on simon after reset");

submitScore(id, a.player.id, "simon", 4, "4 steps", false, a.player.playerToken);
submitScore(id, b.player.id, "simon", 6, "6 steps", false, b.player.playerToken);
assert(isRoundComplete(getSession(id)!), "simon round complete");

markGameComplete(id, host);
s = getSession(id)!;
const mem = s.currentGameId!;
submitScore(id, a.player.id, mem, 500, "ok", false, a.player.playerToken);
skipTurn(id, host); // advance before bob — bob should be forfeited then can late-submit
s = getSession(id)!;
const bobForfeit = s.scores.find((x) => x.playerId === b.player.id && x.gameId === mem);
assert(bobForfeit?.detail === "Didn't finish", "bob should be forfeited on skip");
assert(bobForfeit?.score === 0, "forfeit is 0");
submitScore(id, b.player.id, mem, 400, "late", false, b.player.playerToken);
const bobLate = getSession(id)!.scores.find(
  (x) => x.playerId === b.player.id && x.gameId === mem,
);
assert(bobLate && bobLate.detail !== "Didn't finish", "late score should overwrite forfeit");
assert((bobLate?.score ?? 0) > 0, "late score should be > 0");
console.log("late submit OK for", mem);

const lb = getLeaderboard(getSession(id)!);
assert(lb.length === 2, "leaderboard size");
assert(lb[0]!.total >= lb[1]!.total, "sorted totals");

finishSession(id, host);
assert(getSession(id)!.status === "finished", "not finished");

const s2 = createSession({ mode: "individuals", pacing: "host" });
const j = joinSession({ code: s2.joinCode, name: "X" });
startSession(s2.id, s2.hostToken);
let rejected = false;
try {
  submitScore(
    s2.id,
    j.player.id,
    getSession(s2.id)!.currentGameId!,
    1,
    "x",
    false,
    "bad-token",
  );
} catch (e) {
  rejected = e instanceof Error && e.message.includes("Unauthorized");
}
assert(rejected, "should reject bad token");

// teams path
const t = createSession({ mode: "teams", pacing: "host" });
const p1 = joinSession({
  code: t.joinCode,
  name: "T1",
  createTeam: { name: "Alpha", emoji: "🦁" },
});
joinSession({
  code: t.joinCode,
  name: "T2",
  teamId: p1.player.teamId,
});
startSession(t.id, t.hostToken);
assert(getSession(t.id)!.teams.length === 1, "team exists");

console.log("E2E play-mode session logic: PASS");
