"use client";

import { useState, Suspense } from 'react';
import { Metadata } from 'next';
import { QuizzesList } from '@/components/quiz/quizzes-list';
import { QuizFilters, FilterState } from '@/components/quiz/quiz-filters';
import { Button } from '@/components/ui/button';
import { SlidersHorizontal, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

function QuizzesPageContent() {
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    difficulties: [],
    status: [],
    timeLimit: null,
  });
  
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
  };

  const getActiveFiltersCount = () => {
    return filters.categories.length + 
           filters.difficulties.length + 
           filters.status.length + 
           (filters.timeLimit ? 1 : 0);
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <div className="container px-4 mx-auto max-w-7xl">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Quizzes</h1>
            <p className="text-muted-foreground mt-1">
              Browse and participate in quizzes from various categories
            </p>
          </div>
          
          {/* Mobile Filter Toggle */}
          <div className="sm:hidden">
            <Sheet open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  Filters
                  {activeFiltersCount > 0 && (
                    <span className="ml-2 bg-primary text-primary-foreground rounded-full px-2 py-0.5 text-xs">
                      {activeFiltersCount}
                    </span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-80 p-0">
                <SheetHeader className="p-6 pb-4">
                  <SheetTitle className="flex items-center justify-between">
                    Filters
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setIsMobileFiltersOpen(false)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </SheetTitle>
                </SheetHeader>
                <div className="px-6 pb-6">
                  <QuizFilters 
                    onFiltersChange={handleFiltersChange}
                    activeFiltersCount={activeFiltersCount}
                  />
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
        {/* Desktop Filters */}
        <div className="hidden lg:block">
          <QuizFilters 
            onFiltersChange={handleFiltersChange}
            activeFiltersCount={activeFiltersCount}
          />
        </div>
        
        {/* Quiz List */}
        <div className="min-h-[400px]">
          <QuizzesList filters={filters} />
        </div>
      </div>
    </div>
  );
}

export default function QuizzesPage() {
  return (
    <Suspense fallback={
      <div className="container px-4 mx-auto max-w-7xl">
        <div className="mb-8">
          <div className="h-8 bg-gray-600 rounded w-32 mb-2 animate-pulse" />
          <div className="h-4 bg-gray-700 rounded w-64 animate-pulse" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-8">
          <div className="hidden lg:block">
            <div className="h-96 bg-gray-600 rounded animate-pulse" />
          </div>
          <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-80 bg-gray-600 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    }>
      <QuizzesPageContent />
    </Suspense>
  );
}