export type ScrambleEntry = {
  word: string;
  hint: string;
};

export const SCRAMBLE_WORDS: ScrambleEntry[] = [
  { word: "MEETING", hint: "Gathering on the calendar" },
  { word: "DEADLINE", hint: "When the work is due" },
  { word: "SLACK", hint: "Chat app for the team" },
  { word: "BUDGET", hint: "Money set aside for a plan" },
  { word: "AGENDA", hint: "List of topics for a meeting" },
  { word: "PROJECT", hint: "A piece of work with a goal" },
  { word: "TEAMWORK", hint: "Getting it done together" },
  { word: "OFFICE", hint: "Where the desks live" },
  { word: "KEYBOARD", hint: "You type on this" },
  { word: "PRINTER", hint: "Spits out paper copies" },
  { word: "COFFEE", hint: "Morning fuel in a mug" },
  { word: "SYNCUP", hint: "Quick catch-up call" },
  { word: "ROADMAP", hint: "Plan of what's coming next" },
  { word: "FEEDBACK", hint: "Notes on how you did" },
  { word: "STANDUP", hint: "Short daily team check-in" },
  { word: "MILESTONE", hint: "Big checkpoint on a project" },
  { word: "WORKFLOW", hint: "Steps to get work done" },
  { word: "INBOX", hint: "Where new emails land" },
  { word: "CALENDAR", hint: "Tracks dates and events" },
  { word: "MANAGER", hint: "Leads the team" },
  { word: "LAUNCH", hint: "Going live with a product" },
  { word: "SPRINT", hint: "Short focused work cycle" },
  { word: "CLIENT", hint: "The customer you work for" },
  { word: "REPORT", hint: "Written summary of results" },
  { word: "BRAINSTORM", hint: "Throwing out lots of ideas" },
  { word: "NETWORK", hint: "Connections between people or devices" },
  { word: "PRESENT", hint: "Show slides to a group" },
  { word: "STRATEGY", hint: "The big-picture plan" },
  { word: "UPDATE", hint: "Ship a newer version" },
  { word: "REMOTE", hint: "Working from somewhere else" },
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
