import { Metadata } from 'next';
import { NewCompetitionForm } from '@/components/competitions/new-competition-form';

export const metadata: Metadata = {
  title: 'Create Competition | Mindrift',
  description: 'Create a new competitive quiz event',
};

export default function NewCompetitionPage() {
  return (
    <div className="container px-4 mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground dark:text-white">Create New Competition</h1>
        <p className="text-muted-foreground mt-1">
          Set up a competitive quiz event with advanced features and real-time monitoring
        </p>
      </div>
      
      <NewCompetitionForm />
    </div>
  );
}