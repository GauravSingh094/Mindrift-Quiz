"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Question } from '@/lib/types';
import { CheckCircle, XCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ReviewQuestionProps {
  question: Question;
  userAnswer?: string;
  questionNumber: number;
  totalQuestions: number;
}

export function ReviewQuestion({ 
  question, 
  userAnswer, 
  questionNumber, 
  totalQuestions 
}: ReviewQuestionProps) {
  const isCorrect = userAnswer === question.correctOptionId;
  const correctOption = question.options.find(opt => opt.id === question.correctOptionId);
  const userSelectedOption = question.options.find(opt => opt.id === userAnswer);

  return (
    <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <Badge variant="outline" className="text-xs text-foreground dark:text-white">
                Question {questionNumber} of {totalQuestions}
              </Badge>
              <div className="flex items-center gap-2">
                {isCorrect ? (
                  <div className="flex items-center gap-1 text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Correct</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-400">
                    <XCircle className="h-4 w-4" />
                    <span className="text-sm font-medium">Incorrect</span>
                  </div>
                )}
              </div>
            </div>
            <CardTitle className="text-lg text-foreground dark:text-white">
              {question.text}
            </CardTitle>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Answer Options */}
        <div className="space-y-3">
          {question.options.map((option) => {
            const isUserAnswer = option.id === userAnswer;
            const isCorrectAnswer = option.id === question.correctOptionId;
            
            let optionClass = "flex items-center space-x-3 rounded-lg border p-4 transition-all";
            
            if (isCorrectAnswer) {
              optionClass += " border-green-500 bg-green-500/10";
            } else if (isUserAnswer && !isCorrectAnswer) {
              optionClass += " border-red-500 bg-red-500/10";
            } else {
              optionClass += " border-purple-900/20 bg-black/10 dark:bg-black/10 bg-white/50";
            }
            
            return (
              <div key={option.id} className={optionClass}>
                <div className="flex items-center gap-3 flex-1">
                  <div className={cn(
                    "w-6 h-6 rounded-full border-2 flex items-center justify-center",
                    isCorrectAnswer && "border-green-500 bg-green-500",
                    isUserAnswer && !isCorrectAnswer && "border-red-500 bg-red-500",
                    !isUserAnswer && !isCorrectAnswer && "border-gray-400"
                  )}>
                    {isCorrectAnswer && <CheckCircle className="h-4 w-4 text-white" />}
                    {isUserAnswer && !isCorrectAnswer && <XCircle className="h-4 w-4 text-white" />}
                  </div>
                  
                  <span className={cn(
                    "flex-1 text-sm",
                    isCorrectAnswer && "text-green-400 font-medium",
                    isUserAnswer && !isCorrectAnswer && "text-red-400",
                    !isUserAnswer && !isCorrectAnswer && "text-foreground dark:text-white"
                  )}>
                    {option.text}
                  </span>
                  
                  {isUserAnswer && (
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        isCorrectAnswer ? "text-green-400 border-green-500/20" : "text-red-400 border-red-500/20"
                      )}
                    >
                      Your Answer
                    </Badge>
                  )}
                  
                  {isCorrectAnswer && (
                    <Badge variant="outline" className="text-xs text-green-400 border-green-500/20">
                      Correct Answer
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        
        {/* Answer Summary */}
        <div className="bg-black/20 dark:bg-black/20 bg-gray-50 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Your Answer:</span>
              <div className={cn(
                "font-medium mt-1",
                isCorrect ? "text-green-400" : "text-red-400"
              )}>
                {userSelectedOption?.text || "No answer selected"}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Correct Answer:</span>
              <div className="font-medium text-green-400 mt-1">
                {correctOption?.text}
              </div>
            </div>
          </div>
        </div>
        
        {/* Explanation */}
        {question.explanation && (
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Info className="h-5 w-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-400 mb-1">Explanation</h4>
                <p className="text-sm text-blue-300">{question.explanation}</p>
              </div>
            </div>
          </div>
        )}
        
        {/* Points */}
        <div className="flex justify-between items-center text-sm">
          <span className="text-muted-foreground">Points:</span>
          <span className={cn(
            "font-medium",
            isCorrect ? "text-green-400" : "text-red-400"
          )}>
            {isCorrect ? question.points : 0} / {question.points}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}