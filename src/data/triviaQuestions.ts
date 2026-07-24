export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  category: string;
}

export const TRIVIA_QUESTIONS: TriviaQuestion[] = [
  {
    id: "t1",
    question: "What does 'WIP' stand for in project management?",
    options: ["Work In Progress", "Weekly Internal Plan", "Write It Properly", "Waiting In Queue"],
    correctIndex: 0,
    category: "Office",
  },
  {
    id: "t2",
    question: "Which planet is known as the Red Planet?",
    options: ["Venus", "Mars", "Jupiter", "Mercury"],
    correctIndex: 1,
    category: "Science",
  },
  {
    id: "t3",
    question: "In Agile, what is a short development cycle called?",
    options: ["Marathon", "Sprint", "Relay", "Huddle"],
    correctIndex: 1,
    category: "Office",
  },
  {
    id: "t4",
    question: "Who painted the Mona Lisa?",
    options: ["Michelangelo", "Van Gogh", "Leonardo da Vinci", "Picasso"],
    correctIndex: 2,
    category: "Culture",
  },
  {
    id: "t5",
    question: "What keyboard shortcut typically undoes an action?",
    options: ["Ctrl/Cmd + Y", "Ctrl/Cmd + Z", "Ctrl/Cmd + U", "Ctrl/Cmd + D"],
    correctIndex: 1,
    category: "Tech",
  },
  {
    id: "t6",
    question: "How many sides does a hexagon have?",
    options: ["5", "6", "7", "8"],
    correctIndex: 1,
    category: "General",
  },
  {
    id: "t7",
    question: "What does 'CC' mean when emailing?",
    options: ["Copy Carefully", "Carbon Copy", "Chief Contact", "Current Chain"],
    correctIndex: 1,
    category: "Office",
  },
  {
    id: "t8",
    question: "Which ocean is the largest?",
    options: ["Atlantic", "Indian", "Pacific", "Arctic"],
    correctIndex: 2,
    category: "Geography",
  },
  {
    id: "t9",
    question: "What year did the first iPhone launch?",
    options: ["2005", "2007", "2009", "2010"],
    correctIndex: 1,
    category: "Tech",
  },
  {
    id: "t10",
    question: "A 'stand-up' meeting is typically meant to be:",
    options: ["All-day workshop", "Short daily sync", "Annual review", "Happy hour"],
    correctIndex: 1,
    category: "Office",
  },
  {
    id: "t11",
    question: "Which animal is on the Mozilla Firefox logo?",
    options: ["Fox", "Wolf", "Cat", "Panda"],
    correctIndex: 0,
    category: "Tech",
  },
  {
    id: "t12",
    question: "What is the chemical symbol for gold?",
    options: ["Go", "Gd", "Au", "Ag"],
    correctIndex: 2,
    category: "Science",
  },
  {
    id: "t13",
    question: "In spreadsheets, what does a 'pivot table' help you do?",
    options: ["Print sideways", "Summarize data", "Encrypt cells", "Draw charts only"],
    correctIndex: 1,
    category: "Office",
  },
  {
    id: "t14",
    question: "Which movie features the quote 'May the Force be with you'?",
    options: ["Star Trek", "Star Wars", "Dune", "Avatar"],
    correctIndex: 1,
    category: "Pop Culture",
  },
  {
    id: "t15",
    question: "What does KPI stand for?",
    options: [
      "Key Performance Indicator",
      "Keep People Informed",
      "Knowledge Process Index",
      "Known Project Item",
    ],
    correctIndex: 0,
    category: "Office",
  },
  {
    id: "t16",
    question: "How many minutes are in a typical 'coffee break' stereotype?",
    options: ["2", "5", "15", "60"],
    correctIndex: 2,
    category: "Fun",
  },
  {
    id: "t17",
    question: "Which programming language is known for its snake mascot?",
    options: ["Java", "Ruby", "Python", "Go"],
    correctIndex: 2,
    category: "Tech",
  },
  {
    id: "t18",
    question: "What color are the Olympic rings that represent Africa traditionally?",
    options: ["Blue", "Yellow", "Black", "Green"],
    correctIndex: 2,
    category: "Sports",
  },
];

export function pickTrivia(count = 15): TriviaQuestion[] {
  const shuffled = [...TRIVIA_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
