"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Question } from '@/lib/types';
import { cn } from '@/lib/utils';

interface QuestionCardProps {
  question: Question;
  selectedOption?: string;
  onSelectOption: (optionId: string) => void;
  showCorrectAnswer?: boolean;
}

export function QuestionCard({ 
  question, 
  selectedOption, 
  onSelectOption, 
  showCorrectAnswer = false 
}: QuestionCardProps) {
  const [selectedId, setSelectedId] = useState<string | undefined>(selectedOption);
  
  const handleOptionSelect = (optionId: string) => {
    if (showCorrectAnswer) return;
    setSelectedId(optionId);
    onSelectOption(optionId);
  };
  
  return (
    <Card className="border-purple-900/20 bg-black/40 dark:bg-black/40 bg-white/90 backdrop-blur-md">
      <CardHeader>
        <CardTitle className="text-xl text-foreground dark:text-white">{question.text}</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={selectedId}
          className="space-y-3"
        >
          {question.options.map((option) => {
            const isCorrect = option.id === question.correctOptionId;
            const isSelected = option.id === selectedId;
            const showCorrectStyle = showCorrectAnswer && isCorrect;
            const showIncorrectStyle = showCorrectAnswer && isSelected && !isCorrect;
            
            return (
              <div 
                key={option.id}
                className={cn(
                  "flex items-center space-x-2 rounded-lg border p-4 cursor-pointer transition-all",
                  isSelected && !showCorrectAnswer && "border-blue-500 bg-blue-500/10",
                  showCorrectStyle && "border-green-500 bg-green-500/10",
                  showIncorrectStyle && "border-red-500 bg-red-500/10",
                  !isSelected && "border-purple-900/20 hover:border-purple-500/30 hover:bg-primary/5"
                )}
                onClick={() => handleOptionSelect(option.id)}
              >
                <RadioGroupItem 
                  value={option.id} 
                  id={option.id}
                  className={cn(
                    showCorrectStyle && "text-green-500 border-green-500",
                    showIncorrectStyle && "text-red-500 border-red-500"
                  )}
                />
                <Label 
                  htmlFor={option.id} 
                  className={cn(
                    "flex-1 cursor-pointer text-foreground dark:text-white",
                    showCorrectStyle && "text-green-500",
                    showIncorrectStyle && "text-red-500"
                  )}
                >
                  {option.text}
                </Label>
              </div>
            );
          })}
        </RadioGroup>
        
        {showCorrectAnswer && question.explanation && (
          <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h4 className="font-medium text-blue-400 mb-1">Explanation</h4>
            <p className="text-sm text-blue-300">{question.explanation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}