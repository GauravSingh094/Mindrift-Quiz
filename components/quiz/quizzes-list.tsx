"use client";

import { useState, useMemo } from 'react';
import { mockQuizzes } from '@/lib/mock-data';
import { getActiveCreatedQuizzes } from '@/lib/created-quizzes-data';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Quiz } from '@/lib/types';
import { FilterState } from './quiz-filters';
import Link from 'next/link';
import { Clock, Users, Play, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface QuizzesListProps {
  filters: FilterState;
}

export function QuizzesList({ filters }: QuizzesListProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Combine original mock quizzes with active created quizzes
  const allQuizzes = useMemo(() => {
    const activeCreatedQuizzes = getActiveCreatedQuizzes();
    return [...mockQuizzes, ...activeCreatedQuizzes];
  }, []);

  // Filter quizzes based on current filters with enhanced deduplication
  const filteredQuizzes = useMemo(() => {
    console.log('🔍 Applying filters:', filters); // Debug log
    console.log('📊 Total quizzes before filtering:', allQuizzes.length); // Debug log
    
    // First, deduplicate quizzes by ID and title
    const uniqueQuizzes = allQuizzes.reduce((acc, quiz) => {
      const existingQuiz = acc.find(q => q.id === quiz.id || q.title === quiz.title);
      if (!existingQuiz) {
        acc.push(quiz);
      }
      return acc;
    }, [] as Quiz[]);

    console.log('📊 Unique quizzes after deduplication:', uniqueQuizzes.length); // Debug log

    const filtered = uniqueQuizzes.filter((quiz) => {
      // Only show active quizzes in the main list
      // Scheduled quizzes should only appear in the admin panel
      if (quiz.status !== 'active' && quiz.status !== 'live' && quiz.status !== 'created') {
        return false;
      }

      // Category filter (OR logic - quiz must have at least one selected category)
      if (filters.categories.length > 0) {
        const hasMatchingCategory = quiz.categories.some(category => 
          filters.categories.includes(category)
        );
        if (!hasMatchingCategory) {
          console.log('❌ Quiz filtered out by category:', quiz.title, 'Categories:', quiz.categories);
          return false;
        }
      }

      // Difficulty filter
      if (filters.difficulties.length > 0) {
        if (!filters.difficulties.includes(quiz.difficulty)) {
          console.log('❌ Quiz filtered out by difficulty:', quiz.title, 'Difficulty:', quiz.difficulty);
          return false;
        }
      }

      // Status filter
      if (filters.status.length > 0) {
        const quizStatus = quiz.isLive ? 'live' : 'available';
        if (!filters.status.includes(quizStatus)) {
          console.log('❌ Quiz filtered out by status:', quiz.title, 'Status:', quizStatus);
          return false;
        }
      }

      // Time limit filter (quiz total time should be <= selected time limit)
      if (filters.timeLimit !== null) {
        const quizTotalTime = Math.floor(quiz.timePerQuestion * quiz.questionCount / 60);
        if (quizTotalTime > filters.timeLimit) {
          console.log('❌ Quiz filtered out by time limit:', quiz.title, 'Time:', quizTotalTime, 'Limit:', filters.timeLimit);
          return false;
        }
      }

      console.log('✅ Quiz passed all filters:', quiz.title);
      return true;
    });

    console.log('📊 Final filtered quizzes:', filtered.length); // Debug log
    return filtered;
  }, [allQuizzes, filters]);

  const getQuizStatus = (quiz: Quiz) => {
    if (quiz.isLive) {
      return { label: 'Live Now', color: 'bg-green-500/10 text-green-400 border-green-500/20' };
    }
    return { label: 'Available', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' };
  };

  const getEstimatedTime = (quiz: Quiz) => {
    return Math.floor(quiz.timePerQuestion * quiz.questionCount / 60);
  };

  if (isLoading) {
    return (
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Card key={index} className="border-purple-900/20 bg-black/40 backdrop-blur-md animate-pulse">
            <div className="h-1 w-full bg-gray-600" />
            <CardHeader>
              <div className="h-6 bg-gray-600 rounded mb-2" />
              <div className="h-4 bg-gray-700 rounded" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="space-y-1">
                    <div className="h-3 bg-gray-700 rounded" />
                    <div className="h-4 bg-gray-600 rounded" />
                  </div>
                ))}
              </div>
            </CardContent>
            <CardFooter>
              <div className="h-10 bg-gray-600 rounded w-full" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (filteredQuizzes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center">
            <Play className="h-12 w-12 text-primary/50" />
          </div>
          <h3 className="text-xl font-semibold text-foreground dark:text-white">No quizzes found</h3>
          <p className="text-muted-foreground">
            We couldn't find any quizzes matching your current filters. 
            Try adjusting your search criteria or clearing some filters.
          </p>
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            {filters.categories.length > 0 && (
              <Badge variant="outline" className="text-foreground dark:text-white">
                {filters.categories.length} categor{filters.categories.length === 1 ? 'y' : 'ies'}
              </Badge>
            )}
            {filters.difficulties.length > 0 && (
              <Badge variant="outline" className="text-foreground dark:text-white">
                {filters.difficulties.length} difficult{filters.difficulties.length === 1 ? 'y' : 'ies'}
              </Badge>
            )}
            {filters.status.length > 0 && (
              <Badge variant="outline" className="text-foreground dark:text-white">
                {filters.status.length} status filter{filters.status.length === 1 ? '' : 's'}
              </Badge>
            )}
            {filters.timeLimit && (
              <Badge variant="outline" className="text-foreground dark:text-white">
                ≤ {filters.timeLimit} minutes
              </Badge>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {filteredQuizzes.length} of {allQuizzes.length} quiz{filteredQuizzes.length === 1 ? '' : 'es'}
        </p>
      </div>
      
      <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
        {filteredQuizzes.map((quiz, index) => {
          const status = getQuizStatus(quiz);
          const estimatedTime = getEstimatedTime(quiz);
          
          return (
            <Card 
              key={`${quiz.id}-${index}`} // Enhanced key to prevent duplicates
              className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md overflow-hidden hover:bg-black/50 dark:hover:bg-black/50 hover:bg-white/95 transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:shadow-purple-500/10 group"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards'
              }}
            >
              <div className={`h-1 w-full ${getCategoryColor(quiz.categories[0])} transition-all duration-300 group-hover:h-2`} />
              
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start gap-2">
                  <CardTitle className="text-lg leading-tight group-hover:text-primary transition-colors text-foreground dark:text-white">
                    {quiz.title}
                  </CardTitle>
                  <div className="flex flex-col gap-1">
                    <Badge variant="outline" className={`${getDifficultyClass(quiz.difficulty)} text-foreground dark:text-white`}>
                      {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                    </Badge>
                    <Badge variant="outline" className={status.color}>
                      {status.label}
                    </Badge>
                  </div>
                </div>
                <CardDescription className="text-sm line-clamp-2 text-muted-foreground">
                  {quiz.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                      <Play className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Category</div>
                      <div className="font-medium text-xs text-foreground dark:text-white">
                        {quiz.categories[0].replace(/_/g, ' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-purple-400" />
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Duration</div>
                      <div className="font-medium text-xs text-foreground dark:text-white">{estimatedTime} min</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                      <Users className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Questions</div>
                      <div className="font-medium text-xs text-foreground dark:text-white">{quiz.questionCount}</div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center">
                      <Calendar className="h-4 w-4 text-orange-400" />
                    </div>
                    <div>
                      <div className="text-muted-foreground text-xs">Created</div>
                      <div className="font-medium text-xs text-foreground dark:text-white">
                        {formatDistanceToNow(new Date(quiz.createdAt), { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                </div>
                
                {quiz.isLive && quiz.currentParticipants > 0 && (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-green-400">
                        {quiz.currentParticipants} participants online
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
              
              <CardFooter className="pt-4">
                <Button asChild className="w-full group-hover:bg-primary/90 transition-colors">
                  <Link href={`/quizzes/${quiz.id}`}>
                    <Play className="mr-2 h-4 w-4" />
                    Start Quiz
                  </Link>
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function getCategoryColor(category: string): string {
  const colorMap: Record<string, string> = {
    c: 'bg-blue-500',
    cpp: 'bg-blue-600',
    java: 'bg-orange-500',
    python: 'bg-green-500',
    javascript: 'bg-yellow-500',
    typescript: 'bg-blue-400',
    mysql: 'bg-cyan-500',
    mongodb: 'bg-green-600',
    react: 'bg-cyan-400',
    node: 'bg-green-400',
    angular: 'bg-red-500',
    vue: 'bg-green-500',
    docker: 'bg-blue-500',
    kubernetes: 'bg-blue-600',
    aws: 'bg-orange-400',
    azure: 'bg-blue-500',
    devops: 'bg-purple-500',
  };
  return colorMap[category] || 'bg-gray-500';
}

function getDifficultyClass(difficulty: string): string {
  const classMap: Record<string, string> = {
    easy: 'bg-green-500/10 text-green-400 border-green-500/20',
    medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    hard: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    expert: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  return classMap[difficulty] || '';
}