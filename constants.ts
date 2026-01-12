import { GameTemplate, GameModule } from './types';

export const GAME_TEMPLATES: Record<string, GameTemplate> = {
  neutral: {
    id: 'neutral',
    name: "Standard Academic",
    theme: "Clear, direct, and distraction-free academic focus",
    bgColor: "from-slate-800 to-slate-900"
  },
  academic_classroom: {
    id: 'academic_classroom',
    name: "Classic Classroom",
    theme: "A focused, structured academic environment",
    bgColor: "from-blue-900 to-slate-900"
  },
  lagos_market: {
    id: 'lagos_market',
    name: "Lagos Market Adventure",
    theme: "Navigate a bustling Lagos market",
    bgColor: "from-orange-600 to-red-600"
  },
  mechanic_shop: {
    id: 'mechanic_shop',
    name: "Mechanic Workshop",
    theme: "Fix problems in a local mechanic shop",
    bgColor: "from-gray-700 to-gray-900"
  },
  football_field: {
    id: 'football_field',
    name: "Football Strategy",
    theme: "Win the championship match",
    bgColor: "from-green-600 to-blue-600"
  }
};

export const SAMPLE_MODULES: GameModule[] = [
  {
    id: 'mod_1',
    title: 'Photosynthesis Basics',
    subject: 'Biology',
    grade: 'JSS 2',
    plays: 234,
    avgScore: 78,
    type: 'library',
    template: GAME_TEMPLATES.lagos_market,
    levels: [
      {
        id: 'l1_1',
        title: 'Market Terms Memory',
        type: 'flashcards',
        points: 50,
        challenge: 'Learn the trade terms before entering the market.',
        flashcards: [
          { id: 'f1', front: 'Photosynthesis', back: 'Process plants use to make food' },
          { id: 'f2', front: 'Chlorophyll', back: 'Green pigment that traps sunlight' },
          { id: 'f3', front: 'Stomata', back: 'Tiny holes in leaves for air' }
        ]
      },
      {
        id: 'l1_2',
        title: 'Ingredient Matching',
        type: 'matching',
        points: 100,
        challenge: 'Match the inputs to their role in the process.',
        pairs: [
          { id: 'p1', left: 'Sunlight', right: 'Energy Source' },
          { id: 'p2', left: 'Roots', right: 'Water Intake' },
          { id: 'p3', left: 'Leaf', right: 'Food Factory' }
        ]
      },
      {
        id: 'l1_3',
        title: 'The Exchange Quiz',
        type: 'quiz',
        points: 20,
        question: 'What gas do plants give out as "change" during photosynthesis?',
        options: [
          { id: 'a', text: 'Oxygen', correct: true },
          { id: 'b', text: 'Carbon Dioxide', correct: false },
          { id: 'c', text: 'Nitrogen', correct: false },
          { id: 'd', text: 'Smoke', correct: false }
        ],
        challenge: 'A customer asks what fresh air you are selling.'
      }
    ],
    metadata: { createdAt: new Date().toISOString(), difficulty: 'easy', estimatedTime: 10 }
  },
  {
    id: 'mod_2',
    title: 'Simple Equations',
    subject: 'Mathematics',
    grade: 'JSS 3',
    plays: 189,
    avgScore: 82,
    type: 'library',
    template: GAME_TEMPLATES.mechanic_shop,
    levels: [
      {
        id: 'l2_1',
        title: 'Tool Identification',
        type: 'flashcards',
        points: 50,
        flashcards: [
          { id: 'm1', front: 'Variable', back: 'A letter representing an unknown number' },
          { id: 'm2', front: 'Constant', back: 'A fixed number' }
        ]
      },
      {
        id: 'l2_2',
        title: 'Fix the Equation',
        type: 'fill_blank',
        points: 30,
        sentence: 'In the equation 2x + 5 = 15, the value of x is ___.',
        correctAnswer: '5',
        challenge: 'Calculate the right bolt size.'
      }
    ],
    metadata: { createdAt: new Date().toISOString(), difficulty: 'medium', estimatedTime: 15 }
  }
];