'use client';

import React, { useEffect } from 'react';
import { AlertTriangle, RotateCcw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error detected:', error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10 text-destructive mb-6">
        <AlertTriangle className="h-8 w-8" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
        Something went wrong
      </h1>
      <p className="mt-2 text-sm text-foreground-muted max-w-md">
        An unhandled runtime boundary error has occurred. Our SRE pipelines have been notified.
      </p>
      {error.message && (
        <pre className="mt-4 p-3 bg-background-elevated border border-border text-left rounded-md max-w-lg overflow-x-auto text-xs text-destructive font-mono">
          {error.message}
        </pre>
      )}
      <button
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-brand-purple hover:bg-brand-purple/90 border border-transparent rounded-md transition-all duration-fast shadow-elevated-md hover:scale-102"
      >
        <RotateCcw className="h-4 w-4" />
        Attempt Recovery
      </button>
    </div>
  );
}
