import { Metadata } from 'next';
import { QuizDetail } from '@/components/quiz/quiz-detail';
import { mockQuizzes } from '@/lib/mock-data';

export const metadata: Metadata = {
  title: 'Quiz | Mindrift',
  description: 'Take a quiz on Mindrift',
};

// Generate static params for all quiz IDs at build time
export async function generateStaticParams() {
  return mockQuizzes.map((quiz) => ({
    id: quiz.id,
  }));
}

export default function QuizPage({ params }: { params: { id: string } }) {
  return (
    <div className="container px-4 mx-auto max-w-4xl">
      <QuizDetail quizId={params.id} />
    </div>
  );
}