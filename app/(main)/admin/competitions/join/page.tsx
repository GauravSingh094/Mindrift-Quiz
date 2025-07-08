"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Target, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  Clock, 
  CheckCircle, 
  Copy, 
  RefreshCw,
  Shield,
  Users,
  Trophy,
  Timer,
  AlertTriangle
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { useAuth } from "@/lib/auth-context";
import { FirestoreService, Competition } from "@/lib/firestore-service";

interface CompetitionValidationState {
  competition: Competition | null;
  error: string | null;
  isScheduled: boolean;
  timeUntilActive: string | null;
  isLoading: boolean;
}

interface AntiCheatState {
  tabSwitchCount: number;
  copyPasteAttempts: number;
  isBlocked: boolean;
  blockEndTime: Date | null;
  warnings: string[];
}

export default function JoinCompetitionPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const [competitionCode, setCompetitionCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [validationState, setValidationState] = useState<CompetitionValidationState>({
    competition: null,
    error: null,
    isScheduled: false,
    timeUntilActive: null,
    isLoading: false
  });
  
  const [antiCheatState, setAntiCheatState] = useState<AntiCheatState>({
    tabSwitchCount: 0,
    copyPasteAttempts: 0,
    isBlocked: false,
    blockEndTime: null,
    warnings: []
  });

  // Refs for cleanup
  const scheduledCheckInterval = useRef<NodeJS.Timeout | null>(null);
  const countdownInterval = useRef<NodeJS.Timeout | null>(null);
  const visibilityChangeHandler = useRef<(() => void) | null>(null);

  // Anti-cheat: Monitor tab switching
  useEffect(() => {
    if (!validationState.competition?.antiCheat?.tabSwitchLimit) return;

    const handleVisibilityChange = () => {
      if (document.hidden && validationState.competition && !antiCheatState.isBlocked) {
        setAntiCheatState(prev => {
          const newCount = prev.tabSwitchCount + 1;
          const limit = validationState.competition.antiCheat.tabSwitchLimit;
          const newWarnings = [...prev.warnings];
          
          if (newCount >= limit) {
            // Block user
            const blockDuration = validationState.competition.antiCheat.cooldownPeriod * 60 * 1000;
            const blockEndTime = new Date(Date.now() + blockDuration);
            
            newWarnings.push(`BLOCKED: Too many tab switches (${newCount}/${limit}). Blocked for ${validationState.competition.antiCheat.cooldownPeriod} minutes.`);
            
            toast({
              variant: "destructive",
              title: "Competition Access Blocked",
              description: `You've been blocked for ${validationState.competition.antiCheat.cooldownPeriod} minutes due to excessive tab switching.`,
            });
            
            return {
              ...prev,
              tabSwitchCount: newCount,
              isBlocked: true,
              blockEndTime,
              warnings: newWarnings
            };
          } else {
            // Warning
            const remaining = limit - newCount;
            newWarnings.push(`WARNING: Tab switch detected (${newCount}/${limit}). ${remaining} remaining before block.`);
            
            toast({
              variant: "destructive",
              title: "Tab Switch Warning",
              description: `${remaining} tab switches remaining before you're blocked.`,
            });
            
            return {
              ...prev,
              tabSwitchCount: newCount,
              warnings: newWarnings
            };
          }
        });
      }
    };

    visibilityChangeHandler.current = handleVisibilityChange;
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (visibilityChangeHandler.current) {
        document.removeEventListener('visibilitychange', visibilityChangeHandler.current);
      }
    };
  }, [validationState.competition, antiCheatState.isBlocked, toast]);

  // Anti-cheat: Monitor copy/paste
  useEffect(() => {
    if (!validationState.competition?.antiCheat?.copyPasteLock) return;

    const handleCopyPaste = (e: ClipboardEvent) => {
      e.preventDefault();
      
      setAntiCheatState(prev => {
        const newCount = prev.copyPasteAttempts + 1;
        const newWarnings = [...prev.warnings, `Copy/paste attempt blocked (${newCount})`];
        
        return {
          ...prev,
          copyPasteAttempts: newCount,
          warnings: newWarnings
        };
      });
      
      toast({
        variant: "destructive",
        title: "Copy/Paste Blocked",
        description: "Copy and paste operations are disabled during this competition.",
      });
    };

    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);

    return () => {
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
    };
  }, [validationState.competition, toast]);

  // Check if user is still blocked
  useEffect(() => {
    if (antiCheatState.isBlocked && antiCheatState.blockEndTime) {
      const checkBlockStatus = () => {
        if (new Date() >= antiCheatState.blockEndTime!) {
          setAntiCheatState(prev => ({
            ...prev,
            isBlocked: false,
            blockEndTime: null
          }));
          
          toast({
            title: "Block Lifted",
            description: "You can now attempt to join the competition again.",
          });
        }
      };

      const interval = setInterval(checkBlockStatus, 1000);
      return () => clearInterval(interval);
    }
  }, [antiCheatState.isBlocked, antiCheatState.blockEndTime, toast]);

  // Enhanced validation function with Firestore integration
  const validateCompetitionCode = async (code: string): Promise<CompetitionValidationState> => {
    const trimmedCode = code.trim().toUpperCase();
    
    if (!trimmedCode) {
      return {
        competition: null,
        error: "Please enter a competition code",
        isScheduled: false,
        timeUntilActive: null,
        isLoading: false
      };
    }

    if (trimmedCode.length < 4) {
      return {
        competition: null,
        error: "Competition code must be at least 4 characters long",
        isScheduled: false,
        timeUntilActive: null,
        isLoading: false
      };
    }

    try {
      // Check Firestore for competition
      const competition = await FirestoreService.getCompetitionByCode(trimmedCode);
      
      if (!competition) {
        return {
          competition: null,
          error: "Competition not found. Please check the code and try again.",
          isScheduled: false,
          timeUntilActive: null,
          isLoading: false
        };
      }

      const now = new Date();
      const startTime = new Date(competition.scheduledAt);

      // Check if competition is scheduled but time has passed - auto-activate
      if (competition.status === 'scheduled' && now >= startTime) {
        console.log('⏰ Scheduled competition time has passed, attempting to activate...');
        
        try {
          await FirestoreService.updateCompetitionStatus(competition.id!, 'active');
          competition.status = 'active';
          
          toast({
            title: "Competition Activated!",
            description: `"${competition.title}" is now active and ready to join.`,
          });
          
          return {
            competition,
            error: null,
            isScheduled: false,
            timeUntilActive: null,
            isLoading: false
          };
        } catch (error) {
          return {
            competition,
            error: "Competition should be active but failed to activate. Please try again.",
            isScheduled: true,
            timeUntilActive: "Activation failed",
            isLoading: false
          };
        }
      }

      // Check competition status
      if (competition.status === 'scheduled') {
        const timeUntil = formatDistanceToNow(startTime, { addSuffix: false });
        return {
          competition,
          error: `This competition is not active yet. Scheduled to start ${formatDistanceToNow(startTime, { addSuffix: true })}.`,
          isScheduled: true,
          timeUntilActive: timeUntil,
          isLoading: false
        };
      }

      if (competition.status === 'completed') {
        return {
          competition,
          error: "This competition has already ended and is no longer accepting participants.",
          isScheduled: false,
          timeUntilActive: null,
          isLoading: false
        };
      }

      if (competition.status === 'cancelled') {
        return {
          competition,
          error: "This competition has been cancelled.",
          isScheduled: false,
          timeUntilActive: null,
          isLoading: false
        };
      }

      // Check if competition is full
      if (competition.currentParticipants >= competition.maxParticipants) {
        return {
          competition,
          error: `This competition is full. Maximum participants (${competition.maxParticipants}) reached.`,
          isScheduled: false,
          timeUntilActive: null,
          isLoading: false
        };
      }

      // Competition is valid and joinable
      return {
        competition,
        error: null,
        isScheduled: false,
        timeUntilActive: null,
        isLoading: false
      };
      
    } catch (error) {
      console.error('Error validating competition:', error);
      return {
        competition: null,
        error: "Failed to validate competition. Please try again.",
        isScheduled: false,
        timeUntilActive: null,
        isLoading: false
      };
    }
  };

  // Handle competition code input changes
  const handleCodeChange = async (value: string) => {
    const formattedValue = value.toUpperCase().replace(/[^A-Z0-9]/g, '');
    setCompetitionCode(formattedValue);
    
    if (formattedValue.trim()) {
      setValidationState(prev => ({ ...prev, isLoading: true }));
      const validation = await validateCompetitionCode(formattedValue);
      setValidationState(validation);
    } else {
      setValidationState({
        competition: null,
        error: null,
        isScheduled: false,
        timeUntilActive: null,
        isLoading: false
      });
    }
  };

  // Handle manual refresh for scheduled competitions
  const handleRefreshCompetition = async () => {
    if (!competitionCode.trim()) return;
    
    setValidationState(prev => ({ ...prev, isLoading: true }));
    try {
      const validation = await validateCompetitionCode(competitionCode);
      setValidationState(validation);
      
      if (!validation.error && validation.competition) {
        toast({
          title: "Competition Status Updated",
          description: "Competition information has been refreshed.",
        });
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to refresh competition status. Please try again.",
      });
    }
  };

  const handleJoinCompetition = async () => {
    if (!competitionCode.trim() || !validationState.competition || !user) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please enter a valid competition code and ensure you're logged in.",
      });
      return;
    }

    if (validationState.error || antiCheatState.isBlocked) {
      toast({
        variant: "destructive",
        title: "Cannot Join Competition",
        description: validationState.error || "You are currently blocked from joining.",
      });
      return;
    }

    setIsJoining(true);
    try {
      // Add participant to Firestore
      await FirestoreService.addParticipant({
        competitionId: validationState.competition.id!,
        userId: user.id,
        name: user.name,
        email: user.email,
        currentScore: 0,
        questionsAnswered: 0,
        isActive: true,
        violations: {
          tabSwitches: 0,
          copyPasteAttempts: 0
        }
      });
      
      toast({
        title: "Success!",
        description: `Joining "${validationState.competition.title}"...`,
      });
      
      // Redirect to competition quiz
      router.push(`/quizzes/${validationState.competition.id}/start`);
    } catch (error) {
      console.error('Error joining competition:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to join competition. Please try again.",
      });
    } finally {
      setIsJoining(false);
    }
  };

  const copyCompetitionCode = () => {
    if (validationState.competition?.competitionCode) {
      navigator.clipboard.writeText(validationState.competition.competitionCode);
      toast({
        title: "Copied",
        description: "Competition code copied to clipboard",
      });
    }
  };

  const getTimeRemaining = () => {
    if (antiCheatState.blockEndTime) {
      const remaining = Math.ceil((antiCheatState.blockEndTime.getTime() - Date.now()) / 1000 / 60);
      return Math.max(0, remaining);
    }
    return 0;
  };

  return (
    <div className="container mx-auto py-8 max-w-2xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-white flex items-center gap-2">
          <Target className="h-8 w-8 text-purple-400" />
          Join Competition
        </h1>
        <p className="text-muted-foreground mt-2">
          Enter a competition code to join a secure competitive quiz event
        </p>
      </div>

      <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
            <Shield className="h-6 w-6 text-green-400" />
            Secure Competition Entry
          </CardTitle>
          <CardDescription>
            Competition quizzes have enhanced security measures and anti-cheat protection
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {/* Anti-Cheat Status */}
          {antiCheatState.isBlocked && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-red-400 mb-1">Access Blocked</h4>
                  <p className="text-sm text-red-300 mb-2">
                    You've been temporarily blocked from joining competitions due to policy violations.
                  </p>
                  <div className="text-sm text-red-300">
                    <strong>Time remaining:</strong> {getTimeRemaining()} minutes
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Competition Code Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground dark:text-white">
              Competition Code
            </label>
            <div className="flex gap-2">
              <Input
                placeholder="Enter competition code (e.g., MIND123)"
                value={competitionCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !validationState.isScheduled && !antiCheatState.isBlocked && handleJoinCompetition()}
                className={`flex-1 ${
                  validationState.error ? "border-red-500" : 
                  validationState.competition && !validationState.error ? "border-green-500" : ""
                } text-foreground dark:text-white`}
                maxLength={10}
                disabled={antiCheatState.isBlocked}
              />
              {validationState.isScheduled && (
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefreshCompetition}
                  disabled={validationState.isLoading}
                  className="text-foreground dark:text-white border-border hover:bg-accent"
                >
                  <RefreshCw className={`h-4 w-4 ${validationState.isLoading ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Competition codes are provided by the event organizer
            </p>
          </div>

          {/* Loading State */}
          {validationState.isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-sm">Validating competition...</span>
            </div>
          )}

          {/* Error Display */}
          {validationState.error && !validationState.isScheduled && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
              <div className="text-sm text-red-300">{validationState.error}</div>
            </div>
          )}

          {/* Valid Competition Display */}
          {validationState.competition && !validationState.error && !validationState.isScheduled && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg space-y-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-green-400 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    {validationState.competition.title}
                  </h4>
                  <p className="text-sm text-green-300 mt-1">{validationState.competition.description}</p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={copyCompetitionCode}
                  className="text-green-400 hover:text-green-300"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              
              <div className="grid grid-cols-2 gap-4 text-xs text-green-300">
                <div>
                  <span className="text-green-400">Questions:</span> {validationState.competition.totalQuestions}
                </div>
                <div>
                  <span className="text-green-400">Duration:</span> {validationState.competition.duration} min
                </div>
                <div>
                  <span className="text-green-400">Difficulty:</span> {validationState.competition.difficulty.charAt(0).toUpperCase() + validationState.competition.difficulty.slice(1)}
                </div>
                <div>
                  <span className="text-green-400">Participants:</span> {validationState.competition.currentParticipants}/{validationState.competition.maxParticipants}
                </div>
              </div>
              
              {/* Anti-Cheat Measures Display */}
              <div className="bg-green-500/5 border border-green-500/10 rounded p-3">
                <h5 className="text-xs font-medium text-green-400 mb-2">Security Measures Active</h5>
                <div className="flex flex-wrap gap-2">
                  {validationState.competition.antiCheat.copyPasteLock && (
                    <Badge variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/20">
                      Copy/Paste Disabled
                    </Badge>
                  )}
                  {validationState.competition.antiCheat.tabSwitchLimit > 0 && (
                    <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                      Tab Limit: {validationState.competition.antiCheat.tabSwitchLimit}
                    </Badge>
                  )}
                  {validationState.competition.antiCheat.cooldownPeriod > 0 && (
                    <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">
                      Violation Penalty: {validationState.competition.antiCheat.cooldownPeriod}m
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Scheduled Competition Display */}
          {validationState.competition && validationState.isScheduled && (
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <h4 className="font-medium text-blue-400">Competition Scheduled</h4>
                </div>
              </div>
              
              <div className="space-y-2">
                <p className="text-sm text-blue-300">
                  This competition will become available at:
                </p>
                <p className="text-sm font-medium text-blue-200">
                  {format(new Date(validationState.competition.scheduledAt), 'PPP p')}
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
              
              <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-2">
                <p className="text-xs text-yellow-300">
                  ⏰ <strong>Auto-join enabled:</strong> You'll be automatically redirected when the competition becomes active.
                </p>
              </div>
            </div>
          )}

          {/* Anti-Cheat Warnings */}
          {antiCheatState.warnings.length > 0 && (
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-lg">
              <h4 className="font-medium text-orange-400 mb-2 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Security Violations
              </h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {antiCheatState.warnings.slice(-5).map((warning, index) => (
                  <div key={index} className="text-xs text-orange-300 font-mono">
                    {warning}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="p-3 bg-blue-500/5 border border-blue-500/10 rounded-lg">
            <h4 className="text-sm font-medium text-blue-400 mb-1">Competition Guidelines</h4>
            <ul className="text-xs text-blue-300 space-y-1">
              <li>• Competition codes are case-insensitive and usually 4-8 characters</li>
              <li>• Anti-cheat measures will be enforced during the competition</li>
              <li>• Avoid tab switching and copy/paste operations</li>
              <li>• Violations may result in temporary blocks or disqualification</li>
            </ul>
          </div>
        </CardContent>
        
        <CardFooter className="flex flex-col sm:flex-row gap-4">
          <Button
            className="w-full sm:w-auto bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
            onClick={handleJoinCompetition}
            disabled={
              isJoining || 
              !!validationState.error || 
              !validationState.competition || 
              validationState.isScheduled ||
              antiCheatState.isBlocked ||
              validationState.isLoading
            }
          >
            {isJoining ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Joining Competition...
              </>
            ) : validationState.isScheduled ? (
              <>
                <Clock className="mr-2 h-4 w-4" />
                Waiting for Competition...
              </>
            ) : antiCheatState.isBlocked ? (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                Access Blocked
              </>
            ) : (
              <>
                <ArrowRight className="mr-2 h-4 w-4" />
                Join Competition
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
  );
}