import { normalizeToThousand, clampRawScore } from "../src/lib/normalizeScore";

function assert(cond: unknown, msg: string): asserts cond {
  if (!cond) throw new Error(msg);
}

// Reaction: faster = higher
assert(normalizeToThousand("reaction", 150) >= 990, "elite reaction");
assert(normalizeToThousand("reaction", 300) > normalizeToThousand("reaction", 500), "faster better");
assert(normalizeToThousand("reaction", 1200) < 100, "false start low");
assert(normalizeToThousand("reaction", 150) === 1000, "reaction 150ms");
assert(normalizeToThousand("reaction", 300) === 790, "reaction 300ms");

// Simon: perfect clear = 10 steps → 1000
assert(normalizeToThousand("simon", 10) === 1000, "simon perfect");
assert(normalizeToThousand("simon", 5) === 500, "simon half");
assert(normalizeToThousand("simon", 15) === 1000, "simon over-cap clamps to 10");
assert(clampRawScore("simon", 99) === 10, "simon raw cap");

// Memory: perfect clear ~1100 raw → 1000; partial stays modest
assert(normalizeToThousand("memory", 100) < 200, "1 match modest");
assert(normalizeToThousand("memory", 400) < 400, "half board modest");
assert(normalizeToThousand("memory", 900) < 900, "messy clear not max");
assert(normalizeToThousand("memory", 1100) === 1000, "perfect clear");
assert(normalizeToThousand("memory", 1200) === 1000, "clamped elite");

// Spot: (found/total)*800 + speed≤300 − hints; max 1100
assert(normalizeToThousand("spot-difference", 1100) === 1000, "spot clear+speed");
assert(normalizeToThousand("spot-difference", 800) === 727, "spot all finds no speed");
assert(normalizeToThousand("spot-difference", 400) < 400, "spot partial");
assert(clampRawScore("spot-difference", 9999) === 1100, "spot raw cap");

// One-second: 2 scenes × 5 questions × 100 pts → max 1000
assert(normalizeToThousand("one-second", 1000) === 1000, "one-sec max");
assert(normalizeToThousand("one-second", 500) === 500, "one-sec half");
assert(clampRawScore("one-second", 9999) === 1000, "one-sec raw cap");

// Stroop: 10 pts per correct; ~100 correct → 1000
assert(normalizeToThousand("stroop", 1000) === 1000, "stroop elite");
assert(normalizeToThousand("stroop", 0) === 0, "stroop zero");
assert(normalizeToThousand("stroop", 500) === 500, "stroop mid");
assert(clampRawScore("stroop", 9999) === 1000, "stroop raw cap");
assert(normalizeToThousand("stroop", 250) === 250, "stroop 25 correct");

// Typing: ~83 WPM @ 100% = 1000 (×12 multiplier)
assert(clampRawScore("typing", 99999) === 1800, "typing raw cap");
assert(normalizeToThousand("typing", 1000) === 1000, "typing ~83 WPM elite");
assert(normalizeToThousand("typing", 720) === 720, "typing 60 WPM");
assert(normalizeToThousand("typing", 1800) === 1000, "typing over-cap");

// Speed puzzle: points 0–1000, faster solve earns more
assert(normalizeToThousand("speed-puzzle", 1000) === 1000, "puzzle elite pts");
assert(
  normalizeToThousand("speed-puzzle", 800) > normalizeToThousand("speed-puzzle", 400),
  "puzzle higher pts better",
);
assert(normalizeToThousand("speed-puzzle", 0) === 0, "puzzle zero");
assert(normalizeToThousand("speed-puzzle", 150) === 150, "puzzle partial credit");

// Trivia: 10 questions × 100 pts → max 1000
assert(normalizeToThousand("trivia", 1000) === 1000, "trivia max");
assert(normalizeToThousand("trivia", 500) === 500, "trivia half");
assert(clampRawScore("trivia", 9999) === 1000, "trivia raw cap");
assert(normalizeToThousand("trivia", 1000) === normalizeToThousand("logo-remix", 1000), "quiz games match");

// Logo Remix: 10 logos × 100 pts → max 1000
assert(normalizeToThousand("logo-remix", 1000) === 1000, "logo elite");
assert(normalizeToThousand("logo-remix", 500) === 500, "logo half");
assert(clampRawScore("logo-remix", 9999) === 1000, "logo raw cap");

console.log("Score normalize checks: PASS");
