import React from 'react';
import { cn } from '@/lib/utils';

type TypographyVariant = 'display' | 'h1' | 'h2' | 'h3' | 'h4' | 'body' | 'caption';

interface TypographyProps extends React.HTMLAttributes<HTMLHeadingElement | HTMLParagraphElement> {
  variant?: TypographyVariant;
  as?: React.ElementType;
}

export const Typography = React.forwardRef<HTMLHeadingElement, TypographyProps>(
  ({ className, variant = 'body', as, ...props }, ref) => {
    let Component: React.ElementType = as || 'p';
    let defaultClass = '';

    switch (variant) {
      case 'display':
        Component = as || 'h1';
        defaultClass = 'text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground-muted to-foreground-disabled font-sans';
        break;
      case 'h1':
        Component = as || 'h1';
        defaultClass = 'text-3xl font-bold tracking-tight sm:text-4xl font-sans text-foreground';
        break;
      case 'h2':
        Component = as || 'h2';
        defaultClass = 'text-2xl font-semibold tracking-tight sm:text-3xl font-sans text-foreground border-b border-border/20 pb-2';
        break;
      case 'h3':
        Component = as || 'h3';
        defaultClass = 'text-xl font-semibold tracking-tight sm:text-2xl font-sans text-foreground';
        break;
      case 'h4':
        Component = as || 'h4';
        defaultClass = 'text-lg font-medium tracking-tight sm:text-xl font-sans text-foreground';
        break;
      case 'body':
        Component = as || 'p';
        defaultClass = 'text-sm sm:text-base text-foreground-muted leading-relaxed';
        break;
      case 'caption':
        Component = as || 'span';
        defaultClass = 'text-xs text-foreground-disabled tracking-wide';
        break;
    }

    return (
      <Component
        ref={ref}
        className={cn(defaultClass, className)}
        {...props}
      />
    );
  }
);

Typography.displayName = 'Typography';
export default Typography;
