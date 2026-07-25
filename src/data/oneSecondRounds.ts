export interface OneSecondRound {
  id: string;
  title: string;
  imageUrl: string;
  questions: {
    prompt: string;
    options: string[];
    correctIndex: number;
  }[];
}

const IMG = (id: string) =>
  `https://images.unsplash.com/${id}?w=1000&h=640&fit=crop&q=70&auto=format`;

/** Curated Unsplash office scenes — 5 questions each, matching visible details. */
export const ONE_SECOND_ROUNDS: OneSecondRound[] = [
  {
    id: "hallway",
    title: "Glass Hallway",
    imageUrl: IMG("photo-1497366216548-37526070297c"),
    questions: [
      {
        prompt: "What lined both sides of the long hallway?",
        options: ["Brick cubicles", "Glass-walled offices", "Lockers", "Elevators"],
        correctIndex: 1,
      },
      {
        prompt: "What stood in the kitchenette on the right?",
        options: ["Water cooler", "Vending machine", "Black fridge", "Coffee cart"],
        correctIndex: 2,
      },
      {
        prompt: "What color was the bench / sofa peeking in on the left?",
        options: ["Red", "Teal / mint", "Orange", "Yellow"],
        correctIndex: 1,
      },
      {
        prompt: "What hung down the center of the hallway?",
        options: ["Balloons", "Black pendant lights", "Plants", "Flags"],
        correctIndex: 1,
      },
      {
        prompt: "What was under the grey wall on the left?",
        options: ["Piano", "Low wood bookshelf", "Treadmill", "Bike rack"],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "hackathon",
    title: "Busy Table",
    imageUrl: IMG("photo-1519389950473-47ba0277781c"),
    questions: [
      {
        prompt: "About how many open laptops were on the table?",
        options: ["1", "2", "About 4", "8+"],
        correctIndex: 2,
      },
      {
        prompt: "What stood out near the left side of the table?",
        options: ["Orange hard drive / drive", "Pink flamingo", "Bowling ball", "Cactus"],
        correctIndex: 0,
      },
      {
        prompt: "Was there a pair of headphones?",
        options: ["Yes — black over-ear", "Only earbuds", "No headphones", "VR headset"],
        correctIndex: 0,
      },
      {
        prompt: "What drinkware / vessel was near the center?",
        options: ["Champagne bucket", "Dark ceramic teapot", "Fishbowl", "Thermos tower"],
        correctIndex: 1,
      },
      {
        prompt: "What color was the snack bowl?",
        options: ["Red", "Blue and white patterned", "Clear glass only", "Black"],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "typing",
    title: "Typing Close-up",
    imageUrl: IMG("photo-1486312338219-ce68d2c6f44d"),
    questions: [
      {
        prompt: "What was the person doing?",
        options: ["Drawing", "Typing on a laptop", "Drinking coffee", "On a phone call"],
        correctIndex: 1,
      },
      {
        prompt: "What were they wearing on their arms?",
        options: ["Suit jacket", "Grey sweater", "Short sleeves", "Leather gloves"],
        correctIndex: 1,
      },
      {
        prompt: "Was a second monitor visible behind the laptop?",
        options: ["Yes", "No", "Only a lamp", "Only a plant"],
        correctIndex: 0,
      },
      {
        prompt: "What color was the laptop?",
        options: ["Black gaming rig", "Silver / light metal", "Hot pink", "Wood-covered"],
        correctIndex: 1,
      },
      {
        prompt: "What kind of desk surface was it?",
        options: ["Glass", "Warm wood", "Neon acrylic", "Marble"],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "window-desk",
    title: "City Window Desk",
    imageUrl: IMG("photo-1497215728101-856f4ea42174"),
    questions: [
      {
        prompt: "What was outside the big windows?",
        options: ["Ocean", "Forest", "City buildings", "Parking lot only"],
        correctIndex: 2,
      },
      {
        prompt: "What sat on the long counter by the window?",
        options: ["Printer farm", "Open silver laptop", "Fish tank", "Desktop tower"],
        correctIndex: 1,
      },
      {
        prompt: "What plant was prominent on the left?",
        options: ["Tiny succulent", "Tall spiky indoor plant", "Hanging fern", "No plants"],
        correctIndex: 1,
      },
      {
        prompt: "What seating was tucked under the counter?",
        options: ["Bean bags", "White modern stools", "Barber chairs", "None"],
        correctIndex: 1,
      },
      {
        prompt: "How would you describe the lighting?",
        options: ["Candlelit", "Bright daylight", "Pitch dark", "Red neon only"],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "breakroom",
    title: "Breakroom Crowd",
    imageUrl: IMG("photo-1568992687947-868a62a9f521"),
    questions: [
      {
        prompt: "About how many people were at the table?",
        options: ["2", "3–4", "About 7", "12+"],
        correctIndex: 2,
      },
      {
        prompt: "What was behind the group?",
        options: ["Server racks", "Kitchen shelves & microwave", "Parking garage", "Stage"],
        correctIndex: 1,
      },
      {
        prompt: "Was someone wearing a baseball cap?",
        options: ["Yes", "No", "Only a hard hat", "Only a beanie"],
        correctIndex: 0,
      },
      {
        prompt: "What stood upright on the table?",
        options: ["Trophy", "Paper towel roll", "Desk lamp", "Flag"],
        correctIndex: 1,
      },
      {
        prompt: "What kind of chairs were around the table?",
        options: ["Plastic folding", "Black chairs with wood backs", "Bean bags", "Stools only"],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "surface",
    title: "Tablet Lock Screen",
    imageUrl: IMG("photo-1573164713714-d95e436ab8d6"),
    questions: [
      {
        prompt: "What color was the tablet keyboard cover?",
        options: ["Black", "Pink", "Bright cyan / teal", "Wood grain"],
        correctIndex: 2,
      },
      {
        prompt: "What time showed on the lock screen?",
        options: ["3:15", "10:57", "12:00", "9:41"],
        correctIndex: 1,
      },
      {
        prompt: "What landmark appeared on the wallpaper?",
        options: ["Eiffel Tower", "Space Needle", "Big Ben", "Statue of Liberty"],
        correctIndex: 1,
      },
      {
        prompt: "Was a stylus / pen attached to the device?",
        options: ["Yes — on the side", "No", "Two styluses", "Only a mouse"],
        correctIndex: 0,
      },
      {
        prompt: "What color was the person’s shirt?",
        options: ["Neon green", "Purple", "Orange", "Plaid red"],
        correctIndex: 1,
      },
    ],
  },
  {
    id: "all-hands",
    title: "All-Hands Talk",
    imageUrl: IMG("photo-1556761175-5973dc0f32e7"),
    questions: [
      {
        prompt: "What were the seated people mostly sitting on?",
        options: ["Floor cushions", "Brown leather sofa", "Bean bags", "Bleachers"],
        correctIndex: 1,
      },
      {
        prompt: "What word was big on the mural pillar?",
        options: ["LOSE", "WIN", "SYNC", "ZOOM"],
        correctIndex: 1,
      },
      {
        prompt: "What kind of walls did the office have?",
        options: ["Mirrored", "Exposed brick", "Neon graffiti", "Solid black"],
        correctIndex: 1,
      },
      {
        prompt: "What was next to the presentation screen?",
        options: ["Water cooler", "Gold-domed floor lamp", "Piano", "Foosball table"],
        correctIndex: 1,
      },
      {
        prompt: "Was there a TV / screen showing slides?",
        options: ["Yes", "No screens at all", "Only a projector on the ceiling", "Only phones"],
        correctIndex: 0,
      },
    ],
  },
  {
    id: "lounge",
    title: "Lounge Chairs",
    imageUrl: IMG("photo-1524758631624-e2822e304c36"),
    questions: [
      {
        prompt: "What color were some of the accent armchairs?",
        options: ["Hot pink", "Forest green", "Neon yellow", "Purple velvet"],
        correctIndex: 1,
      },
      {
        prompt: "What stood out as a lighting fixture?",
        options: ["Chandelier crystals", "Black multi-arm floor lamp", "Lava lamp", "Disco ball"],
        correctIndex: 1,
      },
      {
        prompt: "Was there an Exit sign visible?",
        options: ["Yes — green Exit", "No signs at all", "Only a restroom sign", "Fire alarm only"],
        correctIndex: 0,
      },
      {
        prompt: "What kind of coffee tables were in the lounge?",
        options: ["Glass rectangles", "Round light-wood tables", "Stone slabs", "None"],
        correctIndex: 1,
      },
      {
        prompt: "What was along the right side of the room?",
        options: ["Server racks", "Large windows", "A climbing wall", "A stage"],
        correctIndex: 1,
      },
    ],
  },
];

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** Pick N distinct scenes for one playthrough. */
export function pickOneSecondRounds(count = 3): OneSecondRound[] {
  return shuffle(ONE_SECOND_ROUNDS).slice(0, Math.min(count, ONE_SECOND_ROUNDS.length));
}

/** @deprecated use pickOneSecondRounds */
export function pickOneSecondRound(): OneSecondRound {
  return pickOneSecondRounds(1)[0]!;
}
