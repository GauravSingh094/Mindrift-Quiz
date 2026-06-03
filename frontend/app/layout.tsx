import './globals.css';
import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import { GlobalProvider } from '@/providers/global-provider';

const outfit = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Mindrift | AI-Powered Quiz & Analytics Platform',
  description: 'An immersive quiz, competition, and learning platform driven by AI automation.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={outfit.className}>
        <GlobalProvider>
          {children}
        </GlobalProvider>
      </body>
    </html>
  );
}