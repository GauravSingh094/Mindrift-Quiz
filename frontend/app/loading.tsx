import React from 'react';

export default function Loading() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 space-y-4">
      <div className="relative flex items-center justify-center">
        <div className="h-12 w-12 rounded-full border-t-2 border-r-2 border-brand-purple animate-spin" />
        <div className="absolute h-8 w-8 rounded-full border-b-2 border-l-2 border-brand-green animate-spin [animation-duration:1s] [animation-direction:reverse]" />
        <div className="absolute h-4 w-4 rounded-full bg-brand-purple/20 animate-ping" />
      </div>
      <p className="text-xs font-medium tracking-widest text-foreground-disabled uppercase font-mono animate-pulse">
        Synchronizing Mindrift...
      </p>
    </div>
  );
}
