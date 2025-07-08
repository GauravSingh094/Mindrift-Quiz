"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompetitionsList } from '@/components/competitions/competitions-list';
import { 
  Plus, 
  Trophy, 
  Shield, 
  Users, 
  Calendar,
  Clock,
  Target
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { FirestoreService, Competition } from '@/lib/firestore-service';
import Link from 'next/link';

export default function CompetitionsPage() {
  const { user } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    scheduled: 0,
    completed: 0
  });

  useEffect(() => {
    const loadCompetitions = async () => {
      if (!user) return;
      
      try {
        setIsLoading(true);
        const competitionsData = await FirestoreService.getCompetitions({
          createdBy: user.id
        });
        
        setCompetitions(competitionsData);
        
        // Calculate stats
        const newStats = {
          total: competitionsData.length,
          active: competitionsData.filter(c => c.status === 'active').length,
          scheduled: competitionsData.filter(c => c.status === 'scheduled').length,
          completed: competitionsData.filter(c => c.status === 'completed').length
        };
        setStats(newStats);
        
      } catch (error) {
        console.error('Error loading competitions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCompetitions();
  }, [user]);

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
          <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-white">Competition Center</h1>
          <p className="text-muted-foreground mt-1">
            Create and manage competitive quiz events with advanced anti-cheat measures
          </p>
        </div>
        
        <Button asChild className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700">
          <Link href="/admin/competitions/new">
            <Plus className="mr-2 h-4 w-4" />
            🆕 New Competition
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground dark:text-white">Total Competitions</CardTitle>
            <Trophy className="h-4 w-4 text-yellow-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-white">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              All time created
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground dark:text-white">Active Now</CardTitle>
            <Shield className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-white">{stats.active}</div>
            <p className="text-xs text-muted-foreground">
              Currently running
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground dark:text-white">Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-white">{stats.scheduled}</div>
            <p className="text-xs text-muted-foreground">
              Upcoming events
            </p>
          </CardContent>
        </Card>
        
        <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-foreground dark:text-white">Total Participants</CardTitle>
            <Users className="h-4 w-4 text-purple-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground dark:text-white">
              {competitions.reduce((sum, comp) => sum + comp.currentParticipants, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all competitions
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Competition Features Overview */}
      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
              <Shield className="h-5 w-5 text-green-400" />
              Anti-Cheat Protection
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Copy/paste prevention</li>
              <li>• Tab switch monitoring</li>
              <li>• Cooldown periods</li>
              <li>• Real-time monitoring</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
              <Target className="h-5 w-5 text-blue-400" />
              Advanced Configuration
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Multi-category selection</li>
              <li>• Custom time limits</li>
              <li>• Participant limits</li>
              <li>• Difficulty settings</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground dark:text-white">
              <Clock className="h-5 w-5 text-orange-400" />
              Real-time Management
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>• Live participant tracking</li>
              <li>• Instant leaderboards</li>
              <li>• Admin controls</li>
              <li>• Automated scheduling</li>
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Competitions List */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All ({stats.total})</TabsTrigger>
          <TabsTrigger value="active">Active ({stats.active})</TabsTrigger>
          <TabsTrigger value="scheduled">Scheduled ({stats.scheduled})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({stats.completed})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="all" className="mt-6">
          <CompetitionsList competitions={competitions} />
        </TabsContent>
        
        <TabsContent value="active" className="mt-6">
          <CompetitionsList 
            competitions={competitions.filter(c => c.status === 'active')} 
          />
        </TabsContent>
        
        <TabsContent value="scheduled" className="mt-6">
          <CompetitionsList 
            competitions={competitions.filter(c => c.status === 'scheduled')} 
          />
        </TabsContent>
        
        <TabsContent value="completed" className="mt-6">
          <CompetitionsList 
            competitions={competitions.filter(c => c.status === 'completed')} 
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}