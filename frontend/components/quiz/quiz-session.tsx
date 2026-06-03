"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { QuestionCard } from '@/components/quiz/question-card';
import { QuizResults } from '@/components/quiz/quiz-results';
import { getQuestionsForQuiz, mockQuizzes } from '@/lib/mock-data';
import { getAllCreatedQuizzes } from '@/lib/created-quizzes-data';
import { CompetitionService } from '@/lib/competition-service';
import { Question, QuizState, Quiz } from '@/lib/types';
import { Clock, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface QuizSessionProps {
  quizId: string;
  onComplete: () => void;
}

export function QuizSession({ quizId, onComplete }: QuizSessionProps) {
  const { toast } = useToast();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  
  const [quizState, setQuizState] = useState<QuizState>({
    currentQuestionIndex: 0,
    answers: {},
    timeRemaining: 30,
    isSubmitted: false,
  });
  
  const [results, setResults] = useState<{
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    timeSpent: number;
    userAnswers: Record<string, string>;
  } | null>(null);

  // Load quiz and questions on component mount
  useEffect(() => {
    const loadQuizData = async () => {
      setIsLoadingQuiz(true);
      setLoadError(null);
      
      try {
        // Find quiz in both mock quizzes and created quizzes
        const allQuizzes = [...mockQuizzes, ...getAllCreatedQuizzes()];
        const foundQuiz = allQuizzes.find(q => q.id === quizId);
        
        if (!foundQuiz) {
          throw new Error(`Quiz with ID "${quizId}" not found`);
        }
        
        setQuiz(foundQuiz);
        
        // Load questions for this quiz
        const quizQuestions = getQuestionsForQuiz(quizId);
        
        if (quizQuestions.length === 0) {
          throw new Error(`No questions found for quiz "${foundQuiz.title}"`);
        }
        
        // Verify question count matches expected
        if (quizQuestions.length !== foundQuiz.questionCount) {
          console.warn(
            `Question count mismatch for quiz "${foundQuiz.title}": ` +
            `Expected ${foundQuiz.questionCount}, got ${quizQuestions.length}`
          );
        }
        
        setQuestions(quizQuestions);
        
        // Initialize quiz state with proper time per question
        setQuizState(prev => ({
          ...prev,
          timeRemaining: foundQuiz.timePerQuestion,
        }));
        
        console.log(`Quiz loaded: "${foundQuiz.title}" with ${quizQuestions.length} questions`);
        
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to load quiz';
        setLoadError(errorMessage);
        console.error('Quiz loading error:', error);
        
        toast({
          variant: "destructive",
          title: "Quiz Loading Error",
          description: errorMessage,
        });
      } finally {
        setIsLoadingQuiz(false);
      }
    };
    
    loadQuizData();
  }, [quizId, toast]);
  
  // Timer effect
  useEffect(() => {
    if (quizState.isSubmitted || !quiz || isLoadingQuiz) return;
    
    const timer = setInterval(() => {
      setQuizState((prev) => {
        if (prev.timeRemaining <= 0) {
          clearInterval(timer);
          // Auto-advance to next question when time runs out
          if (prev.currentQuestionIndex < questions.length - 1) {
            return {
              ...prev,
              currentQuestionIndex: prev.currentQuestionIndex + 1,
              timeRemaining: quiz.timePerQuestion,
            };
          } else {
            // Auto-submit if this was the last question
            handleSubmit();
            return prev;
          }
        }
        return { ...prev, timeRemaining: prev.timeRemaining - 1 };
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [quizState.isSubmitted, quizState.currentQuestionIndex, quiz, questions.length, isLoadingQuiz]);
  
  const handleAnswer = (questionId: string, optionId: string) => {
    setQuizState((prev) => ({
      ...prev,
      answers: { ...prev.answers, [questionId]: optionId },
    }));

    // Update competition score in real-time (anonymous user)
    if (quiz?.isCompetition) {
      const currentAnswers = { ...quizState.answers, [questionId]: optionId };
      const answeredQuestions = Object.keys(currentAnswers).length;
      
      // Calculate current score
      let correctAnswers = 0;
      questions.forEach((question) => {
        if (currentAnswers[question.id] === question.correctOptionId) {
          correctAnswers++;
        }
      });
      
      const currentScore = Math.round((correctAnswers / questions.length) * 100);
      
      // Use anonymous user ID for demo
      const anonymousUserId = `anon-${Date.now()}`;
      CompetitionService.updateParticipantScore(
        anonymousUserId, 
        quiz.id, 
        currentScore, 
        answeredQuestions
      );
    }
  };
  
  const handleNextQuestion = () => {
    if (!quiz) return;
    
    if (quizState.currentQuestionIndex < questions.length - 1) {
      setQuizState((prev) => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        timeRemaining: quiz.timePerQuestion,
      }));
    } else {
      handleSubmit();
    }
  };
  
  const handlePrevQuestion = () => {
    if (!quiz) return;
    
    setQuizState((prev) => ({
      ...prev,
      currentQuestionIndex: Math.max(0, prev.currentQuestionIndex - 1),
      timeRemaining: quiz.timePerQuestion,
    }));
  };
  
  const handleSubmit = () => {
    if (!quiz || questions.length === 0) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Cannot submit quiz: Quiz data not loaded properly",
      });
      return;
    }
    
    // Calculate results
    let correctAnswers = 0;
    
    questions.forEach((question) => {
      if (quizState.answers[question.id] === question.correctOptionId) {
        correctAnswers++;
      }
    });
    
    const score = Math.round((correctAnswers / questions.length) * 100);
    const timeSpent = 120; // Mock time spent - in real app, track actual time
    
    // Update final competition leaderboard (anonymous user)
    if (quiz.isCompetition) {
      const anonymousUserId = `anon-${Date.now()}`;
      CompetitionService.updateLeaderboard(
        anonymousUserId,
        quiz.id,
        score,
        timeSpent
      );
    }
    
    setResults({
      score,
      correctAnswers,
      totalQuestions: questions.length,
      timeSpent,
      userAnswers: quizState.answers, // Include user answers for review
    });
    
    setQuizState((prev) => ({
      ...prev,
      isSubmitted: true,
    }));
    
    toast({
      title: "Quiz Completed!",
      description: `You scored ${score}% (${correctAnswers}/${questions.length} correct)`,
    });
  };
  
  // Loading state
  if (isLoadingQuiz) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">Loading Quiz...</h3>
            <p className="text-muted-foreground text-center">
              Preparing your quiz questions and settings
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Error state
  if (loadError || !quiz) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-red-900/20 bg-red-500/5 backdrop-blur-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-red-400">Quiz Loading Failed</h3>
            <p className="text-red-300 text-center mb-4">
              {loadError || "Quiz not found or failed to load"}
            </p>
            <Button onClick={onComplete} variant="outline">
              Return to Quiz List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // No questions state
  if (questions.length === 0) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-orange-900/20 bg-orange-500/5 backdrop-blur-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertCircle className="h-12 w-12 text-orange-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-orange-400">No Questions Available</h3>
            <p className="text-orange-300 text-center mb-4">
              This quiz doesn't have any questions yet. Please try another quiz.
            </p>
            <Button onClick={onComplete} variant="outline">
              Return to Quiz List
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Results state
  if (results) {
    return <QuizResults results={results} quizId={quizId} onRestart={onComplete} />;
  }
  
  const currentQuestion = questions[quizState.currentQuestionIndex];
  const progress = ((quizState.currentQuestionIndex + 1) / questions.length) * 100;
  
  return (
    <div className="max-w-4xl mx-auto">
      {/* Quiz Header with Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl font-bold text-foreground dark:text-white">{quiz.title}</h1>
              {quiz.isCompetition && (
                <div className="flex items-center gap-2 bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                  <Shield className="h-4 w-4 text-purple-400" />
                  <span className="text-sm font-medium text-purple-400">Competition</span>
                </div>
              )}
            </div>
            <p className="text-muted-foreground">
              Question {quizState.currentQuestionIndex + 1} of {questions.length}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-black/30 dark:bg-black/30 bg-gray-100 px-3 py-1 rounded-full">
              <Clock className="h-4 w-4 text-orange-400" />
              <div className={`text-sm font-medium ${quizState.timeRemaining < 10 ? 'text-orange-400' : 'text-foreground dark:text-white'}`}>
                {quizState.timeRemaining}s
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              {Object.keys(quizState.answers).length}/{questions.length} answered
            </div>
          </div>
        </div>
        <Progress value={progress} className="h-2" />
      </div>
      
      {/* Current Question */}
      <QuestionCard
        question={currentQuestion}
        selectedOption={quizState.answers[currentQuestion.id]}
        onSelectOption={(optionId) => handleAnswer(currentQuestion.id, optionId)}
      />
      
      {/* Navigation Controls */}
      <div className="mt-8 flex justify-between items-center">
        <Button
          variant="outline"
          onClick={handlePrevQuestion}
          disabled={quizState.currentQuestionIndex === 0}
          className="text-foreground dark:text-white border-border hover:bg-accent"
        >
          Previous
        </Button>
        
        <div className="flex items-center gap-4">
          {/* Question Status Indicators */}
          <div className="flex items-center gap-1">
            {questions.map((_, index) => (
              <div
                key={index}
                className={`w-2 h-2 rounded-full ${
                  index < quizState.currentQuestionIndex
                    ? 'bg-green-400' // Completed
                    : index === quizState.currentQuestionIndex
                    ? 'bg-blue-400' // Current
                    : 'bg-gray-600' // Upcoming
                }`}
              />
            ))}
          </div>
          
          {quizState.currentQuestionIndex < questions.length - 1 ? (
            <Button 
              onClick={handleNextQuestion}
              disabled={!quizState.answers[currentQuestion.id]}
            >
              Next Question
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={!quizState.answers[currentQuestion.id]}
              className="bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Submit Quiz
            </Button>
          )}
        </div>
      </div>
      
      {/* Quiz Info Footer */}
      <div className="mt-8 p-4 bg-black/20 dark:bg-black/20 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Total Questions:</span>
            <div className="font-medium text-foreground dark:text-white">{questions.length}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Time per Question:</span>
            <div className="font-medium text-foreground dark:text-white">{quiz.timePerQuestion}s</div>
          </div>
          <div>
            <span className="text-muted-foreground">Difficulty:</span>
            <div className="font-medium capitalize text-foreground dark:text-white">{quiz.difficulty}</div>
          </div>
          <div>
            <span className="text-muted-foreground">Progress:</span>
            <div className="font-medium text-foreground dark:text-white">{Math.round(progress)}%</div>
          </div>
        </div>
        
        {/* Competition Status */}
        {quiz.isCompetition && (
          <div className="mt-4 pt-4 border-t border-purple-900/20">
            <div className="flex items-center gap-2 text-sm">
              <Shield className="h-4 w-4 text-purple-400" />
              <span className="text-purple-400 font-medium">Competition Mode:</span>
              <span className="text-muted-foreground">
                Your progress is being tracked on the live leaderboard
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}