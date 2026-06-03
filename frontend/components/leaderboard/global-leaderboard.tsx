"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Trophy, Loader2 } from 'lucide-react';
import { CATEGORIES } from '@/lib/mock-data';
import { Category } from '@/lib/types';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type LeaderboardPeriod = 'all-time' | 'monthly' | 'weekly' | 'daily';

// Extended mock data for the leaderboard - independent of quiz filters
const leaderboardUsers = [
  { id: 'user-1', name: 'Alex Johnson', image: 'https://i.pravatar.cc/150?img=1', score: 4850, quizzesTaken: 78, averageScore: 92 },
  { id: 'user-2', name: 'Sam Davis', image: 'https://i.pravatar.cc/150?img=2', score: 4720, quizzesTaken: 65, averageScore: 88 },
  { id: 'user-3', name: 'Morgan Chen', image: 'https://i.pravatar.cc/150?img=3', score: 4580, quizzesTaken: 72, averageScore: 85 },
  { id: 'user-4', name: 'Jordan Lee', image: 'https://i.pravatar.cc/150?img=4', score: 4490, quizzesTaken: 61, averageScore: 89 },
  { id: 'user-5', name: 'Taylor Wilson', image: 'https://i.pravatar.cc/150?img=5', score: 4320, quizzesTaken: 58, averageScore: 91 },
  { id: 'user-6', name: 'Jamie Smith', image: 'https://i.pravatar.cc/150?img=6', score: 4250, quizzesTaken: 55, averageScore: 87 },
  { id: 'user-7', name: 'Casey White', image: 'https://i.pravatar.cc/150?img=7', score: 4150, quizzesTaken: 62, averageScore: 84 },
  { id: 'user-8', name: 'Riley Brown', image: 'https://i.pravatar.cc/150?img=8', score: 4090, quizzesTaken: 53, averageScore: 86 },
  { id: 'user-9', name: 'Jessie Miller', image: 'https://i.pravatar.cc/150?img=9', score: 3980, quizzesTaken: 49, averageScore: 90 },
  { id: 'user-10', name: 'Avery Garcia', image: 'https://i.pravatar.cc/150?img=10', score: 3850, quizzesTaken: 47, averageScore: 83 },
];

interface LeaderboardState {
  users: typeof leaderboardUsers;
  isLoading: boolean;
  error: string | null;
  searchTerm: string;
  filteredUsers: typeof leaderboardUsers;
}

export function GlobalLeaderboard() {
  const [period, setPeriod] = useState<LeaderboardPeriod>('all-time');
  const [category, setCategory] = useState<string>('all');
  const [leaderboardState, setLeaderboardState] = useState<LeaderboardState>({
    users: [],
    isLoading: true,
    error: null,
    searchTerm: '',
    filteredUsers: []
  });
  
  // Simulate fetching leaderboard data - independent of quiz filters
  useEffect(() => {
    const fetchLeaderboardData = async () => {
      setLeaderboardState(prev => ({ ...prev, isLoading: true, error: null }));
      
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // In a real app, this would be an API call
        // const response = await fetch(`/api/leaderboard?period=${period}&category=${category}`);
        // const data = await response.json();
        
        setLeaderboardState(prev => ({
          ...prev,
          users: leaderboardUsers,
          filteredUsers: leaderboardUsers,
          isLoading: false
        }));
      } catch (error) {
        setLeaderboardState(prev => ({
          ...prev,
          error: 'Failed to load leaderboard data',
          isLoading: false
        }));
      }
    };

    fetchLeaderboardData();
  }, [period, category]);

  // Handle search filtering
  useEffect(() => {
    if (!leaderboardState.users) return;
    
    const filtered = leaderboardState.users.filter(user =>
      user.name.toLowerCase().includes(leaderboardState.searchTerm.toLowerCase())
    );
    
    setLeaderboardState(prev => ({
      ...prev,
      filteredUsers: filtered
    }));
  }, [leaderboardState.searchTerm, leaderboardState.users]);
  
  const handlePeriodChange = (value: string) => {
    setPeriod(value as LeaderboardPeriod);
  };
  
  const handleCategoryChange = (value: string) => {
    setCategory(value);
  };

  const handleSearchChange = (value: string) => {
    setLeaderboardState(prev => ({
      ...prev,
      searchTerm: value
    }));
  };

  if (leaderboardState.error) {
    return (
      <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md">
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
              <Trophy className="h-8 w-8 text-red-400" />
            </div>
            <h3 className="text-lg font-semibold">Failed to load leaderboard</h3>
            <p className="text-muted-foreground">{leaderboardState.error}</p>
            <Button onClick={() => window.location.reload()}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-400" />
                Global Rankings
              </CardTitle>
              <CardDescription>
                The top performing quiz masters across all categories
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row justify-between gap-4 mb-6">
            <Tabs defaultValue="all-time" value={period} onValueChange={handlePeriodChange} className="w-full sm:w-auto">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="all-time">All Time</TabsTrigger>
                <TabsTrigger value="monthly">Monthly</TabsTrigger>
                <TabsTrigger value="weekly">Weekly</TabsTrigger>
                <TabsTrigger value="daily">Daily</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex gap-2">
              <Select value={category} onValueChange={handleCategoryChange}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  className="pl-8 w-[140px] sm:w-[200px]"
                  value={leaderboardState.searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {leaderboardState.isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-primary/5 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-gray-600 rounded-full" />
                    <div className="w-10 h-10 bg-gray-600 rounded-full" />
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-600 rounded w-32" />
                      <div className="h-3 bg-gray-700 rounded w-24" />
                    </div>
                  </div>
                  <div className="h-6 bg-gray-600 rounded w-16" />
                </div>
              ))}
            </div>
          ) : leaderboardState.filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No users found</h3>
              <p className="text-muted-foreground">
                {leaderboardState.searchTerm 
                  ? `No users match "${leaderboardState.searchTerm}"`
                  : 'No leaderboard data available'
                }
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {leaderboardState.filteredUsers.map((user, index) => (
                <div 
                  key={user.id} 
                  className={getRowStyles(index)}
                >
                  <div className="flex items-center gap-4">
                    <div className={getRankStyles(index)}>
                      {index + 1}
                    </div>
                    <Avatar className="h-10 w-10 border-2 border-background">
                      <AvatarImage src={user.image} />
                      <AvatarFallback>{user.name.substring(0, 2)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {user.quizzesTaken} quizzes · {user.averageScore}% avg score
                      </div>
                    </div>
                  </div>
                  <div className="font-bold text-lg">{user.score.toLocaleString()}</div>
                </div>
              ))}
            </div>
          )}
          
          {!leaderboardState.isLoading && leaderboardState.filteredUsers.length > 0 && (
            <div className="mt-6 flex justify-center">
              <Button variant="outline" disabled={leaderboardState.isLoading}>
                {leaderboardState.isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'View More'
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function getRowStyles(index: number): string {
  let baseStyles = "flex items-center justify-between p-4 rounded-lg transition-colors";
  
  if (index === 0) return `${baseStyles} bg-yellow-500/10 border border-yellow-500/20`;
  if (index === 1) return `${baseStyles} bg-gray-400/10 border border-gray-400/20`;
  if (index === 2) return `${baseStyles} bg-amber-700/10 border border-amber-700/20`;
  
  return `${baseStyles} bg-primary/5 hover:bg-primary/10`;
}

function getRankStyles(index: number): string {
  let baseStyles = "flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm";
  
  if (index === 0) return `${baseStyles} bg-yellow-500 text-black`;
  if (index === 1) return `${baseStyles} bg-gray-400 text-black`;
  if (index === 2) return `${baseStyles} bg-amber-700 text-white`;
  
  return `${baseStyles} bg-primary/10`;
}