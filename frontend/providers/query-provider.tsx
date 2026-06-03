'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import React, { useState } from 'react';

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute cache stale
            refetchOnWindowFocus: false, // Disable focus reload
            retry: (failureCount, error: any) => {
              // Bypass retry for auth and not found errors
              if (error?.status === 440 || error?.status === 401 || error?.status === 403 || error?.status === 404) {
                return false;
              }
              return failureCount < 3;
            },
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

export default QueryProvider;
