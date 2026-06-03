"use client";

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { getQuestionsForQuiz } from '@/lib/mock-data';
import { getCreatedQuizQuestions } from '@/lib/created-quizzes-data';
import { ReviewQuestion } from '@/components/quiz/review-question';
import { Clock, Medal, RotateCcw, Share2, Trophy, Eye } from 'lucide-react';
import { CATEGORIES, mockLeaderboard } from '@/lib/mock-data';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useState, useEffect } from 'react';
import { Question } from '@/lib/types';

interface QuizResultsProps {
  results: {
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    timeSpent: number;
    userAnswers?: Record<string, string>; // questionId -> selectedOptionId
  };
  quizId?: string;
  onRestart: () => void;
}

export function QuizResults({ results, quizId, onRestart }: QuizResultsProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(true);
  const [showReview, setShowReview] = useState(false);
  
  const scoreColor = getScoreColor(results.score);
  const scoreMessage = getScoreMessage(results.score);
  
  // Load questions for review
  useEffect(() => {
    if (quizId) {
      setIsLoadingQuestions(true);
      
      try {
        // Try to get questions from both sources
        let quizQuestions = getQuestionsForQuiz(quizId);
        
        // If not found in mock data, try created quizzes
        if (quizQuestions.length === 0) {
          quizQuestions = getCreatedQuizQuestions(quizId);
        }
        
        setQuestions(quizQuestions);
      } catch (error) {
        console.error('Failed to load questions for review:', error);
        setQuestions([]);
      } finally {
        setIsLoadingQuestions(false);
      }
    } else {
      setIsLoadingQuestions(false);
    }
  }, [quizId]);
  
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl text-foreground dark:text-white">Quiz Results</CardTitle>
          <CardDescription>
            See how you did and compare with others
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex justify-center">
            <div className={`w-36 h-36 rounded-full flex items-center justify-center ${scoreColor} text-4xl font-bold`}>
              {results.score}%
            </div>
          </div>
          
          <div className="text-center">
            <h3 className="text-xl font-medium mb-1 text-foreground dark:text-white">{scoreMessage}</h3>
            <p className="text-muted-foreground">
              You got {results.correctAnswers} out of {results.totalQuestions} questions right
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 max-w-md mx-auto">
            <div className="flex flex-col items-center bg-black/30 dark:bg-black/30 bg-gray-100 p-3 rounded-lg">
              <Trophy className="h-5 w-5 text-yellow-400 mb-1" />
              <div className="text-sm text-muted-foreground">Position</div>
              <div className="font-medium text-foreground dark:text-white">12th of 241</div>
            </div>
            <div className="flex flex-col items-center bg-black/30 dark:bg-black/30 bg-gray-100 p-3 rounded-lg">
              <Clock className="h-5 w-5 text-blue-400 mb-1" />
              <div className="text-sm text-muted-foreground">Time Spent</div>
              <div className="font-medium text-foreground dark:text-white">{Math.floor(results.timeSpent / 60)}m {results.timeSpent % 60}s</div>
            </div>
            <div className="flex flex-col items-center bg-black/30 dark:bg-black/30 bg-gray-100 p-3 rounded-lg">
              <Medal className="h-5 w-5 text-green-400 mb-1" />
              <div className="text-sm text-muted-foreground">Performance</div>
              <div className="font-medium text-foreground dark:text-white">Above Average</div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4 justify-center">
          {questions.length > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setShowReview(!showReview)}
              className="text-foreground dark:text-white border-border hover:bg-accent"
            >
              <Eye className="mr-2 h-4 w-4" />
              {showReview ? 'Hide Review' : 'Review Answers'}
            </Button>
          )}
          <Button variant="outline" onClick={onRestart} className="text-foreground dark:text-white border-border hover:bg-accent">
            <RotateCcw className="mr-2 h-4 w-4" />
            Take Another Quiz
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Share2 className="mr-2 h-4 w-4" />
            Share Results
          </Button>
        </CardFooter>
      </Card>
      
      {showReview && (
        <Tabs defaultValue="answers" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="answers">Your Answers</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>
          
          <TabsContent value="answers" className="mt-4 space-y-6">
            {isLoadingQuestions ? (
              <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                  <p className="text-muted-foreground">Loading question review...</p>
                </CardContent>
              </Card>
            ) : questions.length > 0 ? (
              <>
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">Question Review</h3>
                  <p className="text-muted-foreground">
                    Review all {questions.length} questions and see the correct answers
                  </p>
                </div>
                {questions.map((question, index) => (
                  <ReviewQuestion
                    key={question.id}
                    question={question}
                    userAnswer={results.userAnswers?.[question.id] || `option-${question.quizId}-${index + 1}-1`} // Mock user answer
                    questionNumber={index + 1}
                    totalQuestions={questions.length}
                  />
                ))}
              </>
            ) : (
              <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
                <CardContent className="flex flex-col items-center justify-center py-16">
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 mx-auto bg-orange-500/10 rounded-full flex items-center justify-center">
                      <Trophy className="h-8 w-8 text-orange-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground dark:text-white">Question Review Unavailable</h3>
                    <p className="text-muted-foreground">
                      Questions for this quiz are not available for review at this time.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="leaderboard" className="mt-4">
            <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
              <CardHeader>
                <CardTitle className="text-foreground dark:text-white">Leaderboard</CardTitle>
                <CardDescription>
                  See how you compare to other participants
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockLeaderboard.map((entry, index) => (
                    <div 
                      key={entry.user.id} 
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg",
                        index === 0 ? "bg-yellow-500/10 border border-yellow-500/20" :
                        index === 1 ? "bg-gray-500/10 border border-gray-500/20" :
                        index === 2 ? "bg-amber-700/10 border border-amber-700/20" :
                        "bg-black/20 dark:bg-black/20 bg-gray-50"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-full font-bold",
                          index === 0 ? "bg-yellow-500 text-black" :
                          index === 1 ? "bg-gray-400 text-black" :
                          index === 2 ? "bg-amber-700 text-white" :
                          "bg-primary/10 text-foreground dark:text-white"
                        )}>
                          {entry.rank}
                        </div>
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={entry.user.image} />
                          <AvatarFallback>{entry.user.name.substring(0, 2)}</AvatarFallback>
                        </Avatar>
                        <div className="font-medium text-foreground dark:text-white">{entry.user.name}</div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-sm text-muted-foreground">
                          {Math.floor(entry.timeSpent / 60)}m {entry.timeSpent % 60}s
                        </div>
                        <div className="font-bold w-12 text-right text-foreground dark:text-white">{entry.score}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

function getScoreColor(score: number): string {
  if (score >= 90) return 'bg-green-500/20 text-green-400';
  if (score >= 70) return 'bg-blue-500/20 text-blue-400';
  if (score >= 50) return 'bg-yellow-500/20 text-yellow-400';
  return 'bg-red-500/20 text-red-400';
}

function getScoreMessage(score: number): string {
  if (score >= 90) return 'Excellent!';
  if (score >= 70) return 'Good Job!';
  if (score >= 50) return 'Not Bad!';
  return 'Keep Practicing!';
}

function cn(...classes: (string | undefined)[]): string {
  return classes.filter(Boolean).join(' ');
}