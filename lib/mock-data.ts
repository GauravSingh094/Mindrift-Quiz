import { Quiz, Question, Category, Difficulty, LeaderboardEntry } from '@/lib/types';

export const CATEGORIES: { id: Category; name: string; icon: string }[] = [
  { id: 'c', name: 'C Programming', icon: 'code' },
  { id: 'cpp', name: 'C++', icon: 'code-2' },
  { id: 'java', name: 'Java', icon: 'coffee' },
  { id: 'python', name: 'Python', icon: 'code' },
  { id: 'javascript', name: 'JavaScript', icon: 'braces' },
  { id: 'typescript', name: 'TypeScript', icon: 'file-code' },
  { id: 'mysql', name: 'MySQL', icon: 'database' },
  { id: 'mongodb', name: 'MongoDB', icon: 'database' },
  { id: 'react', name: 'React', icon: 'component' },
  { id: 'node', name: 'Node.js', icon: 'server' },
  { id: 'angular', name: 'Angular', icon: 'component' },
  { id: 'vue', name: 'Vue.js', icon: 'component' },
  { id: 'docker', name: 'Docker', icon: 'container' },
  { id: 'kubernetes', name: 'Kubernetes', icon: 'cluster' },
  { id: 'aws', name: 'AWS', icon: 'cloud' },
  { id: 'azure', name: 'Azure', icon: 'cloud' },
  { id: 'devops', name: 'DevOps', icon: 'git-branch' }
];

export const DIFFICULTIES = [
  { id: 'easy', name: 'Easy', color: 'text-green-500' },
  { id: 'medium', name: 'Medium', color: 'text-blue-500' },
  { id: 'hard', name: 'Hard', color: 'text-orange-500' },
  { id: 'expert', name: 'Expert', color: 'text-red-500' }
];

// Original quiz data - this should never be mutated by filters
// These are the original mock quizzes (not created through admin panel)
export const mockQuizzes: Quiz[] = [
  {
    id: 'quiz-1',
    title: 'Advanced Python Programming',
    description: 'Test your knowledge of Python advanced concepts and best practices',
    categories: ['python', 'javascript'],
    difficulty: 'expert',
    timePerQuestion: 60,
    isLive: true,
    startTime: new Date(Date.now() + 3600000),
    createdById: 'user-1',
    createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
    updatedAt: new Date(),
    questionCount: 15,
    maxParticipants: 100,
    currentParticipants: 45,
    status: 'live',
    quizCode: 'MOCK01' // Add quiz codes to mock quizzes too
  },
  {
    id: 'quiz-2',
    title: 'JavaScript Fundamentals',
    description: 'Core concepts and modern JavaScript features',
    categories: ['javascript', 'typescript'],
    difficulty: 'medium',
    timePerQuestion: 90,
    isLive: false,
    startTime: new Date(Date.now() + 86400000),
    createdById: 'user-1',
    createdAt: new Date(Date.now() - 86400000 * 5), // 5 days ago
    updatedAt: new Date(),
    questionCount: 20,
    maxParticipants: 200,
    currentParticipants: 0,
    status: 'active',
    quizCode: 'MOCK02'
  },
  {
    id: 'quiz-3',
    title: 'SQL Mastery Challenge',
    description: 'Advanced SQL queries and database optimization',
    categories: ['mysql', 'mongodb'],
    difficulty: 'hard',
    timePerQuestion: 120,
    isLive: true,
    startTime: new Date(Date.now() - 1800000),
    endTime: new Date(Date.now() + 1800000),
    createdById: 'user-2',
    createdAt: new Date(Date.now() - 86400000 * 1), // 1 day ago
    updatedAt: new Date(),
    questionCount: 25,
    maxParticipants: 150,
    currentParticipants: 132,
    status: 'live',
    quizCode: 'MOCK03'
  },
  {
    id: 'quiz-4',
    title: 'React Hooks Deep Dive',
    description: 'Master React hooks and modern patterns',
    categories: ['react', 'javascript'],
    difficulty: 'hard',
    timePerQuestion: 90,
    isLive: false,
    startTime: new Date(Date.now() + 86400000 * 2),
    createdById: 'user-3',
    createdAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
    updatedAt: new Date(),
    questionCount: 18,
    maxParticipants: 80,
    currentParticipants: 0,
    status: 'active',
    quizCode: 'MOCK04'
  },
  {
    id: 'quiz-5',
    title: 'Docker Basics',
    description: 'Learn containerization fundamentals',
    categories: ['docker', 'devops'],
    difficulty: 'easy',
    timePerQuestion: 60,
    isLive: false,
    startTime: new Date(Date.now() + 86400000 * 3),
    createdById: 'user-4',
    createdAt: new Date(Date.now() - 86400000 * 7), // 1 week ago
    updatedAt: new Date(),
    questionCount: 12,
    maxParticipants: 300,
    currentParticipants: 0,
    status: 'active',
    quizCode: 'MOCK05'
  },
  {
    id: 'quiz-6',
    title: 'AWS Cloud Fundamentals',
    description: 'Essential AWS services and concepts',
    categories: ['aws', 'devops'],
    difficulty: 'medium',
    timePerQuestion: 75,
    isLive: true,
    startTime: new Date(Date.now() - 3600000),
    createdById: 'user-5',
    createdAt: new Date(Date.now() - 86400000 * 4), // 4 days ago
    updatedAt: new Date(),
    questionCount: 22,
    maxParticipants: 120,
    currentParticipants: 67,
    status: 'live',
    quizCode: 'MOCK06'
  },
  {
    id: 'quiz-7',
    title: 'Java Spring Boot',
    description: 'Build enterprise applications with Spring Boot',
    categories: ['java'],
    difficulty: 'expert',
    timePerQuestion: 120,
    isLive: false,
    startTime: new Date(Date.now() + 86400000 * 5),
    createdById: 'user-6',
    createdAt: new Date(Date.now() - 86400000 * 6), // 6 days ago
    updatedAt: new Date(),
    questionCount: 30,
    maxParticipants: 60,
    currentParticipants: 0,
    status: 'active',
    quizCode: 'MOCK07'
  },
  {
    id: 'quiz-8',
    title: 'MongoDB Quick Start',
    description: 'NoSQL database fundamentals and queries',
    categories: ['mongodb'],
    difficulty: 'easy',
    timePerQuestion: 45,
    isLive: false,
    startTime: new Date(Date.now() + 86400000),
    createdById: 'user-7',
    createdAt: new Date(Date.now() - 86400000 * 8), // 8 days ago
    updatedAt: new Date(),
    questionCount: 10,
    maxParticipants: 250,
    currentParticipants: 0,
    status: 'active',
    quizCode: 'MOCK08'
  }
];

// Enhanced question generation with better deduplication
export const generateQuestionsForQuiz = (quizId: string, questionCount: number): Question[] => {
  const questions: Question[] = [];
  
  // Base question templates for different categories with unique identifiers
  const questionTemplates = {
    python: [
      {
        id: 'py-1',
        text: 'What is the output of the following Python code?\n\n```python\ndef decorator(func):\n    def wrapper(*args, **kwargs):\n        print("Before")\n        result = func(*args, **kwargs)\n        print("After")\n        return result\n    return wrapper\n\n@decorator\ndef greet():\n    print("Hello")\n\ngreet()\n```',
        options: [
          { text: 'Before\nHello\nAfter' },
          { text: 'Hello\nBefore\nAfter' },
          { text: 'Before\nAfter\nHello' },
          { text: 'Hello' }
        ],
        correctIndex: 0,
        explanation: 'The decorator is executed first, printing "Before", then the original function is called, printing "Hello", and finally "After" is printed.'
      },
      {
        id: 'py-2',
        text: 'Which of the following is a correct implementation of a thread-safe singleton pattern in Python?',
        options: [
          { text: 'class Singleton:\n    _instance = None\n    def __new__(cls):\n        if cls._instance is None:\n            cls._instance = super().__new__(cls)\n        return cls._instance' },
          { text: 'from threading import Lock\n\nclass Singleton:\n    _instance = None\n    _lock = Lock()\n    \n    def __new__(cls):\n        with cls._lock:\n            if cls._instance is None:\n                cls._instance = super().__new__(cls)\n            return cls._instance' },
          { text: 'class Singleton:\n    def __init__(self):\n        if not hasattr(self, "instance"):\n            self.instance = super().__new__(self)\n        return self.instance' },
          { text: 'class Singleton:\n    _instance = None\n    def __init__(self):\n        if Singleton._instance is None:\n            Singleton._instance = self' }
        ],
        correctIndex: 1,
        explanation: 'The second option is correct as it uses a Lock to ensure thread-safety when creating the singleton instance.'
      },
      {
        id: 'py-3',
        text: 'What is the difference between `is` and `==` in Python?',
        options: [
          { text: '`is` compares values, `==` compares identity' },
          { text: '`is` compares identity, `==` compares values' },
          { text: 'They are exactly the same' },
          { text: '`is` is faster than `==`' }
        ],
        correctIndex: 1,
        explanation: '`is` compares object identity (whether two variables point to the same object), while `==` compares values.'
      },
      {
        id: 'py-4',
        text: 'What does the `with` statement do in Python?',
        options: [
          { text: 'Creates a new scope' },
          { text: 'Handles context management and automatic cleanup' },
          { text: 'Imports modules' },
          { text: 'Defines a function' }
        ],
        correctIndex: 1,
        explanation: 'The `with` statement is used for context management, ensuring proper acquisition and release of resources.'
      }
    ],
    javascript: [
      {
        id: 'js-1',
        text: 'What is the output of the following JavaScript code?\n\n```javascript\nconsole.log(typeof null);\nconsole.log(typeof undefined);\nconsole.log(typeof []);\n```',
        options: [
          { text: 'null, undefined, array' },
          { text: 'object, undefined, object' },
          { text: 'null, undefined, object' },
          { text: 'object, undefined, array' }
        ],
        correctIndex: 1,
        explanation: 'In JavaScript, `typeof null` returns "object" (a known quirk), `typeof undefined` returns "undefined", and `typeof []` returns "object".'
      },
      {
        id: 'js-2',
        text: 'What is the difference between `let`, `const`, and `var` in JavaScript?',
        options: [
          { text: 'No difference, they are interchangeable' },
          { text: '`var` is function-scoped, `let` and `const` are block-scoped' },
          { text: '`let` is function-scoped, `var` and `const` are block-scoped' },
          { text: 'All are block-scoped' }
        ],
        correctIndex: 1,
        explanation: '`var` is function-scoped and can be redeclared, while `let` and `const` are block-scoped. `const` cannot be reassigned.'
      },
      {
        id: 'js-3',
        text: 'What is a closure in JavaScript?',
        options: [
          { text: 'A function that returns another function' },
          { text: 'A function that has access to variables in its outer scope' },
          { text: 'A function that is immediately invoked' },
          { text: 'A function that takes no parameters' }
        ],
        correctIndex: 1,
        explanation: 'A closure is a function that has access to variables in its outer (enclosing) scope even after the outer function has returned.'
      },
      {
        id: 'js-4',
        text: 'What is the difference between `map()` and `forEach()` in JavaScript?',
        options: [
          { text: 'No difference' },
          { text: 'map() returns a new array, forEach() returns undefined' },
          { text: 'forEach() returns a new array, map() returns undefined' },
          { text: 'map() is faster than forEach()' }
        ],
        correctIndex: 1,
        explanation: 'map() creates and returns a new array with the results of calling a function on every element, while forEach() executes a function for each element but returns undefined.'
      }
    ],
    react: [
      {
        id: 'react-1',
        text: 'What is the purpose of the `useEffect` hook in React?',
        options: [
          { text: 'To manage component state' },
          { text: 'To perform side effects in functional components' },
          { text: 'To create context providers' },
          { text: 'To handle form submissions' }
        ],
        correctIndex: 1,
        explanation: '`useEffect` is used to perform side effects in functional components, such as data fetching, subscriptions, or manually changing the DOM.'
      },
      {
        id: 'react-2',
        text: 'What is the difference between `useState` and `useReducer`?',
        options: [
          { text: 'No difference, they are interchangeable' },
          { text: '`useState` is for simple state, `useReducer` is for complex state logic' },
          { text: '`useReducer` is deprecated' },
          { text: '`useState` is only for class components' }
        ],
        correctIndex: 1,
        explanation: '`useState` is ideal for simple state values, while `useReducer` is better for complex state logic with multiple sub-values or when the next state depends on the previous one.'
      },
      {
        id: 'react-3',
        text: 'What is the purpose of React.memo()?',
        options: [
          { text: 'To memoize component state' },
          { text: 'To prevent unnecessary re-renders of functional components' },
          { text: 'To cache API responses' },
          { text: 'To optimize bundle size' }
        ],
        correctIndex: 1,
        explanation: 'React.memo() is a higher-order component that prevents unnecessary re-renders by memoizing the result and only re-rendering when props change.'
      }
    ],
    java: [
      {
        id: 'java-1',
        text: 'What is the difference between `==` and `.equals()` in Java?',
        options: [
          { text: 'No difference' },
          { text: '`==` compares references, `.equals()` compares content' },
          { text: '`==` compares content, `.equals()` compares references' },
          { text: 'Both compare references' }
        ],
        correctIndex: 1,
        explanation: '`==` compares object references (memory addresses), while `.equals()` compares the actual content of objects.'
      },
      {
        id: 'java-2',
        text: 'What is the purpose of the `final` keyword in Java?',
        options: [
          { text: 'To make a method abstract' },
          { text: 'To prevent inheritance, overriding, or reassignment' },
          { text: 'To make a class public' },
          { text: 'To create static methods' }
        ],
        correctIndex: 1,
        explanation: 'The `final` keyword prevents inheritance (for classes), overriding (for methods), or reassignment (for variables).'
      }
    ],
    mysql: [
      {
        id: 'mysql-1',
        text: 'Which SQL command is used to retrieve data from a database?',
        options: [
          { text: 'GET' },
          { text: 'SELECT' },
          { text: 'RETRIEVE' },
          { text: 'FETCH' }
        ],
        correctIndex: 1,
        explanation: 'SELECT is the SQL command used to retrieve data from one or more tables in a database.'
      },
      {
        id: 'mysql-2',
        text: 'What is the difference between INNER JOIN and LEFT JOIN?',
        options: [
          { text: 'No difference' },
          { text: 'INNER JOIN returns only matching rows, LEFT JOIN returns all rows from left table' },
          { text: 'LEFT JOIN returns only matching rows, INNER JOIN returns all rows' },
          { text: 'Both return all rows' }
        ],
        correctIndex: 1,
        explanation: 'INNER JOIN returns only rows that have matching values in both tables, while LEFT JOIN returns all rows from the left table and matching rows from the right table.'
      }
    ],
    docker: [
      {
        id: 'docker-1',
        text: 'What is a Docker container?',
        options: [
          { text: 'A virtual machine' },
          { text: 'A lightweight, standalone package that includes everything needed to run an application' },
          { text: 'A type of database' },
          { text: 'A programming language' }
        ],
        correctIndex: 1,
        explanation: 'A Docker container is a lightweight, standalone, executable package that includes everything needed to run an application: code, runtime, system tools, libraries, and settings.'
      }
    ],
    aws: [
      {
        id: 'aws-1',
        text: 'What is Amazon S3?',
        options: [
          { text: 'A compute service' },
          { text: 'A storage service' },
          { text: 'A database service' },
          { text: 'A networking service' }
        ],
        correctIndex: 1,
        explanation: 'Amazon S3 (Simple Storage Service) is a scalable object storage service for storing and retrieving any amount of data from anywhere.'
      }
    ]
  };

  // Get the quiz to determine its categories
  const quiz = mockQuizzes.find(q => q.id === quizId);
  const categories = quiz?.categories || ['javascript']; // Default to javascript if not found
  
  // Create a pool of unique questions from all relevant categories
  const questionPool: any[] = [];
  categories.forEach(category => {
    const templates = questionTemplates[category as keyof typeof questionTemplates] || questionTemplates.javascript;
    questionPool.push(...templates);
  });

  // Shuffle the question pool to ensure randomness
  const shuffledPool = questionPool.sort(() => Math.random() - 0.5);
  
  // Generate unique questions up to the requested count
  const usedQuestionIds = new Set<string>();
  
  for (let i = 0; i < questionCount && i < shuffledPool.length * 3; i++) {
    const templateIndex = i % shuffledPool.length;
    const template = shuffledPool[templateIndex];
    const uniqueId = `${template.id}-${quizId}-${i}`;
    
    // Skip if we've already used this exact question for this quiz
    if (usedQuestionIds.has(uniqueId)) {
      continue;
    }
    
    usedQuestionIds.add(uniqueId);
    
    const question: Question = {
      id: `question-${quizId}-${i + 1}`,
      quizId: quizId,
      text: `${template.text} (Question ${i + 1})`,
      options: template.options.map((option: any, index: number) => ({
        id: `option-${quizId}-${i + 1}-${index + 1}`,
        text: option.text
      })),
      correctOptionId: `option-${quizId}-${i + 1}-${template.correctIndex + 1}`,
      points: 10,
      explanation: template.explanation
    };
    
    questions.push(question);
    
    if (questions.length >= questionCount) {
      break;
    }
  }
  
  // If we still don't have enough questions, fill with variations
  while (questions.length < questionCount) {
    const template = shuffledPool[questions.length % shuffledPool.length];
    const question: Question = {
      id: `question-${quizId}-${questions.length + 1}`,
      quizId: quizId,
      text: `${template.text} (Question ${questions.length + 1} - Variation)`,
      options: template.options.map((option: any, index: number) => ({
        id: `option-${quizId}-${questions.length + 1}-${index + 1}`,
        text: option.text
      })),
      correctOptionId: `option-${quizId}-${questions.length + 1}-${template.correctIndex + 1}`,
      points: 10,
      explanation: template.explanation
    };
    
    questions.push(question);
  }
  
  return questions;
};

// Generate all questions for all quizzes
export const allQuizQuestions: Record<string, Question[]> = {};

// Initialize questions for each quiz
mockQuizzes.forEach(quiz => {
  allQuizQuestions[quiz.id] = generateQuestionsForQuiz(quiz.id, quiz.questionCount);
});

// Function to get questions for a specific quiz
export const getQuestionsForQuiz = (quizId: string): Question[] => {
  // First check if we have pre-generated questions
  if (allQuizQuestions[quizId]) {
    return allQuizQuestions[quizId];
  }
  
  // If not found in pre-generated, try to find the quiz and generate questions
  const quiz = mockQuizzes.find(q => q.id === quizId);
  if (quiz) {
    const questions = generateQuestionsForQuiz(quizId, quiz.questionCount);
    allQuizQuestions[quizId] = questions; // Cache for future use
    return questions;
  }
  
  // Fallback: return empty array if quiz not found
  console.warn(`No questions found for quiz ID: ${quizId}`);
  return [];
};

// Legacy mockQuestions for backward compatibility (now uses first quiz's questions)
export const mockQuestions: Question[] = getQuestionsForQuiz('quiz-1').slice(0, 2);

// Leaderboard data - independent of quiz filters
export const mockLeaderboard: LeaderboardEntry[] = [
  {
    user: { id: 'user-1', name: 'Alex Johnson', image: 'https://i.pravatar.cc/150?img=1' },
    score: 95,
    rank: 1,
    timeSpent: 280
  },
  {
    user: { id: 'user-2', name: 'Sam Davis', image: 'https://i.pravatar.cc/150?img=2' },
    score: 87,
    rank: 2,
    timeSpent: 310
  },
  {
    user: { id: 'user-3', name: 'Morgan Chen', image: 'https://i.pravatar.cc/150?img=3' },
    score: 85,
    rank: 3,
    timeSpent: 325
  },
  {
    user: { id: 'user-4', name: 'Jordan Lee', image: 'https://i.pravatar.cc/150?img=4' },
    score: 82,
    rank: 4,
    timeSpent: 290
  },
  {
    user: { id: 'user-5', name: 'Taylor Wilson', image: 'https://i.pravatar.cc/150?img=5' },
    score: 78,
    rank: 5,
    timeSpent: 340
  },
];