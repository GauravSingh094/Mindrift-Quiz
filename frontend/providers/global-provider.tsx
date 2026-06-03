'use client';

import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { QueryProvider } from './query-provider';
import { ThemeProvider } from './theme-provider';
import { Toaster } from 'sonner';

export function GlobalProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      appearance={{
        variables: {
          colorPrimary: 'hsl(263.4 83.3% 57.8%)',
          colorBackground: 'hsl(240 10% 6%)',
          colorInputBackground: 'hsl(240 5.9% 10%)',
          colorText: 'hsl(0 0% 98%)',
          colorTextSecondary: 'hsl(240 5% 64.9%)',
          colorInputText: 'hsl(0 0% 98%)',
        },
        elements: {
          card: 'bg-background-surface border border-border shadow-elevated-md',
        },
      }}
    >
      <QueryProvider>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          <Toaster 
            theme="dark" 
            closeButton 
            richColors 
            position="top-right" 
          />
        </ThemeProvider>
      </QueryProvider>
    </ClerkProvider>
  );
}

export default GlobalProvider;
