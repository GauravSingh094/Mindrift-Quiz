import React from 'react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from './card';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatCardProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  value: string | number;
  description?: string;
  icon?: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  glowColor?: 'purple' | 'green' | 'amber';
}

export function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  glowColor = 'purple',
  className,
  ...props
}: StatCardProps) {
  const glowClasses = {
    purple: 'hover:border-brand-purple/30',
    green: 'hover:border-brand-green/30',
    amber: 'hover:border-brand-amber/30',
  };

  return (
    <Card
      className={cn(
        "group relative overflow-hidden bg-background-surface border border-border/50 transition-all duration-300 hover:shadow-elevated-md hover:scale-[1.02]",
        glowClasses[glowColor],
        className
      )}
      {...props}
    >
      {/* Background Radial Glow Effect */}
      <div className={cn(
        "absolute -inset-px opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-transparent to-transparent pointer-events-none z-0",
        glowColor === 'purple' && 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-purple/10 via-transparent',
        glowColor === 'green' && 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-green/10 via-transparent',
        glowColor === 'amber' && 'bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-brand-amber/10 via-transparent'
      )} />

      <CardContent className="p-6 relative z-10 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-foreground-disabled">{title}</span>
          {icon && (
            <div className={cn(
              "p-2 rounded-md bg-background-elevated border border-border/30 text-foreground-muted group-hover:text-foreground transition-colors duration-200",
              glowColor === 'purple' && 'group-hover:border-brand-purple/20 group-hover:bg-brand-purple/5',
              glowColor === 'green' && 'group-hover:border-brand-green/20 group-hover:bg-brand-green/5',
              glowColor === 'amber' && 'group-hover:border-brand-amber/20 group-hover:bg-brand-amber/5'
            )}>
              {icon}
            </div>
          )}
        </div>

        <div className="space-y-1">
          <div className="text-2xl sm:text-3xl font-bold font-mono tracking-tight text-foreground">
            {value}
          </div>

          {(trend || description) && (
            <div className="flex items-center gap-2 text-xs">
              {trend && (
                <span className={cn(
                  "flex items-center gap-1 font-medium font-mono",
                  trend.isPositive ? "text-brand-green" : "text-destructive"
                )}>
                  {trend.isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </span>
              )}
              {description && (
                <span className="text-foreground-disabled leading-none">{description}</span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export default StatCard;
