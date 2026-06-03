"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, 
  Users, 
  Shield, 
  Play, 
  Square, 
  Clock,
  AlertTriangle,
  CheckCircle,
  Crown,
  Medal,
  Award,
  UserX,
  Eye
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth-context';
import { FirestoreService, Competition, CompetitionParticipant } from '@/lib/firestore-service';

export default function CompetitionDashboard() {
  const params = useParams();
  const { toast } = useToast();
  const { user } = useAuth();
  const competitionCode = params.code as string;
  
  const [competition, setCompetition] = useState<Competition | null>(null);
  const [participants, setParticipants] = useState<CompetitionParticipant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [kickedUsers, setKickedUsers] = useState<any[]>([]);

  useEffect(() => {
    const loadCompetitionData = async () => {
      if (!competitionCode) return;
      
      try {
        setIsLoading(true);
        
        // Load competition by code
        const competitionData = await FirestoreService.getCompetitionByCode(competitionCode);
        if (!competitionData) {
          throw new Error('Competition not found');
        }
        
        setCompetition(competitionData);
        
        // Load participants
        const participantsData = await FirestoreService.getCompetitionParticipants(competitionData.id!);
        setParticipants(participantsData);
        
      } catch (error) {
        console.error('Error loading competition data:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load competition data. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadCompetitionData();
    
    // Set up real-time updates every 5 seconds
    const interval = setInterval(loadCompetitionData, 5000);
    return () => clearInterval(interval);
  }, [competitionCode, toast]);

  const handleKickUser = async (userId: string, userName: string) => {
    if (!competition || !user) return;
    
    try {
      // Find participant
      const participant = participants.find(p => p.userId === userId);
      if (!participant) return;
      
      // Update participant status
      await FirestoreService.updateParticipant(participant.id!, {
        isActive: false
      });
      
      // Add to kicked users list (in real app, this would be stored in Realtime DB)
      setKickedUsers(prev => [...prev, {
        id: userId,
        name: userName,
        kickedAt: new Date(),
        reason: 'Removed by admin'
      }]);
      
      // Remove from participants list
      setParticipants(prev => prev.filter(p => p.userId !== userId));
      
      toast({
        title: "User Kicked",
        description: `${userName} has been removed from the competition`,
      });
      
    } catch (error) {
      console.error('Error kicking user:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to kick user. Please try again.",
      });
    }
  };

  const handleEndCompetition = async () => {
    if (!competition) return;
    
    try {
      await FirestoreService.updateCompetitionStatus(competition.id!, 'completed');
      setCompetition(prev => prev ? { ...prev, status: 'completed' } : null);
      
      toast({
        title: "Competition Ended",
        description: "The competition has been ended successfully",
      });
    } catch (error) {
      console.error('Error ending competition:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to end competition. Please try again.",
      });
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) return <Crown className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Award className="h-4 w-4 text-amber-600" />;
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

  if (!competition) {
    return (
      <div className="container px-4 mx-auto max-w-7xl">
        <Card className="border-red-900/20 bg-red-500/5 backdrop-blur-md">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <AlertTriangle className="h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-semibold mb-2 text-red-400">Competition Not Found</h3>
            <p className="text-red-300 text-center mb-4">
              The competition you're trying to access doesn't exist or has been removed.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Create mock leaderboard from participants
  const leaderboard = participants
    .sort((a, b) => b.currentScore - a.currentScore)
    .map((participant, index) => ({
      ...participant,
      rank: index + 1
    }));

  return (
    <div className="container px-4 mx-auto max-w-7xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-white">Competition Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and manage "{competition.title}"
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
            Live Competition
          </Badge>
          
          <Button 
            variant="outline" 
            onClick={handleEndCompetition}
            className="text-red-400 border-red-500/20 hover:bg-red-500/10"
          >
            <Square className="mr-2 h-4 w-4" />
            End Competition
          </Button>
        </div>
      </div>

      {/* Competition Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground dark:text-white">Live Participants</CardTitle>
            <Users className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-white">{participants.length}</div>
            <p className="text-xs text-muted-foreground">
              of {competition.maxParticipants} max
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground dark:text-white">Running Time</CardTitle>
            <Clock className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-white">
              {formatDistanceToNow(competition.scheduledAt)}
            </div>
            <p className="text-xs text-muted-foreground">
              Started {format(competition.scheduledAt, 'HH:mm')}
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground dark:text-white">Kicked Users</CardTitle>
            <UserX className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-white">{kickedUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              Removed from competition
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground dark:text-white">Top Score</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-white">
              {leaderboard[0]?.currentScore || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              {leaderboard[0]?.name || 'No submissions yet'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Competition Details */}
      <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md mb-8">
        <CardHeader>
          <CardTitle className="text-foreground dark:text-white">{competition.title}</CardTitle>
          <CardDescription>Competition Code: {competition.competitionCode}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Questions:</span>
              <div className="font-medium text-foreground dark:text-white">{competition.totalQuestions}</div>
            </div>
            <div>
              <span className="text-muted-foreground">Duration:</span>
              <div className="font-medium text-foreground dark:text-white">{competition.duration} min</div>
            </div>
            <div>
              <span className="text-muted-foreground">Anti-Cheat:</span>
              <div className="font-medium text-foreground dark:text-white">
                {competition.antiCheat.copyPasteLock ? 'Protected' : 'Basic'}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Started:</span>
              <div className="font-medium text-foreground dark:text-white">{format(competition.scheduledAt, 'PPp')}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs defaultValue="participants" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="participants">
            Live Participants ({participants.length})
          </TabsTrigger>
          <TabsTrigger value="leaderboard">
            Leaderboard ({leaderboard.length})
          </TabsTrigger>
          <TabsTrigger value="kicked">
            Kicked Users ({kickedUsers.length})
          </TabsTrigger>
        </TabsList>
        
        {/* Live Participants Tab */}
        <TabsContent value="participants" className="mt-6">
          <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
                <Users className="h-5 w-5 text-blue-400" />
                Live Participants
              </CardTitle>
              <CardDescription>
                Participants currently taking the competition
              </CardDescription>
            </CardHeader>
            <CardContent>
              {participants.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">No Active Participants</h3>
                  <p className="text-muted-foreground">
                    Participants will appear here when they join the competition
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {participants.map((participant) => (
                    <div 
                      key={participant.id}
                      className="flex items-center justify-between p-4 bg-black/20 dark:bg-black/20 bg-gray-50 rounded-lg border border-purple-900/10"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-500/10 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-blue-400" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground dark:text-white">{participant.name}</div>
                          <div className="text-sm text-muted-foreground">{participant.email}</div>
                          <div className="text-xs text-muted-foreground">
                            Joined {formatDistanceToNow(participant.joinedAt!, { addSuffix: true })}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm font-medium text-foreground dark:text-white">Score: {participant.currentScore}%</div>
                          <div className="text-xs text-muted-foreground">
                            {participant.questionsAnswered} questions answered
                          </div>
                        </div>
                        
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleKickUser(participant.userId, participant.name)}
                          className="text-red-400 border-red-500/20 hover:bg-red-500/10"
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Leaderboard Tab */}
        <TabsContent value="leaderboard" className="mt-6">
          <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Live Leaderboard
              </CardTitle>
              <CardDescription>
                Real-time rankings updated automatically
              </CardDescription>
            </CardHeader>
            <CardContent>
              {leaderboard.length === 0 ? (
                <div className="text-center py-8">
                  <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">No Submissions Yet</h3>
                  <p className="text-muted-foreground">
                    Leaderboard will update as participants submit answers
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {leaderboard.map((entry, index) => (
                    <div 
                      key={entry.id}
                      className={`flex items-center justify-between p-4 rounded-lg border ${
                        index === 0 ? 'bg-yellow-500/10 border-yellow-500/20' :
                        index === 1 ? 'bg-gray-400/10 border-gray-400/20' :
                        index === 2 ? 'bg-amber-700/10 border-amber-700/20' :
                        'bg-black/20 dark:bg-black/20 bg-gray-50 border-purple-900/10'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold">
                          {getRankBadge(entry.rank)}
                        </div>
                        <div>
                          <div className="font-medium text-foreground dark:text-white">{entry.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {entry.questionsAnswered} questions answered
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground dark:text-white">{entry.currentScore}%</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Kicked Users Tab */}
        <TabsContent value="kicked" className="mt-6">
          <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
                <UserX className="h-5 w-5 text-red-400" />
                Kicked Users
              </CardTitle>
              <CardDescription>
                Users removed from the competition
              </CardDescription>
            </CardHeader>
            <CardContent>
              {kickedUsers.length === 0 ? (
                <div className="text-center py-8">
                  <UserX className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2 text-foreground dark:text-white">No Kicked Users</h3>
                  <p className="text-muted-foreground">
                    Users removed from the competition will appear here
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {kickedUsers.map((user) => (
                    <div 
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-red-500/5 rounded-lg border border-red-500/20"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-red-500/10 rounded-full flex items-center justify-center">
                          <UserX className="h-5 w-5 text-red-400" />
                        </div>
                        <div>
                          <div className="font-medium text-foreground dark:text-white">{user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            Reason: {user.reason}
                          </div>
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-sm font-medium text-red-400">
                          {format(user.kickedAt, 'PPp')}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}