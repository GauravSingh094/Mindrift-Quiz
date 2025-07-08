import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { DashboardQuizList } from '@/components/dashboard/quiz-list';
import { RecentActivities } from '@/components/dashboard/recent-activities';
import { Stats } from '@/components/dashboard/stats';
import { Clock, Plus } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Dashboard | Mindrift',
  description: 'Your quiz dashboard',
};

export default function DashboardPage() {
  return (
    <div className="container px-4 mx-auto max-w-7xl">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Manage your quizzes and track your progress
          </p>
        </div>
        <Button asChild>
          <Link href="/create">
            <Plus className="mr-2 h-4 w-4" /> Create Quiz
          </Link>
        </Button>
      </div>

      <div className="grid gap-8">
        <Stats />
        
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
          <div className="lg:col-span-4 space-y-8">
            <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle>Your Quizzes</CardTitle>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href="/quizzes">View all</Link>
                  </Button>
                </div>
                <CardDescription>
                  Quizzes you've created or participated in recently
                </CardDescription>
              </CardHeader>
              <CardContent>
                <DashboardQuizList />
              </CardContent>
            </Card>
            
            <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md">
              <CardHeader className="pb-3">
                <CardTitle>Upcoming Live Quizzes</CardTitle>
                <CardDescription>
                  Join these scheduled live quizzes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start space-x-4 bg-primary/5 p-4 rounded-lg">
                    <div className="bg-blue-600/20 p-2 rounded-full">
                      <Clock className="h-5 w-5 text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Space Exploration Quiz</h4>
                        <span className="text-sm bg-blue-500/10 text-blue-400 px-2 py-1 rounded-full">Starts in 58 min</span>
                      </div>
                      <p className="text-muted-foreground text-sm mt-1">Test your knowledge about space exploration and discoveries</p>
                      <div className="flex mt-2">
                        <span className="text-xs bg-secondary/50 px-2 py-1 rounded-full">Science</span>
                        <span className="text-xs bg-secondary/50 px-2 py-1 rounded-full ml-2">Medium</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" size="sm" className="w-full">
                  Browse All Live Quizzes
                </Button>
              </CardFooter>
            </Card>
          </div>
          
          <div className="lg:col-span-3">
            <RecentActivities />
          </div>
        </div>
      </div>
    </div>
  );
}