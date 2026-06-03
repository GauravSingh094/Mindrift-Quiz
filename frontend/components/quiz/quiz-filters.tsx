"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Check, ChevronDown, X, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { CATEGORIES, DIFFICULTIES } from '@/lib/mock-data';
import { Category, Difficulty } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

export interface FilterState {
  categories: Category[];
  difficulties: Difficulty[];
  status: ('live' | 'available')[];
  timeLimit: number | null;
}

interface QuizFiltersProps {
  onFiltersChange: (filters: FilterState) => void;
  activeFiltersCount?: number;
}

const TIME_LIMITS = [
  { value: 15, label: '≤ 15 minutes' },
  { value: 30, label: '≤ 30 minutes' },
  { value: 60, label: '≤ 1 hour' },
];

const STATUS_OPTIONS = [
  { value: 'live' as const, label: 'Live Now', color: 'bg-green-500/10 text-green-400 border-green-500/20' },
  { value: 'available' as const, label: 'Available', color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
];

export function QuizFilters({ onFiltersChange, activeFiltersCount = 0 }: QuizFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [openSections, setOpenSections] = useState({
    categories: true,
    difficulties: true,
    status: true,
    timeLimit: true,
  });

  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    difficulties: [],
    status: [],
    timeLimit: null,
  });

  // Initialize filters from URL on component mount
  useEffect(() => {
    const urlCategories = searchParams.get('categories')?.split(',').filter(Boolean) as Category[] || [];
    const urlDifficulties = searchParams.get('difficulties')?.split(',').filter(Boolean) as Difficulty[] || [];
    const urlStatus = searchParams.get('status')?.split(',').filter(Boolean) as ('live' | 'available')[] || [];
    const urlTimeLimit = searchParams.get('timeLimit') ? parseInt(searchParams.get('timeLimit')!) : null;

    const initialFilters = {
      categories: urlCategories,
      difficulties: urlDifficulties,
      status: urlStatus,
      timeLimit: urlTimeLimit,
    };

    setFilters(initialFilters);
    onFiltersChange(initialFilters);
  }, [searchParams, onFiltersChange]);

  // Update URL when filters change
  const updateURL = (newFilters: FilterState) => {
    const params = new URLSearchParams();
    
    if (newFilters.categories.length > 0) {
      params.set('categories', newFilters.categories.join(','));
    }
    if (newFilters.difficulties.length > 0) {
      params.set('difficulties', newFilters.difficulties.join(','));
    }
    if (newFilters.status.length > 0) {
      params.set('status', newFilters.status.join(','));
    }
    if (newFilters.timeLimit) {
      params.set('timeLimit', newFilters.timeLimit.toString());
    }

    const queryString = params.toString();
    const newUrl = queryString ? `/quizzes?${queryString}` : '/quizzes';
    
    router.push(newUrl, { scroll: false });
  };

  const updateFilters = (newFilters: FilterState) => {
    console.log('🔍 Filter Update:', newFilters); // Debug log
    setFilters(newFilters);
    onFiltersChange(newFilters);
    updateURL(newFilters);
  };

  const toggleCategory = (category: Category) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category];
    
    const newFilters = { ...filters, categories: newCategories };
    console.log('📂 Category Toggle:', category, 'New categories:', newCategories); // Debug log
    updateFilters(newFilters);
  };

  const toggleDifficulty = (difficulty: Difficulty) => {
    const newDifficulties = filters.difficulties.includes(difficulty)
      ? filters.difficulties.filter(d => d !== difficulty)
      : [...filters.difficulties, difficulty];
    
    const newFilters = { ...filters, difficulties: newDifficulties };
    console.log('⚡ Difficulty Toggle:', difficulty, 'New difficulties:', newDifficulties); // Debug log
    updateFilters(newFilters);
  };

  const toggleStatus = (status: 'live' | 'available') => {
    const newStatus = filters.status.includes(status)
      ? filters.status.filter(s => s !== status)
      : [...filters.status, status];
    
    const newFilters = { ...filters, status: newStatus };
    console.log('🔴 Status Toggle:', status, 'New status:', newStatus); // Debug log
    updateFilters(newFilters);
  };

  const setTimeLimit = (timeLimit: number | null) => {
    const newFilters = { ...filters, timeLimit };
    console.log('⏰ Time Limit Set:', timeLimit); // Debug log
    updateFilters(newFilters);
  };

  const resetFilters = () => {
    const emptyFilters = {
      categories: [],
      difficulties: [],
      status: [],
      timeLimit: null,
    };
    console.log('🔄 Resetting filters'); // Debug log
    updateFilters(emptyFilters);
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  const hasActiveFilters = filters.categories.length > 0 || 
                          filters.difficulties.length > 0 || 
                          filters.status.length > 0 || 
                          filters.timeLimit !== null;

  return (
    <Card className="border-purple-900/20 bg-black/40 backdrop-blur-md sticky top-24">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2 text-foreground dark:text-white">
            <Filter className="h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </CardTitle>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={resetFilters}
            disabled={!hasActiveFilters}
            className="text-xs text-foreground dark:text-white hover:bg-accent"
          >
            <X className="h-3 w-3 mr-1" />
            Reset
          </Button>
        </div>
        
        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-1 mt-2">
            {filters.categories.map(category => {
              const categoryData = CATEGORIES.find(c => c.id === category);
              return (
                <Badge 
                  key={category} 
                  variant="secondary" 
                  className="text-xs cursor-pointer hover:bg-destructive/20 text-foreground dark:text-white"
                  onClick={() => toggleCategory(category)}
                >
                  {categoryData?.name}
                  <X className="h-3 w-3 ml-1" />
                </Badge>
              );
            })}
            {filters.difficulties.map(difficulty => (
              <Badge 
                key={difficulty} 
                variant="secondary" 
                className="text-xs cursor-pointer hover:bg-destructive/20 text-foreground dark:text-white"
                onClick={() => toggleDifficulty(difficulty)}
              >
                {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
            {filters.status.map(status => (
              <Badge 
                key={status} 
                variant="secondary" 
                className="text-xs cursor-pointer hover:bg-destructive/20 text-foreground dark:text-white"
                onClick={() => toggleStatus(status)}
              >
                {status === 'live' ? 'Live Now' : 'Available'}
                <X className="h-3 w-3 ml-1" />
              </Badge>
            ))}
            {filters.timeLimit && (
              <Badge 
                variant="secondary" 
                className="text-xs cursor-pointer hover:bg-destructive/20 text-foreground dark:text-white"
                onClick={() => setTimeLimit(null)}
              >
                ≤ {filters.timeLimit} min
                <X className="h-3 w-3 ml-1" />
              </Badge>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Categories Filter */}
        <Collapsible open={openSections.categories} onOpenChange={() => toggleSection('categories')}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer py-1 hover:text-primary transition-colors">
              <h3 className="text-sm font-medium text-foreground dark:text-white">Categories</h3>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform text-foreground dark:text-white", 
                openSections.categories && "transform rotate-180"
              )} />
            </div>
          </CollapsibleTrigger>
          <Separator className="my-2" />
          <CollapsibleContent className="space-y-2 pt-2">
            <div className="grid grid-cols-1 gap-1 max-h-48 overflow-y-auto">
              {CATEGORIES.map((category) => (
                <Button
                  key={category.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "justify-start w-full h-8 px-2 text-foreground dark:text-white hover:bg-accent",
                    filters.categories.includes(category.id) && "bg-primary/10 text-primary"
                  )}
                  onClick={() => toggleCategory(category.id)}
                >
                  <div className="flex items-center w-full">
                    <div className={cn(
                      "w-4 h-4 mr-2 rounded-sm border flex items-center justify-center transition-colors",
                      filters.categories.includes(category.id) 
                        ? "bg-primary border-primary" 
                        : "border-primary/20 hover:border-primary/40"
                    )}>
                      {filters.categories.includes(category.id) && (
                        <Check className="h-3 w-3 text-primary-foreground" />
                      )}
                    </div>
                    <span className="text-xs">{category.name}</span>
                  </div>
                </Button>
              ))}
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        {/* Difficulty Filter */}
        <Collapsible open={openSections.difficulties} onOpenChange={() => toggleSection('difficulties')}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer py-1 hover:text-primary transition-colors">
              <h3 className="text-sm font-medium text-foreground dark:text-white">Difficulty</h3>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform text-foreground dark:text-white", 
                openSections.difficulties && "transform rotate-180"
              )} />
            </div>
          </CollapsibleTrigger>
          <Separator className="my-2" />
          <CollapsibleContent className="space-y-2 pt-2">
            {DIFFICULTIES.map((difficulty) => (
              <Button
                key={difficulty.id}
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-start w-full h-8 px-2 text-foreground dark:text-white hover:bg-accent",
                  filters.difficulties.includes(difficulty.id as Difficulty) && "bg-primary/10"
                )}
                onClick={() => toggleDifficulty(difficulty.id as Difficulty)}
              >
                <div className="flex items-center w-full">
                  <div className={cn(
                    "w-4 h-4 mr-2 rounded-sm border flex items-center justify-center transition-colors",
                    filters.difficulties.includes(difficulty.id as Difficulty) 
                      ? "bg-primary border-primary" 
                      : "border-primary/20 hover:border-primary/40"
                  )}>
                    {filters.difficulties.includes(difficulty.id as Difficulty) && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <span className={cn("text-xs", difficulty.color)}>{difficulty.name}</span>
                </div>
              </Button>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Status Filter */}
        <Collapsible open={openSections.status} onOpenChange={() => toggleSection('status')}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer py-1 hover:text-primary transition-colors">
              <h3 className="text-sm font-medium text-foreground dark:text-white">Status</h3>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform text-foreground dark:text-white", 
                openSections.status && "transform rotate-180"
              )} />
            </div>
          </CollapsibleTrigger>
          <Separator className="my-2" />
          <CollapsibleContent className="space-y-2 pt-2">
            {STATUS_OPTIONS.map((status) => (
              <Button
                key={status.value}
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-start w-full h-8 px-2 text-foreground dark:text-white hover:bg-accent",
                  filters.status.includes(status.value) && "bg-primary/10"
                )}
                onClick={() => toggleStatus(status.value)}
              >
                <div className="flex items-center w-full">
                  <div className={cn(
                    "w-4 h-4 mr-2 rounded-sm border flex items-center justify-center transition-colors",
                    filters.status.includes(status.value) 
                      ? "bg-primary border-primary" 
                      : "border-primary/20 hover:border-primary/40"
                  )}>
                    {filters.status.includes(status.value) && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <span className="text-xs">{status.label}</span>
                </div>
              </Button>
            ))}
          </CollapsibleContent>
        </Collapsible>

        {/* Time Limit Filter */}
        <Collapsible open={openSections.timeLimit} onOpenChange={() => toggleSection('timeLimit')}>
          <CollapsibleTrigger asChild>
            <div className="flex items-center justify-between cursor-pointer py-1 hover:text-primary transition-colors">
              <h3 className="text-sm font-medium text-foreground dark:text-white">Time Limit</h3>
              <ChevronDown className={cn(
                "h-4 w-4 transition-transform text-foreground dark:text-white", 
                openSections.timeLimit && "transform rotate-180"
              )} />
            </div>
          </CollapsibleTrigger>
          <Separator className="my-2" />
          <CollapsibleContent className="space-y-2 pt-2">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "justify-start w-full h-8 px-2 text-foreground dark:text-white hover:bg-accent",
                filters.timeLimit === null && "bg-primary/10"
              )}
              onClick={() => setTimeLimit(null)}
            >
              <div className="flex items-center w-full">
                <div className={cn(
                  "w-4 h-4 mr-2 rounded-sm border flex items-center justify-center transition-colors",
                  filters.timeLimit === null 
                    ? "bg-primary border-primary" 
                    : "border-primary/20 hover:border-primary/40"
                )}>
                  {filters.timeLimit === null && (
                    <Check className="h-3 w-3 text-primary-foreground" />
                  )}
                </div>
                <span className="text-xs">Any Duration</span>
              </div>
            </Button>
            {TIME_LIMITS.map((timeLimit) => (
              <Button
                key={timeLimit.value}
                variant="ghost"
                size="sm"
                className={cn(
                  "justify-start w-full h-8 px-2 text-foreground dark:text-white hover:bg-accent",
                  filters.timeLimit === timeLimit.value && "bg-primary/10"
                )}
                onClick={() => setTimeLimit(timeLimit.value)}
              >
                <div className="flex items-center w-full">
                  <div className={cn(
                    "w-4 h-4 mr-2 rounded-sm border flex items-center justify-center transition-colors",
                    filters.timeLimit === timeLimit.value 
                      ? "bg-primary border-primary" 
                      : "border-primary/20 hover:border-primary/40"
                  )}>
                    {filters.timeLimit === timeLimit.value && (
                      <Check className="h-3 w-3 text-primary-foreground" />
                    )}
                  </div>
                  <span className="text-xs">{timeLimit.label}</span>
                </div>
              </Button>
            ))}
          </CollapsibleContent>
        </Collapsible>
        
        {hasActiveFilters && (
          <div className="pt-4 border-t border-border">
            <Button 
              onClick={resetFilters} 
              variant="outline" 
              size="sm" 
              className="w-full text-foreground dark:text-white border-border hover:bg-accent"
            >
              <X className="mr-2 h-4 w-4" />
              Clear All Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}