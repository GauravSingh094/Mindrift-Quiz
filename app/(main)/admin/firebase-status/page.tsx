import { Metadata } from 'next';
import { FirebaseStatus } from '@/components/firebase/firebase-status';

export const metadata: Metadata = {
  title: 'System Status | Mindrift',
  description: 'Monitor system status',
};

export default function SystemStatusPage() {
  return (
    <div className="container px-4 mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-white">System Status</h1>
        <p className="text-muted-foreground mt-1">
          Current system configuration and status
        </p>
      </div>
      
      <FirebaseStatus />
    </div>
  );
}