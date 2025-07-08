"use client";

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { mockQuizzes } from '@/lib/mock-data';
import { Calendar, Edit, Play } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export function DashboardQuizList() {
  return (
    <div className="space-y-4">
      {mockQuizzes.map((quiz) => (
        <div 
          key={quiz.id} 
          className="bg-primary/5 rounded-lg p-4 transition-colors hover:bg-primary/10"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-medium text-base">
                  <Link href={`/quizzes/${quiz.id}`} className="hover:underline">
                    {quiz.title}
                  </Link>
                </h3>
                {quiz.isLive && (
                  <Badge 
                    variant="outline" 
                    className="bg-green-500/10 text-green-400 border-green-500/20"
                  >
                    Live
                  </Badge>
                )}
              </div>
              
              <p className="text-muted-foreground text-sm mt-1">
                {quiz.description}
              </p>
              
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline" className="bg-primary/5">
                  {(quiz.categories[0] || 'Uncategorized').replace(/_/g, ' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}
                </Badge>
                <Badge variant="outline" className="bg-primary/5">
                  {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                </Badge>
                <Badge variant="outline" className="bg-primary/5">
                  {quiz.questionCount} questions
                </Badge>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Calendar className="h-3 w-3 mr-1" />
                  {formatDistanceToNow(new Date(quiz.createdAt), { addSuffix: true })}
                </div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2">
              <Button size="sm" variant="outline" asChild>
                <Link href={`/quizzes/${quiz.id}/edit`}>
                  <Edit className="h-3.5 w-3.5 mr-1" />
                  Edit
                </Link>
              </Button>
              <Button size="sm" asChild>
                <Link href={`/quizzes/${quiz.id}`}>
                  <Play className="h-3.5 w-3.5 mr-1" />
                  Play
                </Link>
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}