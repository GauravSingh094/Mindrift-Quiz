"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Users, ArrowRight, Loader2, AlertCircle, Clock, CheckCircle, Copy, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { mockQuizzes } from "@/lib/mock-data";
import { findQuizByCode, getAllCreatedQuizzes, updateCreatedQuiz } from "@/lib/created-quizzes-data";
import { Quiz } from "@/lib/types";
import { format, formatDistanceToNow } from "date-fns";
import { isValidQuizCodeFormat, formatQuizCode } from "@/lib/utils";

interface QuizValidationState {
  quiz: Quiz | null;
  error: string | null;
  isScheduled: boolean;
  timeUntilActive: string | null;
}

export default function JoinQuizPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [quizCode, setQuizCode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [validationState, setValidationState] = useState<QuizValidationState>({
    quiz: null,
    error: null,
    isScheduled: false,
    timeUntilActive: null
  });
  
  // Refs for cleanup
  const scheduledCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);

  // Function to find quiz by code across all sources
  const findQuiz = (code: string): Quiz | null => {
    const normalizedCode = code.toUpperCase().trim();
    
    // First, try to find in created quizzes using the dedicated function
    const createdQuiz = findQuizByCode(normalizedCode);
    if (createdQuiz) {
      return createdQuiz;
    }
    
    // Then search in mock quizzes by quiz code
    const mockQuiz = mockQuizzes.find(q => 
      q.quizCode?.toUpperCase() === normalizedCode
    );
    if (mockQuiz) {
      return mockQuiz;
    }
    
    // Fallback: search by ID (for backward compatibility)
    const allQuizzes = [...mockQuizzes, ...getAllCreatedQuizzes()];
    return allQuizzes.find(q => q.id.toUpperCase() === normalizedCode) || null;
  };

  // Function to update quiz status to active
  const activateScheduledQuiz = async (quiz: Quiz): Promise<Quiz | null> => {
    try {
      console.log('🚀 Activating scheduled quiz:', quiz.title);
      
      // Update the quiz status to active
      const updatedQuiz = updateCreatedQuiz(quiz.id, {
        status: 'active',
        isLive: true,
        updatedAt: new Date()
      });

      if (updatedQuiz) {
        console.log('✅ Quiz activated successfully:', updatedQuiz.title);
        toast({
          title: "Quiz Activated!",
          description: `"${quiz.title}" is now active and ready to join.`,
        });
        return updatedQuiz;
      }
      
      return null;
    } catch (error) {
      console.error('❌ Failed to activate quiz:', error);
      return null;
    }
  };

  // Enhanced validation function
  const validateQuizCode = async (code: string): Promise<QuizValidationState> => {
    const trimmedCode = code.trim();
    
    if (!trimmedCode) {
      return {
        quiz: null,
        error: "Please enter a quiz code",
        isScheduled: false,
        timeUntilActive: null
      };
    }

    // Format validation (optional - can be relaxed)
    if (trimmedCode.length < 3) {
      return {
        quiz: null,
        error: "Quiz code must be at least 3 characters long",
        isScheduled: false,
        timeUntilActive: null
      };
    }

    // Find the quiz
    const quiz = findQuiz(trimmedCode);
    
    if (!quiz) {
      return {
        quiz: null,
        error: "Quiz not found. Please check the quiz code and try again.",
        isScheduled: false,
        timeUntilActive: null
      };
    }

    const now = new Date();
    const startTime = new Date(quiz.startTime);

    // Check if quiz is scheduled but time has passed - auto-activate
    if (quiz.status === 'scheduled' && now >= startTime) {
      console.log('⏰ Scheduled quiz time has passed, attempting to activate...');
      
      const activatedQuiz = await activateScheduledQuiz(quiz);
      if (activatedQuiz) {
        // Quiz was successfully activated, treat as active
        return {
          quiz: activatedQuiz,
          error: null,
          isScheduled: false,
          timeUntilActive: null
        };
      } else {
        // Failed to activate, show as scheduled with error
        return {
          quiz: quiz,
          error: "Quiz should be active but failed to activate. Please try again.",
          isScheduled: true,
          timeUntilActive: "Activation failed"
        };
      }
    }

    // Check quiz status and availability
    if (quiz.status === 'scheduled') {
      const timeUntil = formatDistanceToNow(startTime, { addSuffix: false });
      return {
        quiz: quiz,
        error: `This quiz is not active yet. Scheduled to start ${formatDistanceToNow(startTime, { addSuffix: true })}.`,
        isScheduled: true,
        timeUntilActive: timeUntil
      };
    }

    if (quiz.status === 'completed') {
      return {
        quiz: quiz,
        error: "This quiz has already ended and is no longer accepting participants.",
        isScheduled: false,
        timeUntilActive: null
      };
    }

    if (quiz.status === 'cancelled') {
      return {
        quiz: quiz,
        error: "This quiz has been cancelled.",
        isScheduled: false,
        timeUntilActive: null
      };
    }

    // Check if quiz is full
    if (quiz.currentParticipants >= quiz.maxParticipants) {
      return {
        quiz: quiz,
        error: `This quiz is full. Maximum participants (${quiz.maxParticipants}) reached.`,
        isScheduled: false,
        timeUntilActive: null
      };
    }

    // Quiz is valid and joinable
    return {
      quiz: quiz,
      error: null,
      isScheduled: false,
      timeUntilActive: null
    };
  };

  // Set up scheduled quiz monitoring
  useEffect(() => {
    if (validationState.isScheduled && validationState.quiz) {
      const quiz = validationState.quiz;
      const startTime = new Date(quiz.startTime);
      
      console.log('⏰ Setting up scheduled quiz monitoring for:', quiz.title);
      console.log('📅 Start time:', format(startTime, 'PPP p'));
      
      // Check every 10 seconds if the quiz should be active
      scheduledCheckInterval.current = setInterval(async () => {
        const now = new Date();
        
        console.log('🔍 Checking if quiz should be active...', {
          now: format(now, 'PPP p'),
          startTime: format(startTime, 'PPP p'),
          shouldBeActive: now >= startTime
        });
        
        if (now >= startTime) {
          console.log('🚀 Quiz should be active now, attempting activation...');
          
          // Clear the interval first
          if (scheduledCheckInterval.current) {
            clearInterval(scheduledCheckInterval.current);
            scheduledCheckInterval.current = null;
          }
          
          // Try to activate the quiz
          const activatedQuiz = await activateScheduledQuiz(quiz);
          
          if (activatedQuiz) {
            // Quiz activated successfully - redirect to quiz
            toast({
              title: "Redirecting...",
              description: `"${quiz.title}" is now active. Taking you to the quiz!`,
            });
            
            // Small delay to show the toast, then redirect
            setTimeout(() => {
              router.push(`/quizzes/${quiz.id}`);
            }, 1500);
          } else {
            // Failed to activate - refresh validation
            const newValidation = await validateQuizCode(quizCode);
            setValidationState(newValidation);
          }
        }
      }, 10000); // Check every 10 seconds

      // Also set up a countdown timer for UI updates
      countdownInterval.current = setInterval(() => {
        const now = new Date();
        if (now < startTime) {
          const timeUntil = formatDistanceToNow(startTime, { addSuffix: false });
          setValidationState(prev => ({
            ...prev,
            timeUntilActive: timeUntil
          }));
        }
      }, 1000); // Update countdown every second
    }

    // Cleanup function
    return () => {
      if (scheduledCheckInterval.current) {
        clearInterval(scheduledCheckInterval.current);
        scheduledCheckInterval.current = null;
      }
      if (countdownInterval.current) {
        clearInterval(countdownInterval.current);
        countdownInterval.current = null;
      }
    };
  }, [validationState.isScheduled, validationState.quiz, quizCode, router, toast]);

  // Handle quiz code input changes
  const handleQuizCodeChange = async (value: string) => {
    // Auto-format the code as user types
    const formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setQuizCode(formattedValue);
    
    if (formattedValue.trim()) {
      const validation = await validateQuizCode(formattedValue);
      setValidationState(validation);
    } else {
      setValidationState({
        quiz: null,
        error: null,
        isScheduled: false,
        timeUntilActive: null
      });
    }
  };

  // Handle manual refresh for scheduled quizzes
  const handleRefreshQuiz = async () => {
    if (!quizCode.trim()) return;
    
    setIsLoading(true);
    try {
      const validation = await validateQuizCode(quizCode);
      setValidationState(validation);
      
      if (!validation.error && validation.quiz) {
        toast({
          title: "Quiz Status Updated",
          description: "Quiz information has been refreshed.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh quiz status. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!quizCode.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a quiz code",
      });
      return;
    }

    if (validationState.error) {
      toast({
        variant: "destructive",
        title: "Cannot Join Quiz",
        description: validationState.error,
      });
      return;
    }

    if (!validationState.quiz) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Quiz not found",
      });
      return;
    }

    setIsLoading(true);
    try {
      // Simulate API call to join quiz
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast({
        title: "Success",
        description: `Joining "${validationState.quiz.title}"...`,
      });
      
      router.push(`/quizzes/${validationState.quiz.id}`);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to join quiz. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const copyQuizCode = () => {
    if (validationState.quiz?.quizCode) {
      navigator.clipboard.writeText(validationState.quiz.quizCode);
      toast({
        title: "Copied",
        description: "Quiz code copied to clipboard",
      });
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="max-w-md mx-auto">
        <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
              <Users className="h-6 w-6 text-purple-400" />
              Join Quiz
            </CardTitle>
            <CardDescription>
              Enter a quiz code to join an existing session
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Input
                placeholder="Enter Quiz Code (e.g., REACT1, PYTH01)"
                value={quizCode}
                onChange={(e) => handleQuizCodeChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !validationState.isScheduled && handleJoin()}
                className={`${
                  validationState.error ? "border-red-500" : 
                  validationState.quiz && !validationState.error ? "border-green-500" : ""
                } text-foreground dark:text-white`}
                maxLength={10}
              />
              <p className="text-sm text-muted-foreground">
                The quiz code should be provided by the quiz creator
              </p>
            </div>

            {/* Error Display */}
            {validationState.error && !validationState.isScheduled && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-red-300">{validationState.error}</div>
              </div>
            )}

            {/* Quiz Info Display - Valid and Joinable */}
            {validationState.quiz && !validationState.error && !validationState.isScheduled && (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-green-400 flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      {validationState.quiz.title}
                    </h4>
                    <p className="text-sm text-green-300 mt-1">{validationState.quiz.description}</p>
                  </div>
                  {validationState.quiz.quizCode && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyQuizCode}
                      className="text-green-400 hover:text-green-300"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-xs text-green-300">
                  <div>
                    <span className="text-green-400">Questions:</span> {validationState.quiz.questionCount}
                  </div>
                  <div>
                    <span className="text-green-400">Duration:</span> {Math.floor(validationState.quiz.timePerQuestion * validationState.quiz.questionCount / 60)} min
                  </div>
                  <div>
                    <span className="text-green-400">Difficulty:</span> {validationState.quiz.difficulty.charAt(0).toUpperCase() + validationState.quiz.difficulty.slice(1)}
                  </div>
                  <div>
                    <span className="text-green-400">Participants:</span> {validationState.quiz.currentParticipants}/{validationState.quiz.maxParticipants}
                  </div>
                </div>
                
                {validationState.quiz.isLive && (
                  <div className="flex items-center gap-1 text-xs">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-green-400 font-medium">Live Now</span>
                  </div>
                )}
                
                {validationState.quiz.quizCode && (
                  <div className="bg-green-500/5 border border-green-500/10 rounded p-2">
                    <div className="text-xs text-green-400 mb-1">Quiz Code</div>
                    <div className="font-mono text-sm text-green-300">{validationState.quiz.quizCode}</div>
                  </div>
                )}
              </div>
            )}

            {/* Scheduled Quiz Info with Real-time Updates */}
            {validationState.quiz && validationState.isScheduled && (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-400" />
                    <h4 className="font-medium text-blue-400">Quiz Scheduled</h4>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleRefreshQuiz}
                    disabled={isLoading}
                    className="text-blue-400 hover:text-blue-300"
                  >
                    <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
                
                <div className="space-y-2">
                  <p className="text-sm text-blue-300">
                    This quiz will become available at:
                  </p>
                  <p className="text-sm font-medium text-blue-200">
                    {format(new Date(validationState.quiz.startTime), 'PPP p')}
                  </p>
                  
                  {validationState.timeUntilActive && (
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded p-2">
                      <div className="text-xs text-blue-400 mb-1">Time Remaining</div>
                      <div className="font-mono text-sm text-blue-300">
                        {validationState.timeUntilActive}
                      </div>
                    </div>
                  )}
                </div>
                
                {validationState.quiz.quizCode && (
                  <div className="bg-blue-500/5 border border-blue-500/10 rounded p-2">
                    <div className="text-xs text-blue-400 mb-1">Quiz Code</div>
                    <div className="font-mono text-sm text-blue-300">{validationState.quiz.quizCode}</div>
                  </div>
                )}
                
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2">
                  <p className="text-xs text-yellow-300">
                    ⏰ <strong>Auto-join enabled:</strong> You'll be automatically redirected when the quiz becomes active.
                  </p>
                </div>
              </div>
            )}

            {/* Help Text */}
            <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
              <h4 className="text-sm font-medium text-blue-400 mb-1">Need help?</h4>
              <ul className="text-xs text-blue-300 space-y-1">
                <li>• Quiz codes are usually 4-6 characters (e.g., REACT1, PYTH01)</li>
                <li>• Codes are case-insensitive</li>
                <li>• Scheduled quizzes will auto-activate at their start time</li>
                <li>• Contact the quiz creator if you're having trouble</li>
              </ul>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-4">
            <Button
              className="w-full sm:w-auto"
              onClick={handleJoin}
              disabled={isLoading || !!validationState.error || !validationState.quiz || validationState.isScheduled}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Joining...
                </>
              ) : validationState.isScheduled ? (
                <>
                  <Clock className="mr-2 h-4 w-4" />
                  Waiting for Quiz...
                </>
              ) : (
                <>
                  <ArrowRight className="mr-2 h-4 w-4" />
                  Join Quiz
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="w-full sm:w-auto text-foreground dark:text-white border-border hover:bg-accent"
            >
              Cancel
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}