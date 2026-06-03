import React from 'react';
import Link from 'next/link';
import { HelpCircle, ArrowLeft } from 'lucide-react';
import { ROUTES } from '@/constants';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple mb-6">
        <HelpCircle className="h-8 w-8" />
      </div>
      <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        404 - Page Not Found
      </h1>
      <p className="mt-2 text-sm text-foreground-muted max-w-md">
        The workspace path you are looking for does not exist or has been archived.
      </p>
      <Link
        href={ROUTES.DASHBOARD}
        className="mt-6 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-background-surface hover:bg-background-elevated border border-border rounded-md transition-all duration-fast shadow-elevated-md hover:scale-102"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to Dashboard
      </Link>
    </div>
  );
}
