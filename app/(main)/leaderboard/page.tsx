import { Metadata } from 'next';
import { GlobalLeaderboard } from '@/components/leaderboard/global-leaderboard';

export const metadata: Metadata = {
  title: 'Leaderboard | Mindrift',
  description: 'Global leaderboard rankings',
};

export default function LeaderboardPage() {
  return (
    <div className="container px-4 mx-auto max-w-5xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground mt-1">
          See who's leading the competition
        </p>
      </div>
      
      <GlobalLeaderboard />
    </div>
  );
}