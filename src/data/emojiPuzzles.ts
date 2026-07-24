export interface EmojiPuzzle {
  id: string;
  emoji: string;
  answer: string;
  aliases?: string[];
  category: "movie" | "office" | "idiom";
}

export const EMOJI_PUZZLES: EmojiPuzzle[] = [
  { id: "e1", emoji: "🕷️🧑", answer: "Spider-Man", aliases: ["spiderman", "spider man"], category: "movie" },
  { id: "e2", emoji: "🦁👑", answer: "The Lion King", aliases: ["lion king"], category: "movie" },
  { id: "e3", emoji: "❄️👸", answer: "Frozen", aliases: ["elsa"], category: "movie" },
  { id: "e4", emoji: "🦇🌃", answer: "Batman", aliases: ["the dark knight", "dark knight"], category: "movie" },
  { id: "e5", emoji: "🧸🍯", answer: "Winnie the Pooh", aliases: ["pooh", "winnie pooh"], category: "movie" },
  { id: "e6", emoji: "☕📅", answer: "Coffee meeting", aliases: ["coffee date", "coffee break"], category: "office" },
  { id: "e7", emoji: "📧🔥", answer: "Inbox on fire", aliases: ["email fire", "burning inbox"], category: "office" },
  { id: "e8", emoji: "⏰🏃‍♂️", answer: "Running late", aliases: ["late", "running behind"], category: "office" },
  { id: "e9", emoji: "📊📈", answer: "Growth chart", aliases: ["up and to the right", "metrics up"], category: "office" },
  { id: "e10", emoji: "🤝💼", answer: "Business deal", aliases: ["handshake deal", "partnership"], category: "office" },
  { id: "e11", emoji: "🌧️🐈🐕", answer: "Raining cats and dogs", aliases: ["raining cats & dogs"], category: "idiom" },
  { id: "e12", emoji: "🧊💔", answer: "Break the ice", aliases: ["icebreaker", "break ice"], category: "idiom" },
  { id: "e13", emoji: "🐘🏠", answer: "Elephant in the room", aliases: ["elephant in room"], category: "idiom" },
  { id: "e14", emoji: "🍎👁️", answer: "Apple of my eye", aliases: ["apple of eye"], category: "idiom" },
  { id: "e15", emoji: "⏰💰", answer: "Time is money", aliases: ["time = money"], category: "idiom" },
  { id: "e16", emoji: "🍕🐢", answer: "Teenage Mutant Ninja Turtles", aliases: ["tmnt", "ninja turtles"], category: "movie" },
  { id: "e17", emoji: "🎤🎤🎤🎤", answer: "The Voice", aliases: ["voice"], category: "movie" },
  { id: "e18", emoji: "🗓️☠️", answer: "Deadline", aliases: ["dead line"], category: "office" },
  { id: "e19", emoji: "🧠🌪️", answer: "Brainstorm", aliases: ["brain storm"], category: "office" },
  { id: "e20", emoji: "👀🐝", answer: "Busy bee", aliases: ["busy as a bee"], category: "idiom" },
];

export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function fuzzyMatch(guess: string, puzzle: EmojiPuzzle): boolean {
  const g = normalizeAnswer(guess);
  if (!g) return false;
  const answers = [puzzle.answer, ...(puzzle.aliases ?? [])].map(normalizeAnswer);
  return answers.some((a) => a === g || a.includes(g) || g.includes(a));
}

export function pickEmojiPuzzles(count = 10): EmojiPuzzle[] {
  return [...EMOJI_PUZZLES].sort(() => Math.random() - 0.5).slice(0, count);
}
