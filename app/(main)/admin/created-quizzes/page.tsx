"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreatedQuizzesList } from '@/components/admin/created-quizzes-list';
// ✅ REMOVED FIREBASE-RELATED SERVICE
// import { QuizActivationService } from '@/lib/quiz-activation-service';
import { createdQuizzes } from '@/lib/created-quizzes-data';
import { Quiz } from '@/lib/types';
import { Plus, Clock, CheckCircle, Calendar } from 'lucide-react';
import Link from 'next/link';

export default function CreatedQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>(createdQuizzes);
  const [stats, setStats] = useState({
    scheduled: 0,
    active: 0,
    completed: 0,
    total: 0
  });

  // ✅ Optionally replace this with backend polling, socket, or schedule simulation
  useEffect(() => {
    const now = new Date().getTime();

    // Simulate quiz activation based on a fake scheduled time
    setQuizzes(prevQuizzes =>
      prevQuizzes.map(quiz => {
        if (quiz.status === 'scheduled' && new Date(quiz.startTime).getTime() <= now) {
          return { ...quiz, status: 'active', isLive: true };
        }
        return quiz;
      })
    );
  }, []);

  // Update stats when quizzes change
  useEffect(() => {
    const newStats = {
      scheduled: quizzes.filter(q => q.status === 'scheduled').length,
      active: quizzes.filter(q => q.status === 'active').length,
      completed: quizzes.filter(q => q.status === 'completed').length,
      total: quizzes.length
    };
    setStats(newStats);
  }, [quizzes]);

  const handleQuizUpdate = (updatedQuiz: Quiz) => {
    setQuizzes(prevQuizzes =>
      prevQuizzes.map(quiz =>
        quiz.id === updatedQuiz.id ? updatedQuiz : quiz
      )
    );
  };

  const handleQuizDelete = (quizId: string) => {
    setQuizzes(prevQuizzes =>
      prevQuizzes.filter(quiz => quiz.id !== quizId)
    );
  };

  const scheduledQuizzes = quizzes.filter(q => q.status === 'scheduled');
  const activeQuizzes = quizzes.filter(q => q.status === 'active');
  const completedQuizzes = quizzes.filter(q => q.status === 'completed');

  return (
    <div className="container px-4 mx-auto max-w-7xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Created Quizzes</h1>
          <p className="text-muted-foreground mt-1">
            Manage quizzes you&#39;ve created and monitor their activation status
          </p>
        </div>
        <Button asChild>
          <Link href="/create/new">
            <Plus className="mr-2 h-4 w-4" /> Create New Quiz
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      {/* ... keep your original Cards here ... */}

      {/* Tabs and Lists */}
      {/* ... keep your original Tabs here ... */}
    </div>
  );
}
