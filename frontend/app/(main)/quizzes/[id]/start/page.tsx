"use client";

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Shield, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  Users,
  Play,
  Loader2,
  Target,
  Eye,
  EyeOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { CompetitionFirestoreService } from '@/lib/firestore-service';

interface AntiCheatState {
  tabSwitchCount: number;
  copyPasteAttempts: number;
  isBlocked: boolean;
  blockEndTime: Date | null;
  warnings: string[];
  isMonitoring: boolean;
}

export default function CompetitionStartPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const competitionId = params.id as string;
  
  const [competition, setCompetition] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  
  const [antiCheatState, setAntiCheatState] = useState<AntiCheatState>({
    tabSwitchCount: 0,
    copyPasteAttempts: 0,
    isBlocked: false,
    blockEndTime: null,
    warnings: [],
    isMonitoring: false
  });

  // Refs for cleanup
  const visibilityChangeHandler = useRef<(() => void) | null>(null);

  // Load competition data
  useEffect(() => {
    const loadCompetition = async () => {
      if (!competitionId) return;
      
      try {
        const comp = await CompetitionFirestoreService.getCompetition(competitionId);
        if (!comp) {
          throw new Error('Competition not found');
        }
        setCompetition(comp);
      } catch (error) {
        console.error('Error loading competition:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load competition. Please try again.",
        });
        router.push('/admin/competitions/join');
      } finally {
        setIsLoading(false);
      }
    };

    loadCompetition();
  }, [competitionId, router, toast]);

  // Anti-cheat: Monitor tab switching
  useEffect(() => {
    if (!antiCheatState.isMonitoring || !competition?.antiCheat?.tabSwitchLimit) return;

    const handleVisibilityChange = () => {
      if (document.hidden && !antiCheatState.isBlocked) {
        setAntiCheatState(prev => {
          const newCount = prev.tabSwitchCount + 1;
          const limit = competition.antiCheat.tabSwitchLimit;
          const newWarnings = [...prev.warnings];
          
          if (newCount >= limit) {
            // Block user
            const blockDuration = competition.antiCheat.cooldownPeriod * 60 * 1000;
            const blockEndTime = new Date(Date.now() + blockDuration);
            
            newWarnings.push(`BLOCKED: Too many tab switches (${newCount}/${limit}). Blocked for ${competition.antiCheat.cooldownPeriod} minutes.`);
            
            toast({
              variant: "destructive",
              title: "Competition Access Blocked",
              description: `You've been blocked for ${competition.antiCheat.cooldownPeriod} minutes due to excessive tab switching.`,
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
  }, [antiCheatState.isMonitoring, competition, antiCheatState.isBlocked, toast]);

  // Anti-cheat: Monitor copy/paste
  useEffect(() => {
    if (!antiCheatState.isMonitoring || !competition?.antiCheat?.copyPasteLock) return;

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
  }, [antiCheatState.isMonitoring, competition, toast]);

  const handleAcceptTerms = () => {
    setHasAccepted(true);
    setAntiCheatState(prev => ({ ...prev, isMonitoring: true }));
    
    toast({
      title: "Anti-Cheat Monitoring Active",
      description: "Security measures are now in effect. Good luck!",
    });
  };

  const handleStartCompetition = async () => {
    if (!user || !competition) return;
    
    setIsStarting(true);
    try {
      // Record participation start
      await CompetitionFirestoreService.addParticipant({
        competitionId: competition.id,
        userId: user.id,
        name: user.name,
        email: user.email,
        currentScore: 0,
        questionsAnswered: 0,
        isActive: true
      });
      
      // Redirect to actual quiz
      router.push(`/quizzes/${competition.id}`);
    } catch (error) {
      console.error('Error starting competition:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start competition. Please try again.",
      });
    } finally {
      setIsStarting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <div className="flex items-center justify-center py-16">
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin text-purple-400 mx-auto" />
            <p className="text-muted-foreground">Loading competition...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!competition) {
    return (
      <div className="container mx-auto py-8 max-w-4xl">
        <Card className="border-red-900/20 bg-red-500/5 backdrop-blur-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-red-400">Competition Not Found</h3>
            <p className="text-red-300 text-center mb-4">
              The competition you're trying to access doesn't exist or has been removed.
            </p>
            <Button onClick={() => router.push('/admin/competitions/join')} variant="outline">
              Return to Join Competition
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <div className="space-y-8">
        {/* Competition Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Target className="h-8 w-8 text-purple-400" />
            <h1 className="text-3xl font-bold text-foreground dark:text-white">
              {competition.title}
            </h1>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
              Competition
            </Badge>
          </div>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {competition.description}
          </p>
        </div>

        {/* Competition Details */}
        <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
              <Shield className="h-5 w-5 text-green-400" />
              Competition Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Questions:</span>
                <div className="font-medium text-foreground dark:text-white">{competition.totalQuestions}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Duration:</span>
                <div className="font-medium text-foreground dark:text-white">{competition.duration} minutes</div>
              </div>
              <div>
                <span className="text-muted-foreground">Difficulty:</span>
                <div className="font-medium text-foreground dark:text-white capitalize">{competition.difficulty}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Participants:</span>
                <div className="font-medium text-foreground dark:text-white">
                  {competition.currentParticipants}/{competition.maxParticipants}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Anti-Cheat Rules */}
        <Card className="border-orange-900/20 bg-orange-500/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-400">
              <AlertTriangle className="h-5 w-5" />
              Security & Anti-Cheat Measures
            </CardTitle>
            <CardDescription>
              This competition has enhanced security measures to ensure fair play
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              {competition.antiCheat.copyPasteLock && (
                <div className="flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <EyeOff className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-red-400">Copy/Paste Disabled</h4>
                    <p className="text-sm text-red-300">
                      Copy and paste operations are completely disabled during this competition.
                    </p>
                  </div>
                </div>
              )}
              
              {competition.antiCheat.tabSwitchLimit > 0 && (
                <div className="flex items-start gap-3 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <Eye className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-yellow-400">Tab Switch Monitoring</h4>
                    <p className="text-sm text-yellow-300">
                      You are allowed maximum <strong>{competition.antiCheat.tabSwitchLimit}</strong> tab switches. 
                      Exceeding this limit will result in a temporary block.
                    </p>
                  </div>
                </div>
              )}
              
              {competition.antiCheat.cooldownPeriod > 0 && (
                <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <Clock className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <h4 className="font-medium text-blue-400">Violation Penalties</h4>
                    <p className="text-sm text-blue-300">
                      Security violations will result in a <strong>{competition.antiCheat.cooldownPeriod}-minute</strong> block 
                      from accessing the competition.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Terms Acceptance */}
            {!hasAccepted && (
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <h4 className="font-medium text-purple-400 mb-2">Competition Agreement</h4>
                <div className="text-sm text-purple-300 space-y-2">
                  <p>By participating in this competition, you agree to:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Follow all anti-cheat measures and security protocols</li>
                    <li>Not use external resources, tools, or assistance</li>
                    <li>Accept monitoring of your browser activity during the competition</li>
                    <li>Understand that violations may result in disqualification</li>
                  </ul>
                </div>
                <Button 
                  onClick={handleAcceptTerms}
                  className="mt-4 bg-purple-600 hover:bg-purple-700"
                >
                  <CheckCircle className="mr-2 h-4 w-4" />
                  I Accept the Terms
                </Button>
              </div>
            )}

            {/* Anti-Cheat Status */}
            {hasAccepted && (
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="h-5 w-5 text-green-400" />
                  <h4 className="font-medium text-green-400">Security Monitoring Active</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-green-400">Tab Switches:</span>
                    <div className="font-medium text-green-300">
                      {antiCheatState.tabSwitchCount}/{competition.antiCheat.tabSwitchLimit || '∞'}
                    </div>
                  </div>
                  <div>
                    <span className="text-green-400">Copy/Paste Attempts:</span>
                    <div className="font-medium text-green-300">{antiCheatState.copyPasteAttempts}</div>
                  </div>
                  <div>
                    <span className="text-green-400">Status:</span>
                    <div className={`font-medium ${antiCheatState.isBlocked ? 'text-red-400' : 'text-green-300'}`}>
                      {antiCheatState.isBlocked ? 'Blocked' : 'Active'}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Warnings Display */}
            {antiCheatState.warnings.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-4">
                <h4 className="font-medium text-orange-400 mb-2">Security Alerts</h4>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {antiCheatState.warnings.slice(-3).map((warning, index) => (
                    <div key={index} className="text-xs text-orange-300 font-mono">
                      {warning}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Start Competition */}
        <Card className="border-green-900/20 bg-green-500/5 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-400">
              <Play className="h-5 w-5" />
              Ready to Start?
            </CardTitle>
            <CardDescription>
              Once you start, the timer will begin and anti-cheat monitoring will be fully active
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <p>• Make sure you're in a quiet environment</p>
                <p>• Close unnecessary browser tabs</p>
                <p>• Ensure stable internet connection</p>
              </div>
              
              <Button
                onClick={handleStartCompetition}
                disabled={!hasAccepted || antiCheatState.isBlocked || isStarting}
                className="bg-green-600 hover:bg-green-700 min-w-[200px]"
                size="lg"
              >
                {isStarting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Starting...
                  </>
                ) : antiCheatState.isBlocked ? (
                  <>
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Access Blocked
                  </>
                ) : !hasAccepted ? (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Accept Terms First
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Competition
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}