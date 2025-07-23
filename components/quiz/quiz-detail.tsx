"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { mockQuizzes, getQuestionsForQuiz } from '@/lib/mock-data';
import { getAllCreatedQuizzes } from '@/lib/created-quizzes-data';
import { CompetitionService } from '@/lib/competition-service';
import { Quiz } from '@/lib/types';
import { Clock, Info, LayoutList, Trophy, Users, Play, AlertCircle, Loader2, CheckCircle, Shield } from 'lucide-react';
import { QuizSession } from '@/components/quiz/quiz-session';
import { useToast } from '@/hooks/use-toast';

interface QuizDetailProps {
  quizId: string;
}

interface QuizStartState {
  isStarting: boolean;
  startError: string | null;
  isStarted: boolean;
}

interface QuizValidationResult {
  isValid: boolean;
  error?: string;
  quiz?: Quiz;
  questionCount?: number;
}

export function QuizDetail({ quizId }: QuizDetailProps) {
  const router = useRouter();
  const { toast } = useToast();
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [isLoadingQuiz, setIsLoadingQuiz] = useState(true);
  const [questionCount, setQuestionCount] = useState<number>(0);
  
  const [startState, setStartState] = useState<QuizStartState>({
    isStarting: false,
    startError: null,
    isStarted: false,
  });

  // Load quiz data on component mount
  useEffect(() => {
    const loadQuiz = async () => {
      setIsLoadingQuiz(true);
      
      try {
        // Find quiz in both mock quizzes and created quizzes
        const allQuizzes = [...mockQuizzes, ...getAllCreatedQuizzes()];
        const foundQuiz = allQuizzes.find(q => q.id === quizId);
        
        if (!foundQuiz) {
          throw new Error('Quiz not found');
        }
        
        setQuiz(foundQuiz);
        
        // Load and validate questions
        const questions = getQuestionsForQuiz(quizId);
        setQuestionCount(questions.length);
        
        // Warn if question count doesn't match expected
        if (questions.length !== foundQuiz.questionCount) {
          console.warn(
            `Question count mismatch for quiz "${foundQuiz.title}": ` +
            `Expected ${foundQuiz.questionCount}, got ${questions.length}`
          );
        }
        
      } catch (error) {
        console.error('Failed to load quiz:', error);
        setQuiz(null);
      } finally {
        setIsLoadingQuiz(false);
      }
    };
    
    loadQuiz();
  }, [quizId]);

  // Comprehensive quiz validation before starting
  const validateQuizStart = async (quiz: Quiz): Promise<QuizValidationResult> => {
    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if quiz exists
      if (!quiz) {
        return { isValid: false, error: 'Quiz not found.' };
      }

      // Competition access validation (no user auth needed)
      if (quiz.isCompetition) {
        // For demo purposes, allow anyone to join competitions
        console.log('Competition quiz - allowing access for demo');
      }
      
      // Check quiz status
      if (quiz.status === 'cancelled') {
        return { isValid: false, error: 'This quiz has been cancelled.' };
      }
      
      if (quiz.status === 'completed') {
        return { isValid: false, error: 'This quiz has already ended.' };
      }
      
      if (quiz.status === 'scheduled') {
        return { 
          isValid: false, 
          error: `This quiz is scheduled to start at ${new Date(quiz.startTime).toLocaleString()}.` 
        };
      }
      
      // Check if quiz is full
      if (quiz.currentParticipants >= quiz.maxParticipants) {
        return { 
          isValid: false, 
          error: `This quiz is full. Maximum participants (${quiz.maxParticipants}) reached.` 
        };
      }
      
      // Check if quiz hasn't started yet (for scheduled quizzes)
      if (quiz.startTime > new Date() && !quiz.isLive) {
        return { 
          isValid: false, 
          error: 'This quiz hasn\'t started yet.' 
        };
      }
      
      // Validate questions are available
      const questions = getQuestionsForQuiz(quiz.id);
      if (questions.length === 0) {
        return { 
          isValid: false, 
          error: 'This quiz has no questions available. Please contact the quiz creator.' 
        };
      }
      
      // Check if question count matches expected
      if (questions.length !== quiz.questionCount) {
        console.warn(
          `Question count mismatch: Expected ${quiz.questionCount}, got ${questions.length}`
        );
        // Still allow the quiz to start, but with actual question count
      }
      
      // Simulate random validation failure for demo (very low chance)
      if (Math.random() < 0.02) { // 2% chance of failure
        return { 
          isValid: false, 
          error: 'Unable to join quiz at this time. Please try again.' 
        };
      }
      
      return { 
        isValid: true, 
        quiz, 
        questionCount: questions.length 
      };
      
    } catch (error) {
      return { 
        isValid: false, 
        error: 'Failed to validate quiz. Please try again.' 
      };
    }
  };

  const handleStartQuiz = async () => {
    if (startState.isStarting || !quiz) return;

    setStartState({
      isStarting: true,
      startError: null,
      isStarted: false,
    });

    try {
      // Validate quiz start
      const validation = await validateQuizStart(quiz);
      
      if (!validation.isValid) {
        throw new Error(validation.error || 'Failed to start quiz');
      }

      // Add anonymous participant for competition tracking
      if (quiz.isCompetition) {
        const anonymousUserId = `anon-${Date.now()}`;
        CompetitionService.addLiveParticipant({
          userId: anonymousUserId,
          name: `Participant ${Math.floor(Math.random() * 1000)}`,
          email: 'anonymous@quiz.local',
          joinedAt: new Date(),
          currentScore: 0,
          questionsAnswered: 0,
          isActive: true
        });
      }

      // Success - start the quiz
      setStartState({
        isStarting: false,
        startError: null,
        isStarted: true,
      });

      toast({
        title: "Quiz Started!",
        description: `Starting "${quiz.title}" with ${validation.questionCount} questions. Good luck!`,
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to start quiz';
      
      setStartState({
        isStarting: false,
        startError: errorMessage,
        isStarted: false,
      });

      toast({
        variant: "destructive",
        title: "Cannot Start Quiz",
        description: errorMessage,
      });
    }
  };

  const handleQuizComplete = () => {
    setStartState({
      isStarting: false,
      startError: null,
      isStarted: false,
    });
  };

  // Loading state
  if (isLoadingQuiz) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
        <h3 className="text-lg font-semibold mb-2">Loading Quiz...</h3>
        <p className="text-muted-foreground">Please wait while we prepare your quiz</p>
      </div>
    );
  }

  // Quiz not found
  if (!quiz) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
            <AlertCircle className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="text-xl font-semibold">Quiz Not Found</h3>
          <p className="text-muted-foreground">
            The quiz you&#39;re looking for doesn&#39;t exist or has been removed.
          </p>
          <Button asChild>
            <Link href="/quizzes">Browse Quizzes</Link>
          </Button>
        </div>
      </div>
    );
  }

  // Quiz session (when started)
  if (startState.isStarted) {
    return <QuizSession quizId={quizId} onComplete={handleQuizComplete} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <Link href="/quizzes" className="text-sm text-muted-foreground hover:text-foreground">
            Quizzes
          </Link>
          <span className="text-sm text-muted-foreground">/</span>
          <span className="text-sm font-medium">{quiz.title}</span>
        </div>
        
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-bold tracking-tight">{quiz.title}</h1>
            {quiz.isCompetition && (
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
                <Shield className="h-3 w-3 mr-1" />
                Competition
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground mt-1">{quiz.description}</p>
        </div>
      </div>
      
      <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md">
        <CardHeader>
          <CardTitle>Quiz Details</CardTitle>
          <CardDescription>
            This quiz contains {questionCount} questions. Make sure you&#39;re ready before starting!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {startState.startError && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-red-400">Cannot Start Quiz</h4>
                <p className="text-sm text-red-300 mt-1">{startState.startError}</p>
              </div>
            </div>
          )}

          {/* Competition Notice */}
          {quiz.isCompetition && (
            <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg flex items-start gap-3">
              <Shield className="h-5 w-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-purple-400">Competition Quiz</h4>
                <p className="text-sm text-purple-300 mt-1">
                  This is a competition quiz. Your progress will be tracked and displayed on the live leaderboard.
                </p>
              </div>
            </div>
          )}

          {/* Question Count Validation Warning */}
          {questionCount !== quiz.questionCount && (
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-orange-400">Question Count Notice</h4>
                <p className="text-sm text-orange-300 mt-1">
                  This quiz was designed for {quiz.questionCount} questions, but currently has {questionCount} questions available.
                </p>
              </div>
            </div>
          )}

          {/* Quiz Confirmation */}
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3">
            <CheckCircle className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-blue-400">Ready to Start?</h4>
              <p className="text-sm text-blue-300 mt-1">
                This quiz contains <strong>{questionCount} questions</strong> and will take approximately{' '}
                <strong>{Math.ceil(quiz.timePerQuestion * questionCount / 60)} minutes</strong> to complete.
                Are you ready to begin?
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <DetailItem 
              icon={<LayoutList className="h-5 w-5 text-blue-400" />}
              label="Questions"
              value={`${questionCount} questions`}
              subtitle={questionCount !== quiz.questionCount ? `(Expected: ${quiz.questionCount})` : undefined}
            />
            <DetailItem 
              icon={<Clock className="h-5 w-5 text-purple-400" />}
              label="Estimated Time"
              value={`${Math.ceil(quiz.timePerQuestion * questionCount / 60)} minutes`}
              subtitle={`${quiz.timePerQuestion}s per question`}
            />
            <DetailItem 
              icon={<Info className="h-5 w-5 text-emerald-400" />}
              label="Difficulty"
              value={quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
              badge={getDifficultyBadge(quiz)}
            />
            <DetailItem 
              icon={<Trophy className="h-5 w-5 text-amber-400" />}
              label="Highest Score"
              value="95%"
              subtitle="Achieved by 2 users"
            />
          </div>
          
          <div className="bg-black/30 p-4 rounded-lg border border-purple-900/20">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-blue-400" />
              <h3 className="font-medium">Currently Playing</h3>
            </div>
            <p className="text-muted-foreground text-sm">
              Join <strong>{quiz.currentParticipants} other participants</strong> currently taking this quiz! The leaderboard updates in real-time.
            </p>
            {quiz.currentParticipants >= quiz.maxParticipants && (
              <p className="text-red-400 text-sm mt-2 font-medium">
                ⚠️ Quiz is full ({quiz.maxParticipants} participants max)
              </p>
            )}
          </div>

          {/* Quiz Status Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-black/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Status</h4>
              <div className="flex items-center gap-2">
                {quiz.isLive ? (
                  <>
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 font-medium">Live Now</span>
                  </>
                ) : (
                  <>
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                    <span className="text-blue-400 font-medium">Available</span>
                  </>
                )}
              </div>
            </div>
            
            <div className="bg-black/20 p-4 rounded-lg">
              <h4 className="font-medium mb-2">Categories</h4>
              <div className="flex flex-wrap gap-1">
                {quiz.categories.slice(0, 3).map((category) => (
                  <Badge key={category} variant="outline" className="text-xs">
                    {category.replace(/_/g, ' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}
                  </Badge>
                ))}
                {quiz.categories.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{quiz.categories.length - 3} more
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-4">
          <Button 
            size="lg" 
            className="w-full sm:w-auto" 
            onClick={handleStartQuiz}
            disabled={startState.isStarting || quiz.currentParticipants >= quiz.maxParticipants || questionCount === 0}
          >
            {startState.isStarting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Starting Quiz...
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Start Quiz ({questionCount} Questions)
              </>
            )}
          </Button>
          <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
            <Link href="/leaderboard">View Leaderboard</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}

interface DetailItemProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtitle?: string;
  badge?: React.ReactNode;
}

function DetailItem({ icon, label, value, subtitle, badge }: DetailItemProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-black/20 rounded-lg border border-purple-900/10">
      <div className="bg-black/30 rounded-full p-2">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-sm text-muted-foreground">{label}</div>
        <div className="font-medium flex items-center gap-2">
          {value}
          {badge}
        </div>
        {subtitle && <div className="text-xs text-muted-foreground">{subtitle}</div>}
      </div>
    </div>
  );
}

function getDifficultyBadge(quiz: Quiz) {
  const colors: Record<string, string> = {
    easy: 'bg-green-500/10 text-green-400 border-green-500/20',
    medium: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    hard: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
    expert: 'bg-red-500/10 text-red-400 border-red-500/20',
  };
  
  return (
    <Badge variant="outline" className={colors[quiz.difficulty] || ''}>
      {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
    </Badge>
  );
}