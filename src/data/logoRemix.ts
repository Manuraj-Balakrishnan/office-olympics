export type LogoEntry = {
  id: string;
  brand: string;
  /** Filename under /public/logo-remix/ */
  file: string;
  color: string;
};

/** Famous brands — SVG marks downloaded from Simple Icons. */
export const LOGO_CATALOG: LogoEntry[] = [
  { id: "nike", brand: "Nike", file: "nike.svg", color: "#111111" },
  { id: "apple", brand: "Apple", file: "apple.svg", color: "#555555" },
  { id: "mcdonalds", brand: "McDonald's", file: "mcdonalds.svg", color: "#FFC72C" },
  { id: "adidas", brand: "Adidas", file: "adidas.svg", color: "#000000" },
  { id: "starbucks", brand: "Starbucks", file: "starbucks.svg", color: "#00704A" },
  { id: "spotify", brand: "Spotify", file: "spotify.svg", color: "#1DB954" },
  { id: "netflix", brand: "Netflix", file: "netflix.svg", color: "#E50914" },
  { id: "amazon", brand: "Amazon", file: "amazon.svg", color: "#FF9900" },
  { id: "google", brand: "Google", file: "google.svg", color: "#4285F4" },
  { id: "youtube", brand: "YouTube", file: "youtube.svg", color: "#FF0000" },
  { id: "litmus7", brand: "Litmus7", file: "litmus7.svg", color: "#31BBAC" },
  { id: "slack", brand: "Slack", file: "slack.svg", color: "#4A154B" },
  { id: "discord", brand: "Discord", file: "discord.svg", color: "#5865F2" },
  { id: "tiktok", brand: "TikTok", file: "tiktok.svg", color: "#111111" },
  { id: "linkedin", brand: "LinkedIn", file: "linkedin.svg", color: "#0A66C2" },
  { id: "instagram", brand: "Instagram", file: "instagram.svg", color: "#E4405F" },
  { id: "dropbox", brand: "Dropbox", file: "dropbox.svg", color: "#0061FF" },
  { id: "airbnb", brand: "Airbnb", file: "airbnb.svg", color: "#FF5A5F" },
  { id: "cocacola", brand: "Coca-Cola", file: "cocacola.svg", color: "#F40009" },
  { id: "facebook", brand: "Facebook", file: "facebook.svg", color: "#1877F2" },
  { id: "github", brand: "GitHub", file: "github.svg", color: "#181717" },
  { id: "tesla", brand: "Tesla", file: "tesla.svg", color: "#CC0000" },
  { id: "bmw", brand: "BMW", file: "bmw.svg", color: "#0066B1" },
  { id: "paypal", brand: "PayPal", file: "paypal.svg", color: "#003087" },
  { id: "zoho", brand: "Zoho", file: "zoho.svg", color: "#E42527" },
  { id: "reddit", brand: "Reddit", file: "reddit.svg", color: "#FF4500" },
];

export type LogoRound = {
  logo: LogoEntry;
  options: string[];
  correctIndex: number;
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

export function pickLogoRounds(count = 10): LogoRound[] {
  const picks = shuffle(LOGO_CATALOG).slice(0, Math.min(count, LOGO_CATALOG.length));
  return picks.map((logo) => {
    const distractors = shuffle(LOGO_CATALOG.filter((l) => l.id !== logo.id))
      .slice(0, 3)
      .map((l) => l.brand);
    const options = shuffle([logo.brand, ...distractors]);
    const correctIndex = options.indexOf(logo.brand);
    return { logo, options, correctIndex };
  });
}
