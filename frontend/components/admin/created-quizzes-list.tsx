"use client";

import { useState } from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Quiz } from '@/lib/types';
import { 
  Clock, 
  Users, 
  Play, 
  Edit, 
  Trash2, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Copy,
  ExternalLink
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';
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

interface CreatedQuizzesListProps {
  quizzes: Quiz[];
  onQuizUpdate: (quiz: Quiz) => void;
  onQuizDelete: (quizId: string) => void;
}

export function CreatedQuizzesList({ quizzes, onQuizUpdate, onQuizDelete }: CreatedQuizzesListProps) {
  const { toast } = useToast();
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null);

  const handleCopyQuizCode = (quiz: Quiz) => {
    const codeToCopy = quiz.quizCode || quiz.id;
    navigator.clipboard.writeText(codeToCopy);
    toast({
      title: "Quiz Code Copied",
      description: `Quiz code "${codeToCopy}" has been copied to clipboard`,
    });
  };

  const handleDeleteQuiz = async (quizId: string) => {
    setDeletingQuizId(quizId);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onQuizDelete(quizId);
      
      toast({
        title: "Quiz Deleted",
        description: "Quiz has been successfully deleted",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete quiz. Please try again.",
      });
    } finally {
      setDeletingQuizId(null);
    }
  };

  const getStatusBadge = (quiz: Quiz) => {
    switch (quiz.status) {
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
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case 'completed':
        return (
          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/20">
            <Calendar className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-gray-500/10 text-gray-400 border-gray-500/20">
            Unknown
          </Badge>
        );
    }
  };

  const getTimeInfo = (quiz: Quiz) => {
    const now = new Date();
    const startTime = new Date(quiz.startTime);
    
    if (quiz.status === 'scheduled') {
      if (startTime > now) {
        return {
          label: 'Starts in',
          value: formatDistanceToNow(startTime),
          color: 'text-blue-400'
        };
      } else {
        return {
          label: 'Should be active',
          value: 'Activation pending',
          color: 'text-orange-400'
        };
      }
    } else if (quiz.status === 'active') {
      return {
        label: 'Started',
        value: formatDistanceToNow(startTime, { addSuffix: true }),
        color: 'text-green-400'
      };
    } else {
      return {
        label: 'Completed',
        value: formatDistanceToNow(quiz.endTime || startTime, { addSuffix: true }),
        color: 'text-purple-400'
      };
    }
  };

  if (quizzes.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">No Quizzes Found</h3>
        <p className="text-muted-foreground">
          No quizzes match the current status filter
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {quizzes.map((quiz) => {
        const timeInfo = getTimeInfo(quiz);
        
        return (
          <Card 
            key={quiz.id} 
            className="border-purple-900/20 bg-black/20 backdrop-blur-md hover:bg-black/30 transition-all"
          >
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CardTitle className="text-lg">{quiz.title}</CardTitle>
                    {getStatusBadge(quiz)}
                  </div>
                  <CardDescription className="text-sm">
                    {quiz.description}
                  </CardDescription>
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyQuizCode(quiz)}
                    title={`Copy quiz code: ${quiz.quizCode || quiz.id}`}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  
                  {quiz.status === 'active' && (
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/quizzes/${quiz.id}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                  
                  <Button variant="ghost" size="sm" disabled>
                    <Edit className="h-4 w-4" />
                  </Button>
                  
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        disabled={deletingQuizId === quiz.id}
                      >
                        <Trash2 className="h-4 w-4 text-red-400" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Quiz</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{quiz.title}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDeleteQuiz(quiz.id)}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center">
                    <Play className="h-4 w-4 text-blue-400" />
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Questions</div>
                    <div className="font-medium">{quiz.questionCount}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center">
                    <Clock className="h-4 w-4 text-purple-400" />
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Duration</div>
                    <div className="font-medium">
                      {Math.floor(quiz.timePerQuestion * quiz.questionCount / 60)} min
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center">
                    <Users className="h-4 w-4 text-green-400" />
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">Participants</div>
                    <div className="font-medium">
                      {quiz.currentParticipants}/{quiz.maxParticipants}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-orange-500/10 rounded-full flex items-center justify-center">
                    <Calendar className="h-4 w-4 text-orange-400" />
                  </div>
                  <div>
                    <div className="text-muted-foreground text-xs">{timeInfo.label}</div>
                    <div className={`font-medium text-xs ${timeInfo.color}`}>
                      {timeInfo.value}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex flex-wrap gap-1">
                {quiz.categories.slice(0, 3).map((category) => (
                  <Badge key={category} variant="outline" className="text-xs">
                    {category.replace(/_/g, ' ').replace(/(^\w{1})|(\s+\w{1})/g, letter => letter.toUpperCase())}
                  </Badge>
                ))}
                {quiz.categories.length > 3 && (
                  <Badge variant="outline" className="text-xs">
                    +{quiz.categories.length - 3} more
                  </Badge>
                )}
                <Badge variant="outline" className="text-xs ml-2">
                  {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                </Badge>
              </div>
              
              <div className="mt-4 p-3 bg-black/20 rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Quiz Code</div>
                    <div className="font-mono text-sm font-medium text-green-400">
                      {quiz.quizCode || quiz.id}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Scheduled</div>
                    <div className="text-sm">
                      {format(new Date(quiz.startTime), 'PPP p')}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}