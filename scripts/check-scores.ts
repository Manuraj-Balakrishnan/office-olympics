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

// Memory: perfect clear ~1100 raw → 1000; partial stays modest
assert(normalizeToThousand("memory", 100) < 200, "1 match modest");
assert(normalizeToThousand("memory", 400) < 400, "half board modest");
assert(normalizeToThousand("memory", 900) < 900, "messy clear not max");
assert(normalizeToThousand("memory", 1100) === 1000, "perfect clear");
assert(normalizeToThousand("memory", 1200) === 1000, "clamped elite");

// Spot
assert(normalizeToThousand("spot-difference", 1100) === 1000, "spot clear");
assert(normalizeToThousand("spot-difference", 400) < 400, "spot partial");

// One-second
assert(normalizeToThousand("one-second", 600) === 1000, "one-sec max");
assert(normalizeToThousand("one-second", 300) === 500, "one-sec half");

// Stroop: ~45 correct in 90s = 1000
assert(normalizeToThousand("stroop", 45) === 1000, "stroop elite");
assert(normalizeToThousand("stroop", 0) === 0, "stroop zero");
assert(normalizeToThousand("stroop", 22) === 489, "stroop mid");
assert(clampRawScore("stroop", 999) === 80, "stroop raw cap");

// Typing capped raw
assert(clampRawScore("typing", 99999) === 1500, "typing raw cap");
assert(normalizeToThousand("typing", 1000) === 1000, "typing elite");

// Speed puzzle: points 0–1000, faster solve earns more
assert(normalizeToThousand("speed-puzzle", 1000) === 1000, "puzzle elite pts");
assert(
  normalizeToThousand("speed-puzzle", 800) > normalizeToThousand("speed-puzzle", 400),
  "puzzle higher pts better",
);
assert(normalizeToThousand("speed-puzzle", 0) === 0, "puzzle zero");

// Trivia
assert(normalizeToThousand("trivia", 3000) === 1000, "trivia max");
assert(normalizeToThousand("trivia", 1500) === 500, "trivia half");

// Word scramble
assert(normalizeToThousand("word-scramble", 12) === 1000, "scramble elite");
assert(normalizeToThousand("word-scramble", 6) === 500, "scramble half");

console.log("Score normalize checks: PASS");
