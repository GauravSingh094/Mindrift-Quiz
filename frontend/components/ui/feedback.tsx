import React from 'react';
import { cn } from '@/lib/utils';
import { Button } from './button';
import { HelpCircle } from 'lucide-react';

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({ size = 'md', className, ...props }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };

  return (
    <div
      className={cn(
        "animate-spin rounded-full border-t-brand-purple border-r-brand-purple border-b-transparent border-l-transparent",
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
}

interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  description: string;
  icon?: React.ReactNode;
  actionText?: string;
  onAction?: () => void;
}

export function EmptyState({
  title,
  description,
  icon = <HelpCircle className="h-8 w-8 text-foreground-disabled" />,
  actionText,
  onAction,
  className,
  ...props
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center bg-background-surface border border-border/40 rounded-lg shadow-elevated-sm max-w-md mx-auto space-y-4",
        className
      )}
      {...props}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-background-elevated border border-border/30 mb-2">
        {icon}
      </div>

      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-xs text-foreground-disabled leading-relaxed">{description}</p>
      </div>

      {actionText && onAction && (
        <Button
          onClick={onAction}
          size="sm"
          className="mt-2 bg-brand-purple hover:bg-brand-purple/90 text-foreground transition-all duration-fast shadow-elevated-md hover:scale-102"
        >
          {actionText}
        </Button>
      )}
    </div>
  );
}
