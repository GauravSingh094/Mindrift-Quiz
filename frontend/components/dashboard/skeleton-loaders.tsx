"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function SkeletonPulse({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`animate-pulse bg-zinc-900 rounded-md ${className || ""}`} style={style} {...props} />
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {[1, 2, 3, 4, 5, 6].map((idx) => (
        <Card key={idx} className="border-zinc-800 bg-zinc-950/40">
          <CardHeader className="pb-2 space-y-2">
            <SkeletonPulse className="h-4 w-2/3" />
          </CardHeader>
          <CardContent className="space-y-2">
            <SkeletonPulse className="h-8 w-1/2" />
            <SkeletonPulse className="h-3 w-3/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ChartSkeleton() {
  return (
    <Card className="border-zinc-800 bg-zinc-950/40 p-6 space-y-4">
      <div className="flex justify-between items-center">
        <SkeletonPulse className="h-6 w-1/4" />
        <SkeletonPulse className="h-8 w-1/6" />
      </div>
      <div className="h-[280px] w-full flex items-end gap-2 pt-4">
        {[...Array(12)].map((_, i) => (
          <SkeletonPulse
            key={i}
            className="flex-1"
            style={{ height: `${Math.random() * 80 + 10}%` }}
          />
        ))}
      </div>
    </Card>
  );
}

export function WidgetSkeleton() {
  return (
    <Card className="border-zinc-800 bg-zinc-950/40 p-6 space-y-4">
      <SkeletonPulse className="h-6 w-1/3" />
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 items-center">
            <SkeletonPulse className="h-10 w-10 rounded-xl" />
            <div className="flex-1 space-y-2">
              <SkeletonPulse className="h-4 w-3/4" />
              <SkeletonPulse className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ActivitySkeleton() {
  return (
    <Card className="border-zinc-800 bg-zinc-950/40 p-6 space-y-4">
      <SkeletonPulse className="h-6 w-1/4" />
      <div className="space-y-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-start gap-3">
            <SkeletonPulse className="h-8 w-8 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="flex justify-between">
                <SkeletonPulse className="h-4 w-1/2" />
                <SkeletonPulse className="h-3 w-12" />
              </div>
              <SkeletonPulse className="h-3 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
