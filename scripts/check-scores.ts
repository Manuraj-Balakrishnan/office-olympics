import { normalizeToThousand, clampRawScore } from "../src/lib/normalizeScore";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

// Reaction: faster = higher
assert(normalizeToThousand("reaction", 150) >= 990, "elite reaction");
assert(normalizeToThousand("reaction", 300) > normalizeToThousand("reaction", 500), "faster better");
assert(normalizeToThousand("reaction", 1200) < 100, "false start low");

// Simon: 15 = 1000, 10 < 1000
assert(normalizeToThousand("simon", 15) === 1000, "simon 15");
assert(normalizeToThousand("simon", 10) < 1000, "simon 10 not max");
assert(normalizeToThousand("simon", 5) === 333, "simon 5");

// Memory: perfect clear shouldn't free-1000 on partial
assert(normalizeToThousand("memory", 100) < 200, "1 match modest");
assert(normalizeToThousand("memory", 1100) === 1000, "perfect clear");

// Spot
assert(normalizeToThousand("spot-difference", 1100) === 1000, "spot clear");
assert(normalizeToThousand("spot-difference", 400) < 400, "spot partial");

// One-second
assert(normalizeToThousand("one-second", 600) === 1000, "one-sec max");
assert(normalizeToThousand("one-second", 300) === 500, "one-sec half");

// Stroop
assert(normalizeToThousand("stroop", 15) === 1000, "stroop perfect");
assert(normalizeToThousand("stroop", 0) === 0, "stroop zero");

// Typing capped raw
assert(clampRawScore("typing", 99999) === 1500, "typing raw cap");
assert(normalizeToThousand("typing", 1000) === 1000, "typing elite");

// Emoji: slow perfect (10*70=700) < fast
assert(normalizeToThousand("emoji-decode", 700) < 500, "emoji slow perfect");
assert(normalizeToThousand("emoji-decode", 1800) === 1000, "emoji fast perfect");

// Trivia
assert(normalizeToThousand("trivia", 3000) === 1000, "trivia max");
assert(normalizeToThousand("trivia", 1500) === 500, "trivia half");

// Word scramble
assert(normalizeToThousand("word-scramble", 12) === 1000, "scramble elite");
assert(normalizeToThousand("word-scramble", 6) === 500, "scramble half");

console.log("Score normalize checks: PASS");
