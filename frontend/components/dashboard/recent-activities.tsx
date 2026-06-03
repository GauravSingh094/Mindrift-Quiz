"use client";

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { formatDistanceToNow } from 'date-fns';

type Activity = {
  id: string;
  user: {
    name: string;
    image?: string;
    initials: string;
  };
  action: string;
  target: string;
  date: Date;
  score?: number;
};

const recentActivities: Activity[] = [
  {
    id: '1',
    user: {
      name: 'You',
      initials: 'DU',
    },
    action: 'completed',
    target: 'Space Exploration Quiz',
    date: new Date(Date.now() - 2 * 60 * 60 * 1000),
    score: 85,
  },
  {
    id: '2',
    user: {
      name: 'Sarah Johnson',
      image: 'https://i.pravatar.cc/150?img=5',
      initials: 'SJ',
    },
    action: 'joined',
    target: 'your "Computer Science Fundamentals" quiz',
    date: new Date(Date.now() - 5 * 60 * 60 * 1000),
  },
  {
    id: '3',
    user: {
      name: 'You',
      initials: 'DU',
    },
    action: 'created',
    target: 'Computer Science Fundamentals quiz',
    date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    user: {
      name: 'Alex Chen',
      image: 'https://i.pravatar.cc/150?img=3',
      initials: 'AC',
    },
    action: 'achieved high score on',
    target: 'your "Space Exploration Quiz"',
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    score: 92,
  },
  {
    id: '5',
    user: {
      name: 'You',
      initials: 'DU',
    },
    action: 'started',
    target: 'World Geography Challenge',
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
];

export function RecentActivities() {
  return (
    <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md">
      <CardHeader className="pb-3">
        <CardTitle>Recent Activity</CardTitle>
        <CardDescription>
          Latest quiz activities and interactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-start space-x-4">
              <Avatar className="h-9 w-9">
                <AvatarImage src={activity.user.image} alt={activity.user.name} />
                <AvatarFallback>{activity.user.initials}</AvatarFallback>
              </Avatar>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none">
                  <span className="font-semibold">{activity.user.name}</span>{' '}
                  <span className="text-muted-foreground">{activity.action}</span>{' '}
                  <span className="font-medium">{activity.target}</span>
                  {activity.score && (
                    <span className="text-muted-foreground">
                      {' '}with a score of{' '}
                      <span className="text-green-400 font-medium">
                        {activity.score}%
                      </span>
                    </span>
                  )}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(activity.date, { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}