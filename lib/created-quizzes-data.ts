import { Quiz, Question } from '@/lib/types';
import { generateQuizCode } from '@/lib/utils';

// Separate data store for admin-created quizzes
// These quizzes are created via the admin panel and managed separately
export const createdQuizzes: Quiz[] = [
  {
    id: 'created-quiz-1',
    title: 'Advanced React Patterns Workshop',
    description: 'Deep dive into advanced React patterns including render props, compound components, and custom hooks',
    categories: ['react', 'javascript'],
    difficulty: 'expert',
    timePerQuestion: 120,
    isLive: false,
    startTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
    createdById: 'admin-1',
    createdAt: new Date(Date.now() - 86400000 * 1), // 1 day ago
    updatedAt: new Date(),
    questionCount: 25,
    maxParticipants: 50,
    currentParticipants: 0,
    status: 'scheduled',
    quizCode: 'REACT1'
  },
  {
    id: 'created-quiz-2',
    title: 'Python Data Science Fundamentals',
    description: 'Essential concepts in data science using Python, pandas, and numpy',
    categories: ['python'],
    difficulty: 'medium',
    timePerQuestion: 90,
    isLive: false,
    startTime: new Date(Date.now() + 4 * 60 * 60 * 1000), // 4 hours from now
    createdById: 'admin-1',
    createdAt: new Date(Date.now() - 86400000 * 2), // 2 days ago
    updatedAt: new Date(),
    questionCount: 20,
    maxParticipants: 100,
    currentParticipants: 0,
    status: 'scheduled',
    quizCode: 'PYTH01'
  },
  {
    id: 'created-quiz-3',
    title: 'DevOps Best Practices',
    description: 'Modern DevOps practices including CI/CD, containerization, and monitoring',
    categories: ['devops', 'docker', 'kubernetes'],
    difficulty: 'hard',
    timePerQuestion: 100,
    isLive: true,
    startTime: new Date(Date.now() - 30 * 60 * 1000), // Started 30 minutes ago
    createdById: 'admin-2',
    createdAt: new Date(Date.now() - 86400000 * 3), // 3 days ago
    updatedAt: new Date(),
    questionCount: 30,
    maxParticipants: 75,
    currentParticipants: 23,
    status: 'active',
    quizCode: 'DEVOPS'
  },
  {
    id: 'created-quiz-4',
    title: 'JavaScript ES6+ Features',
    description: 'Modern JavaScript features and best practices for 2024',
    categories: ['javascript', 'typescript'],
    difficulty: 'medium',
    timePerQuestion: 75,
    isLive: false,
    startTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    createdById: 'admin-1',
    createdAt: new Date(Date.now() - 86400000 * 1), // 1 day ago
    updatedAt: new Date(),
    questionCount: 18,
    maxParticipants: 200,
    currentParticipants: 0,
    status: 'scheduled',
    quizCode: 'JS2024'
  },
  {
    id: 'created-quiz-5',
    title: 'Database Design Principles',
    description: 'Fundamental principles of database design and optimization',
    categories: ['mysql', 'mongodb'],
    difficulty: 'hard',
    timePerQuestion: 110,
    isLive: false,
    startTime: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    endTime: new Date(Date.now() - 30 * 60 * 1000), // Ended 30 minutes ago
    createdById: 'admin-3',
    createdAt: new Date(Date.now() - 86400000 * 5), // 5 days ago
    updatedAt: new Date(),
    questionCount: 22,
    maxParticipants: 60,
    currentParticipants: 45,
    status: 'completed',
    quizCode: 'DBDES1'
  },
  {
    id: 'created-quiz-6',
    title: 'Cloud Architecture on AWS',
    description: 'Design scalable and secure cloud architectures using AWS services',
    categories: ['aws', 'devops'],
    difficulty: 'expert',
    timePerQuestion: 150,
    isLive: false,
    startTime: new Date(Date.now() + 1 * 60 * 1000), // 1 minute from now (for testing activation)
    createdById: 'admin-2',
    createdAt: new Date(Date.now() - 86400000 * 1), // 1 day ago
    updatedAt: new Date(),
    questionCount: 35,
    maxParticipants: 40,
    currentParticipants: 0,
    status: 'scheduled',
    quizCode: 'AWS001'
  },
  // NEW: Add a competition quiz
  {
    id: 'competition-quiz-1',
    title: 'University Programming Championship 2024',
    description: 'Annual programming competition for computer science students. Only pre-registered participants can join.',
    categories: ['javascript', 'python', 'java'],
    difficulty: 'expert',
    timePerQuestion: 120,
    isLive: true,
    startTime: new Date(Date.now() - 30 * 60 * 1000), // Started 30 minutes ago
    createdById: 'admin-1',
    createdAt: new Date(Date.now() - 86400000),
    updatedAt: new Date(),
    questionCount: 50,
    maxParticipants: 1000,
    currentParticipants: 247,
    status: 'active',
    quizCode: 'COMP2024',
    isCompetition: true, // NEW: Mark as competition
    registeredParticipants: [] // NEW: Will be populated by competition service
  }
];

// Generate questions for created quizzes
const generateCreatedQuizQuestions = (quizId: string, questionCount: number): Question[] => {
  const questions: Question[] = [];
  
  // Find the quiz to get its categories
  const quiz = createdQuizzes.find(q => q.id === quizId);
  const categories = quiz?.categories || ['javascript'];
  
  // Question templates for created quizzes
  const questionTemplates = {
    react: [
      {
        text: 'What is the purpose of React.memo()?',
        options: [
          { text: 'To memoize component state' },
          { text: 'To prevent unnecessary re-renders of functional components' },
          { text: 'To cache API responses' },
          { text: 'To optimize bundle size' }
        ],
        correctIndex: 1,
        explanation: 'React.memo() is a higher-order component that prevents unnecessary re-renders by memoizing the result and only re-rendering when props change.'
      },
      {
        text: 'Which hook would you use to perform cleanup in a functional component?',
        options: [
          { text: 'useCleanup()' },
          { text: 'useEffect() with a return function' },
          { text: 'useDestroy()' },
          { text: 'useUnmount()' }
        ],
        correctIndex: 1,
        explanation: 'useEffect() can return a cleanup function that runs when the component unmounts or before the effect runs again.'
      }
    ],
    python: [
      {
        text: 'What is the difference between a list and a tuple in Python?',
        options: [
          { text: 'Lists are mutable, tuples are immutable' },
          { text: 'Lists are immutable, tuples are mutable' },
          { text: 'No difference' },
          { text: 'Lists are faster than tuples' }
        ],
        correctIndex: 0,
        explanation: 'Lists are mutable (can be changed after creation) while tuples are immutable (cannot be changed after creation).'
      },
      {
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
        text: 'What is the difference between `map()` and `forEach()` in JavaScript?',
        options: [
          { text: 'No difference' },
          { text: 'map() returns a new array, forEach() returns undefined' },
          { text: 'forEach() returns a new array, map() returns undefined' },
          { text: 'map() is faster than forEach()' }
        ],
        correctIndex: 1,
        explanation: 'map() creates and returns a new array with the results of calling a function on every element, while forEach() executes a function for each element but returns undefined.'
      },
      {
        text: 'What is event bubbling in JavaScript?',
        options: [
          { text: 'Events moving from child to parent elements' },
          { text: 'Events moving from parent to child elements' },
          { text: 'Events being cancelled' },
          { text: 'Events being duplicated' }
        ],
        correctIndex: 0,
        explanation: 'Event bubbling is when an event starts from the target element and bubbles up through its parent elements in the DOM hierarchy.'
      }
    ],
    java: [
      {
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
    devops: [
      {
        text: 'What is the main benefit of containerization?',
        options: [
          { text: 'Faster execution' },
          { text: 'Application portability and consistency across environments' },
          { text: 'Reduced memory usage' },
          { text: 'Better security' }
        ],
        correctIndex: 1,
        explanation: 'Containerization provides application portability and consistency by packaging applications with their dependencies, ensuring they run the same way across different environments.'
      },
      {
        text: 'What does CI/CD stand for?',
        options: [
          { text: 'Continuous Integration/Continuous Deployment' },
          { text: 'Code Integration/Code Deployment' },
          { text: 'Container Integration/Container Deployment' },
          { text: 'Continuous Improvement/Continuous Development' }
        ],
        correctIndex: 0,
        explanation: 'CI/CD stands for Continuous Integration/Continuous Deployment, a practice that automates the integration and deployment of code changes.'
      }
    ],
    docker: [
      {
        text: 'What is the difference between a Docker image and a Docker container?',
        options: [
          { text: 'No difference' },
          { text: 'An image is a template, a container is a running instance' },
          { text: 'A container is a template, an image is a running instance' },
          { text: 'Images are larger than containers' }
        ],
        correctIndex: 1,
        explanation: 'A Docker image is a read-only template used to create containers, while a container is a running instance of an image.'
      }
    ],
    aws: [
      {
        text: 'What is Amazon EC2?',
        options: [
          { text: 'A storage service' },
          { text: 'A compute service providing virtual servers' },
          { text: 'A database service' },
          { text: 'A networking service' }
        ],
        correctIndex: 1,
        explanation: 'Amazon EC2 (Elastic Compute Cloud) is a web service that provides resizable compute capacity in the cloud via virtual servers.'
      },
      {
        text: 'What is the purpose of AWS IAM?',
        options: [
          { text: 'To manage storage' },
          { text: 'To manage identity and access control' },
          { text: 'To manage databases' },
          { text: 'To manage networking' }
        ],
        correctIndex: 1,
        explanation: 'AWS IAM (Identity and Access Management) is used to securely control access to AWS services and resources.'
      }
    ]
  };
  
  // Generate questions
  for (let i = 0; i < questionCount; i++) {
    const categoryIndex = i % categories.length;
    const category = categories[categoryIndex];
    const templates = questionTemplates[category as keyof typeof questionTemplates] || questionTemplates.javascript;
    const templateIndex = Math.floor(i / categories.length) % templates.length;
    const template = templates[templateIndex];
    
    const question: Question = {
      id: `question-${quizId}-${i + 1}`,
      quizId: quizId,
      text: `${template.text} (Question ${i + 1})`,
      options: template.options.map((option, index) => ({
        id: `option-${quizId}-${i + 1}-${index + 1}`,
        text: option.text
      })),
      correctOptionId: `option-${quizId}-${i + 1}-${template.correctIndex + 1}`,
      points: 10,
      explanation: template.explanation
    };
    
    questions.push(question);
  }
  
  return questions;
};

// Store for created quiz questions
const createdQuizQuestions: Record<string, Question[]> = {};

// Initialize questions for created quizzes
createdQuizzes.forEach(quiz => {
  createdQuizQuestions[quiz.id] = generateCreatedQuizQuestions(quiz.id, quiz.questionCount);
});

// Function to get questions for a created quiz
export const getCreatedQuizQuestions = (quizId: string): Question[] => {
  if (createdQuizQuestions[quizId]) {
    return createdQuizQuestions[quizId];
  }
  
  // If not found, try to generate questions for the quiz
  const quiz = createdQuizzes.find(q => q.id === quizId);
  if (quiz) {
    const questions = generateCreatedQuizQuestions(quizId, quiz.questionCount);
    createdQuizQuestions[quizId] = questions;
    return questions;
  }
  
  return [];
};

// Function to find quiz by code (case-insensitive)
export function findQuizByCode(code: string): Quiz | null {
  const normalizedCode = code.toUpperCase().trim();
  
  // Search in created quizzes first
  const createdQuiz = createdQuizzes.find(quiz => 
    quiz.quizCode?.toUpperCase() === normalizedCode
  );
  
  if (createdQuiz) {
    return createdQuiz;
  }
  
  // If not found in created quizzes, search by ID as fallback
  return createdQuizzes.find(quiz => quiz.id.toUpperCase() === normalizedCode) || null;
}

// Function to add a new created quiz
export function addCreatedQuiz(quiz: Quiz): void {
  // Ensure quiz has a code
  if (!quiz.quizCode) {
    quiz.quizCode = generateQuizCode();
  }
  
  createdQuizzes.push(quiz);
  
  // Generate questions for the new quiz
  createdQuizQuestions[quiz.id] = generateCreatedQuizQuestions(quiz.id, quiz.questionCount);
}

// Function to update a created quiz
export function updateCreatedQuiz(quizId: string, updates: Partial<Quiz>): Quiz | null {
  const index = createdQuizzes.findIndex(q => q.id === quizId);
  if (index !== -1) {
    createdQuizzes[index] = { ...createdQuizzes[index], ...updates, updatedAt: new Date() };
    
    // If question count changed, regenerate questions
    if (updates.questionCount && updates.questionCount !== createdQuizzes[index].questionCount) {
      createdQuizQuestions[quizId] = generateCreatedQuizQuestions(quizId, updates.questionCount);
    }
    
    return createdQuizzes[index];
  }
  return null;
}

// Function to delete a created quiz
export function deleteCreatedQuiz(quizId: string): boolean {
  const index = createdQuizzes.findIndex(q => q.id === quizId);
  if (index !== -1) {
    createdQuizzes.splice(index, 1);
    delete createdQuizQuestions[quizId]; // Also remove questions
    return true;
  }
  return false;
}

// Function to get only active created quizzes (for main quiz list)
export function getActiveCreatedQuizzes(): Quiz[] {
  return createdQuizzes.filter(quiz => quiz.status === 'active');
}

// Function to get all created quizzes
export function getAllCreatedQuizzes(): Quiz[] {
  return [...createdQuizzes];
}

// Function to check if a quiz code is already taken
export function isQuizCodeTaken(code: string): boolean {
  const normalizedCode = code.toUpperCase().trim();
  return createdQuizzes.some(quiz => quiz.quizCode?.toUpperCase() === normalizedCode);
}

// Function to generate a unique quiz code
export function generateUniqueQuizCode(): string {
  let code: string;
  let attempts = 0;
  const maxAttempts = 100;
  
  do {
    code = generateQuizCode();
    attempts++;
  } while (isQuizCodeTaken(code) && attempts < maxAttempts);
  
  if (attempts >= maxAttempts) {
    // Fallback to timestamp-based code if we can't generate a unique one
    code = `QZ${Date.now().toString().slice(-4)}`;
  }
  
  return code;
}