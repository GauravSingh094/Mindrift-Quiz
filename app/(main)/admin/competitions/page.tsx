"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CompetitionsList } from '@/components/competitions/competitions-list';
import { 
  Plus, 
  Trophy, 
  Shield, 
  Users, 
  Calendar,
  Clock,
  Target
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
// ⛔️ Removed FirestoreService import
// import { FirestoreService, Competition } from '@/lib/firestore-service';
import Link from 'next/link';

// Dummy placeholder type (replace with your real competition type from DB or API)
type Competition = {
  id: string;
  name: string;
  status: 'active' | 'scheduled' | 'completed';
  currentParticipants: number;
};

export default function CompetitionsPage() {
  const { user } = useAuth();
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    scheduled: 0,
    completed: 0
  });

  useEffect(() => {
    const loadCompetitions = async () => {
      if (!user) return;

      try {
        setIsLoading(true);

        // 🔁 Replace with your actual DB or mock fetch logic
        const competitionsData: Competition[] = []; // <-- Fetch from local/server instead

        setCompetitions(competitionsData);

        const newStats = {
          total: competitionsData.length,
          active: competitionsData.filter(c => c.status === 'active').length,
          scheduled: competitionsData.filter(c => c.status === 'scheduled').length,
          completed: competitionsData.filter(c => c.status === 'completed').length
        };
        setStats(newStats);
      } catch (error) {
        console.error('Error loading competitions:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadCompetitions();
  }, [user]);

  // ... (UI rendering remains the same as your original)

  return (
    <div className="container px-4 mx-auto max-w-7xl">
      {/* rest of your JSX (unchanged) */}
    </div>
  );
}
