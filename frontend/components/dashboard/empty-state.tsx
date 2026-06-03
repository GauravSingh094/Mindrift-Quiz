"use client";

import React from "react";
import { LucideIcon, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  title: string;
  description: string;
  icon: LucideIcon;
  actionText?: string;
  onActionClick?: () => void;
}

export function EmptyState({
  title,
  description,
  icon: Icon,
  actionText,
  onActionClick,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-zinc-800/80 rounded-2xl bg-zinc-950/20 backdrop-blur-sm min-h-[220px]">
      <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-2xl text-zinc-400 mb-4 shadow-lg shadow-purple-500/2 pointer-events-none">
        <Icon className="h-6 w-6" />
      </div>
      <h4 className="text-base font-bold text-white tracking-wide">{title}</h4>
      <p className="text-xs text-zinc-500 mt-1 max-w-[280px] leading-relaxed font-medium">
        {description}
      </p>
      {actionText && onActionClick && (
        <Button
          onClick={onActionClick}
          variant="outline"
          size="sm"
          className="mt-4 border-zinc-850 hover:bg-zinc-900 hover:text-white h-9 rounded-xl gap-1 text-xs font-semibold"
        >
          <span>{actionText}</span>
          <ArrowRight className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
