export const TYPING_SENTENCES = [
  "Please sync before the standup or Dave will ask again. The coffee machine is broken and morale is fragile. Reply-all remains a weapon best left unused.",
  "Our roadmap has more pivots than a ballet recital. Can we take this offline and never bring it back online? The printer jammed right before the big client printout.",
  "I put it in the shared drive which means nobody will find it. Let's circle back after lunch unless lunch becomes a meeting. Your calendar looks like Tetris gone wrong.",
  "Bandwidth is limited but optimism remains strangely high. We shipped it Friday which means Monday will be exciting. The mute button is your friend during surprise Zoom guests.",
  "Action items without owners are just hopeful suggestions. This spreadsheet has more tabs than a conspiracy theory. Hot desking sounds fun until you lose your charging cable.",
  "The Wi-Fi password changed and nobody told the interns. Please stop scheduling meetings to plan other meetings. Our OKRs are ambitious and our snacks are essential.",
  "I will follow up which is corporate for maybe never. The slide deck has forty pages and one useful chart. Remote work means pajamas count as business casual.",
  "We need alignment which means someone must change their mind. The deadline is soft until leadership suddenly remembers it. Out of office replies should not require a novel.",
  "Please ping me on Slack instead of walking over twice. The budget meeting needs snacks or it will get tense. Synergy is not a strategy but it sounds expensive.",
  "I archived the thread so the problem never happened. Our brand voice is friendly yet somehow still corporate. The elevator pitch lasted longer than the elevator ride.",
  "The standup ran long because everyone had a quick update. The whiteboard is full of sticky notes and zero decisions. Someone just asked if we can take this to email.",
  "The client wants a small change that rewrites half the product. Design sent three options and leadership picked none. Engineering is waiting for clarity that may never arrive.",
];

export function pickTypingSentence(): string {
  return TYPING_SENTENCES[Math.floor(Math.random() * TYPING_SENTENCES.length)];
}
