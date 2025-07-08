"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Trophy, 
  Users, 
  Clock, 
  Calendar,
  Shield,
  Play,
  Settings,
  Eye,
  Copy
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
import { Competition } from '@/lib/firestore-service';

interface CompetitionsListProps {
  competitions: Competition[];
}

export function CompetitionsList({ competitions }: CompetitionsListProps) {
  const { toast } = useToast();

  const copyCompetitionCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({
      title: "Code Copied",
      description: `Competition code "${code}" copied to clipboard`,
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'scheduled':
        return (
          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20">
            <Clock className="h-3 w-3 mr-1" />
            Scheduled
          </Badge>
        );
      case 'active':
        return (
          <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse mr-2" />
            Live Now
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
            <Trophy className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      default:
        return null;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    const colors: Record<string, string> = {
      easy: 'text-green-400',
      medium: 'text-blue-400',
      hard: 'text-orange-400',
      expert: 'text-red-400'
    };
    return colors[difficulty] || 'text-gray-400';
  };

  if (competitions.length === 0) {
    return (
      <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-purple-500/10 rounded-full flex items-center justify-center">
              <Trophy className="h-8 w-8 text-purple-400" />
            </div>
            <h3 className="text-lg font-semibold text-foreground dark:text-white">No Competitions Found</h3>
            <p className="text-muted-foreground">
              No competitions match the current filter. Create your first competition to get started!
            </p>
            <Button asChild>
              <Link href="/admin/competitions/new">Create Competition</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {competitions.map((competition) => (
        <Card 
          key={competition.id}
          className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md hover:bg-black/50 dark:hover:bg-black/50 hover:bg-white/95 transition-all"
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <CardTitle className="text-lg text-foreground dark:text-white">{competition.title}</CardTitle>
                  {getStatusBadge(competition.status)}
                </div>
                <CardDescription className="text-sm">
                  {competition.description}
                </CardDescription>
                <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                  <span className={`font-medium ${getDifficultyColor(competition.difficulty)}`}>
                    {competition.difficulty.charAt(0).toUpperCase() + competition.difficulty.slice(1)}
                  </span>
                  <span>{competition.totalQuestions} questions</span>
                  <span>{competition.duration} minutes</span>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyCompetitionCode(competition.competitionCode)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-4 w-4" />
                </Button>
                
                {competition.status === 'active' && (
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/competitions/${competition.competitionCode}/dashboard`}>
                      <Eye className="h-4 w-4" />
                    </Link>
                  </Button>
                )}
                
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/admin/competitions/${competition.competitionCode}/settings`}>
                    <Settings className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                  <Calendar className="h-4 w-4 text-blue-400" />
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">
                    {competition.status === 'scheduled' ? 'Starts' : 
                     competition.status === 'active' ? 'Started' : 'Completed'}
                  </div>
                  <div className="font-medium text-foreground dark:text-white text-xs">
                    {competition.status === 'scheduled' 
                      ? formatDistanceToNow(competition.scheduledAt, { addSuffix: true })
                      : format(competition.scheduledAt, 'MMM d, HH:mm')
                    }
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                  <Users className="h-4 w-4 text-green-400" />
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Participants</div>
                  <div className="font-medium text-foreground dark:text-white text-xs">
                    {competition.currentParticipants}/{competition.maxParticipants}
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center">
                  <Clock className="h-4 w-4 text-purple-400" />
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Duration</div>
                  <div className="font-medium text-foreground dark:text-white text-xs">
                    {competition.duration} min
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center">
                  <Shield className="h-4 w-4 text-orange-400" />
                </div>
                <div>
                  <div className="text-muted-foreground text-xs">Security</div>
                  <div className="font-medium text-foreground dark:text-white text-xs">
                    {competition.antiCheat.copyPasteLock ? 'Protected' : 'Basic'}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Categories */}
            <div className="flex flex-wrap gap-1 mb-4">
              {competition.categories.slice(0, 3).map((category) => (
                <Badge key={category} variant="outline" className="text-xs">
                  {category.replace(/_/g, ' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}
                </Badge>
              ))}
              {competition.categories.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{competition.categories.length - 3} more
                </Badge>
              )}
            </div>
            
            {/* Competition Code */}
            <div className="bg-black/20 dark:bg-black/20 bg-gray-50 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-muted-foreground mb-1">Competition Code</div>
                  <div className="font-mono text-sm font-medium text-foreground dark:text-white">
                    {competition.competitionCode}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyCompetitionCode(competition.competitionCode)}
                  className="text-muted-foreground hover:text-foreground"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>
            
            {/* Anti-Cheat Measures */}
            <div className="flex flex-wrap gap-2">
              {competition.antiCheat.copyPasteLock && (
                <Badge variant="outline" className="text-xs bg-red-500/10 text-red-400 border-red-500/20">
                  Copy/Paste Locked
                </Badge>
              )}
              {competition.antiCheat.tabSwitchLimit > 0 && (
                <Badge variant="outline" className="text-xs bg-yellow-500/10 text-yellow-400 border-yellow-500/20">
                  Tab Limit: {competition.antiCheat.tabSwitchLimit}
                </Badge>
              )}
              {competition.antiCheat.cooldownPeriod > 0 && (
                <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-400 border-blue-500/20">
                  Cooldown: {competition.antiCheat.cooldownPeriod}m
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}