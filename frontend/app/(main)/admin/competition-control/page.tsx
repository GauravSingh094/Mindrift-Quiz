"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompetitionService } from '@/lib/competition-service';
import { 
  LiveParticipant, 
  CompetitionLeaderboard, 
  RegisteredParticipant,
  KickedUser,
  Quiz 
} from '@/lib/types';
import { 
  Users, 
  Trophy, 
  UserX, 
  Play, 
  Square, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Crown,
  Medal,
  Award
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow, format } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

// Mock competition quiz data
const competitionQuiz: Quiz = {
  id: 'competition-quiz-1',
  title: 'University Programming Championship 2024',
  description: 'Annual programming competition for computer science students',
  categories: ['javascript', 'python', 'java'],
  difficulty: 'expert',
  timePerQuestion: 120,
  isLive: true,
  startTime: new Date(Date.now() - 30 * 60 * 1000), // Started 30 minutes ago
  createdById: 'admin-1',
  createdAt: new Date(Date.now() - 86400000),
  updatedAt: new Date(),
  questionCount: 50,
  maxParticipants: 1000,
  currentParticipants: 247,
  status: 'active',
  quizCode: 'COMP2024',
  isCompetition: true,
  registeredParticipants: []
};

export default function CompetitionControlPage() {
  const { toast } = useToast();
  const [quiz] = useState<Quiz>(competitionQuiz);
  const [liveParticipants, setLiveParticipants] = useState<LiveParticipant[]>([]);
  const [leaderboard, setLeaderboard] = useState<CompetitionLeaderboard[]>([]);
  const [registeredParticipants, setRegisteredParticipants] = useState<RegisteredParticipant[]>([]);
  const [kickedUsers, setKickedUsers] = useState<KickedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Simulate real-time updates
  useEffect(() => {
    const loadData = () => {
      setLiveParticipants(CompetitionService.getLiveParticipants(quiz.id));
      setLeaderboard(CompetitionService.getCompetitionLeaderboard(quiz.id));
      setRegisteredParticipants(CompetitionService.getRegisteredParticipants(quiz.id));
      setKickedUsers(CompetitionService.getKickedUsers(quiz.id));
      setIsLoading(false);
    };

    // Initial load
    loadData();

    // Simulate real-time updates every 5 seconds
    const interval = setInterval(loadData, 5000);

    return () => clearInterval(interval);
  }, [quiz.id]);

  const handleKickUser = async (userId: string, userName: string) => {
    try {
      const success = CompetitionService.kickUser(
        userId, 
        quiz.id, 
        'admin-1', // Current admin ID
        'Removed by admin'
      );

      if (success) {
        toast({
          title: "User Kicked",
          description: `${userName} has been removed from the competition`,
        });

        // Refresh data
        setLiveParticipants(CompetitionService.getLiveParticipants(quiz.id));
        setKickedUsers(CompetitionService.getKickedUsers(quiz.id));
      } else {
        throw new Error('Failed to kick user');
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to kick user. Please try again.",
      });
    }
  };

  const handleQuizControl = (action: 'start' | 'end') => {
    toast({
      title: action === 'start' ? "Quiz Started" : "Quiz Ended",
      description: `Competition has been ${action === 'start' ? 'started' : 'ended'} successfully`,
    });
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return <Crown className="h-4 w-4 text-yellow-500" />;
    } else if (rank === 2) {
      return <Medal className="h-4 w-4 text-gray-400" />;
    } else if (rank === 3) {
      return <Award className="h-4 w-4 text-amber-600" />;
    }
    return <span className="text-sm font-medium">#{rank}</span>;
  };

  if (isLoading) {
    return (
      <div className="container px-4 mx-auto max-w-7xl">
        <div className="flex items-center justify-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container px-4 mx-auto max-w-7xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Competition Control</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage the live competition
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
            Live Competition
          </Badge>
          
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={() => handleQuizControl('end')}
              className="text-red-400 border-red-500/20 hover:bg-red-500/10"
            >
              <Square className="mr-2 h-4 w-4" />
              End Quiz
            </Button>
          </div>
        </div>
      </div>

      {/* Competition Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Participants</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{liveParticipants.length}</div>
            <p className="text-xs text-muted-foreground">
              of {registeredParticipants.length} registered
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Quiz Progress</CardTitle>
            <Clock className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatDistanceToNow(quiz.startTime)}
            </div>
            <p className="text-xs text-muted-foreground">
              Running time
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Kicked Users</CardTitle>
            <UserX className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kickedUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Removed from quiz
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top Score</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {leaderboard[0]?.score || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {leaderboard[0]?.name || 'No submissions yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Competition Details */}
      <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md mb-8">
        <CardHeader>
          <CardTitle>{quiz.title}</CardTitle>
          <CardDescription>{quiz.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Quiz Code:</span>
              <div className="font-mono font-medium">{quiz.quizCode}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Questions:</span>
              <div className="font-medium">{quiz.questionCount}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Time per Question:</span>
              <div className="font-medium">{quiz.timePerQuestion}s</div>
            </div>
            <div>
              <span className="text-muted-foreground">Started:</span>
              <div className="font-medium">{format(quiz.startTime, 'PPp')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="participants" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="participants">
            Live Participants ({liveParticipants.length})
          </TabsTrigger>
          <TabsTrigger value="leaderboard">
            Leaderboard ({leaderboard.length})
          </TabsTrigger>
          <TabsTrigger value="registered">
            Registered ({registeredParticipants.length})
          </TabsTrigger>
          <TabsTrigger value="kicked">
            Kicked ({kickedUsers.length})
          </TabsTrigger>
        </TabsList>
        
        {/* Live Participants Tab */}
        <TabsContent value="participants" className="mt-6">
          <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-400" />
                Live Participants
              </CardTitle>
              <CardDescription>
                Students currently taking the competition
              </CardDescription>
            </CardHeader>
            <CardContent>
              {liveParticipants.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Active Participants</h3>
                  <p className="text-muted-foreground">
                    Participants will appear here when they join the competition
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {liveParticipants.map((participant) => (
                    <div 
                      key={participant.userId}
                      className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-purple-900/10"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <div className="font-medium">{participant.name}</div>
                          <div className="text-sm text-muted-foreground">{participant.email}</div>
                          <div className="text-xs text-muted-foreground">
                            Joined {formatDistanceToNow(participant.joinedAt, { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium">Score: {participant.currentScore}</div>
                          <div className="text-xs text-muted-foreground">
                            {participant.questionsAnswered} questions answered
                          </div>
                        </div>
                        
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="text-red-400 border-red-500/20 hover:bg-red-500/10"
                            >
                              <UserX className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Kick Participant</AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to remove {participant.name} from the competition? 
                                They will be blocked from rejoining for 30 minutes.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleKickUser(participant.userId, participant.name)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Kick User
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Real-time Leaderboard Tab */}
        <TabsContent value="leaderboard" className="mt-6">
          <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Live Leaderboard
              </CardTitle>
              <CardDescription>
                Real-time rankings updated every few seconds
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Submissions Yet</h3>
                  <p className="text-muted-foreground">
                    Leaderboard will update as participants submit answers
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboard.slice(0, 20).map((entry, index) => (
                    <div 
                      key={entry.userId}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        index === 0 ? 'bg-yellow-500/10 border-yellow-500/20' :
                        index === 1 ? 'bg-gray-400/10 border-gray-400/20' :
                        index === 2 ? 'bg-amber-700/10 border-amber-700/20' :
                        'bg-black/20 border-purple-900/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold">
                          {getRankBadge(entry.rank)}
                        </div>
                        <div>
                          <div className="font-medium">{entry.name}</div>
                          <div className="text-xs text-muted-foreground">
                            Updated {formatDistanceToNow(entry.updatedAt, { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold">{entry.score} pts</div>
                        <div className="text-xs text-muted-foreground">
                          {Math.floor(entry.timeSpent / 60)}m {entry.timeSpent % 60}s
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Registered Participants Tab */}
        <TabsContent value="registered" className="mt-6">
          <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-400" />
                Registered Participants
              </CardTitle>
              <CardDescription>
                Pre-registered students eligible to join the competition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {registeredParticipants.map((participant) => (
                  <div 
                    key={participant.id}
                    className="flex items-center justify-between p-4 bg-black/20 rounded-lg border border-purple-900/10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-green-500/10 rounded-full flex items-center justify-center">
                        <CheckCircle className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <div className="font-medium">{participant.name}</div>
                        <div className="text-sm text-muted-foreground">{participant.email}</div>
                        <div className="text-xs text-muted-foreground">
                          Roll: {participant.rollNumber}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">
                        Registered {formatDistanceToNow(participant.registeredAt, { addSuffix: true })}
                      </div>
                      <Badge 
                        variant="outline" 
                        className={
                          liveParticipants.some(p => p.email === participant.email)
                            ? "bg-green-500/10 text-green-400 border-green-500/20"
                            : "bg-gray-500/10 text-gray-400 border-gray-500/20"
                        }
                      >
                        {liveParticipants.some(p => p.email === participant.email) ? 'Active' : 'Not Joined'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Kicked Users Tab */}
        <TabsContent value="kicked" className="mt-6">
          <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserX className="h-5 w-5 text-red-400" />
                Kicked Users
              </CardTitle>
              <CardDescription>
                Users removed from the competition with 30-minute rejoin block
              </CardDescription>
            </CardHeader>
            <CardContent>
              {kickedUsers.length === 0 ? (
                <div className="text-center py-8">
                  <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Kicked Users</h3>
                  <p className="text-muted-foreground">
                    Users removed from the competition will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {kickedUsers.map((kickedUser) => {
                    const kickStatus = CompetitionService.isUserKicked(kickedUser.userId, quiz.id);
                    
                    return (
                      <div 
                        key={`${kickedUser.quizId}-${kickedUser.userId}`}
                        className="flex items-center justify-between p-4 bg-red-500/5 rounded-lg border border-red-500/20"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                            <UserX className="h-5 w-5 text-red-400" />
                          </div>
                          <div>
                            <div className="font-medium">User ID: {kickedUser.userId}</div>
                            <div className="text-sm text-muted-foreground">
                              Kicked by: {kickedUser.kickedBy}
                            </div>
                            {kickedUser.reason && (
                              <div className="text-xs text-muted-foreground">
                                Reason: {kickedUser.reason}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm font-medium text-red-400">
                            {format(kickedUser.kickedAt, 'PPp')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {kickStatus.isKicked 
                              ? `Blocked for ${kickStatus.timeRemaining} more minutes`
                              : 'Block expired'
                            }
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}