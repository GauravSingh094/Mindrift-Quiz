"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreatedQuizzesList } from '@/components/admin/created-quizzes-list';
import { QuizActivationService } from '@/lib/quiz-activation-service';
import { createdQuizzes } from '@/lib/created-quizzes-data';
import { Quiz } from '@/lib/types';
import { Plus, Clock, CheckCircle, Calendar, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow, format } from 'date-fns';

export default function CreatedQuizzesPage() {
  const [quizzes, setQuizzes] = useState<Quiz[]>(createdQuizzes);
  const [stats, setStats] = useState({
    scheduled: 0,
    active: 0,
    completed: 0,
    total: 0
  });

  // Initialize quiz activation service
  useEffect(() => {
    const activationService = new QuizActivationService();
    
    // Set up activation callback
    activationService.onQuizActivated = (activatedQuiz: Quiz) => {
      setQuizzes(prevQuizzes => 
        prevQuizzes.map(quiz => 
          quiz.id === activatedQuiz.id 
            ? { ...quiz, status: 'active', isLive: true }
            : quiz
        )
      );
    };

    // Start monitoring
    activationService.startMonitoring(quizzes);

    // Cleanup on unmount
    return () => {
      activationService.stopMonitoring();
    };
  }, [quizzes]);

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
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Created Quizzes</h1>
          <p className="text-muted-foreground mt-1">
            Manage quizzes you've created and monitor their activation status
          </p>
        </div>
        <Button asChild>
          <Link href="/create/new">
            <Plus className="mr-2 h-4 w-4" /> Create New Quiz
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Scheduled</CardTitle>
            <Clock className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.scheduled}</div>
            <p className="text-xs text-muted-foreground">
              Waiting for activation
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently joinable
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Calendar className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completed}</div>
            <p className="text-xs text-muted-foreground">
              Finished quizzes
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Created</CardTitle>
            <Plus className="h-4 w-4 text-orange-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All time
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quiz Lists by Status */}
      <Tabs defaultValue="scheduled" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Scheduled ({stats.scheduled})
          </TabsTrigger>
          <TabsTrigger value="active" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Active ({stats.active})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Completed ({stats.completed})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="scheduled" className="mt-6">
          <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-blue-400" />
                Scheduled Quizzes
              </CardTitle>
              <CardDescription>
                Quizzes waiting to be automatically activated at their scheduled time
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scheduledQuizzes.length === 0 ? (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Scheduled Quizzes</h3>
                  <p className="text-muted-foreground mb-4">
                    Create a new quiz to get started
                  </p>
                  <Button asChild>
                    <Link href="/create/new">Create Quiz</Link>
                  </Button>
                </div>
              ) : (
                <CreatedQuizzesList 
                  quizzes={scheduledQuizzes}
                  onQuizUpdate={handleQuizUpdate}
                  onQuizDelete={handleQuizDelete}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="active" className="mt-6">
          <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Active Quizzes
              </CardTitle>
              <CardDescription>
                Quizzes that are currently live and joinable by participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              {activeQuizzes.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Quizzes</h3>
                  <p className="text-muted-foreground">
                    Scheduled quizzes will appear here when they become active
                  </p>
                </div>
              ) : (
                <CreatedQuizzesList 
                  quizzes={activeQuizzes}
                  onQuizUpdate={handleQuizUpdate}
                  onQuizDelete={handleQuizDelete}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-purple-400" />
                Completed Quizzes
              </CardTitle>
              <CardDescription>
                Quizzes that have finished and are no longer accepting participants
              </CardDescription>
            </CardHeader>
            <CardContent>
              {completedQuizzes.length === 0 ? (
                <div className="text-center py-8">
                  <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Completed Quizzes</h3>
                  <p className="text-muted-foreground">
                    Completed quizzes will appear here
                  </p>
                </div>
              ) : (
                <CreatedQuizzesList 
                  quizzes={completedQuizzes}
                  onQuizUpdate={handleQuizUpdate}
                  onQuizDelete={handleQuizDelete}
                />
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}