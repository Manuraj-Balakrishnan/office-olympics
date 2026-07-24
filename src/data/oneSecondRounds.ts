export interface OneSecondRound {
  id: string;
  imageUrl: string;
  questions: {
    prompt: string;
    options: string[];
    correctIndex: number;
  }[];
}

export const ONE_SECOND_ROUNDS: OneSecondRound[] = [
  {
    id: "os1",
    imageUrl:
      "https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=1200&h=800&fit=crop",
    questions: [
      {
        prompt: "About how many people appear to be collaborating?",
        options: ["2–3", "4–6", "8–10", "Only 1"],
        correctIndex: 1,
      },
      {
        prompt: "What kind of space is this?",
        options: ["Kitchen", "Office / coworking", "Stadium", "Beach"],
        correctIndex: 1,
      },
      {
        prompt: "Was a laptop visible?",
        options: ["Yes", "No", "Only a phone", "Only a tablet"],
        correctIndex: 0,
      },
    ],
  },
  {
    id: "os2",
    imageUrl:
      "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=1200&h=800&fit=crop",
    questions: [
      {
        prompt: "What activity seems to be happening?",
        options: ["Meeting / workshop", "Concert", "Cooking class", "Yoga"],
        correctIndex: 0,
      },
      {
        prompt: "Is there a whiteboard or flipchart vibe?",
        options: ["Yes", "No", "Only neon signs", "Only windows"],
        correctIndex: 0,
      },
      {
        prompt: "Overall lighting felt:",
        options: ["Dark nightclub", "Bright indoor", "Pitch black", "Underwater"],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "os3",
    imageUrl:
      "https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&h=800&fit=crop",
    questions: [
      {
        prompt: "Primary setting?",
        options: ["Office lounge", "Forest", "Airport runway", "Submarine"],
        correctIndex: 0,
      },
      {
        prompt: "Were people standing, sitting, or mixed?",
        options: ["Mostly sitting", "Mostly standing", "Mixed", "Nobody there"],
        correctIndex: 2,
      },
      {
        prompt: "Color mood of the scene?",
        options: ["Mostly cool blues", "Warm / varied", "All pink", "Black & white only"],
        correctIndex: 1,
      },
    ],
  },
];

export function pickOneSecondRound(): OneSecondRound {
  return ONE_SECOND_ROUNDS[Math.floor(Math.random() * ONE_SECOND_ROUNDS.length)];
}
