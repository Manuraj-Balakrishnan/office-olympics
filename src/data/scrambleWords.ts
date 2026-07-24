export const SCRAMBLE_WORDS = [
  "MEETING",
  "DEADLINE",
  "SLACK",
  "BUDGET",
  "AGENDA",
  "PROJECT",
  "TEAMWORK",
  "OFFICE",
  "KEYBOARD",
  "PRINTER",
  "COFFEE",
  "SYNCUP",
  "ROADMAP",
  "FEEDBACK",
  "STANDUP",
  "MILESTONE",
  "WORKFLOW",
  "INBOX",
  "CALENDAR",
  "MANAGER",
  "LAUNCH",
  "SPRINT",
  "CLIENT",
  "REPORT",
  "BRAINSTORM",
  "NETWORK",
  "PRESENT",
  "STRATEGY",
  "UPDATE",
  "REMOTE",
];

export function scrambleWord(word: string): string {
  const chars = word.split("");
  let scrambled = word;
  let attempts = 0;
  while (scrambled === word && attempts < 20) {
    for (let i = chars.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }
    scrambled = chars.join("");
    attempts++;
  }
  return scrambled;
}
