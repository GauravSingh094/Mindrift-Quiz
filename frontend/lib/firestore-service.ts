// Mock Firestore Service utilizing localStorage for persistence
// Replaces actual Firebase Firestore module and dependencies

import { Competition } from './types';
export type { Competition };

// Custom Mock Timestamp to match Firebase Firestore Timestamp API
export class Timestamp {
  constructor(public seconds: number, public nanoseconds: number) {}

  static fromDate(date: Date): Timestamp {
    return new Timestamp(Math.floor(date.getTime() / 1000), 0);
  }

  static now(): Timestamp {
    return Timestamp.fromDate(new Date());
  }

  toDate(): Date {
    return new Date(this.seconds * 1000);
  }

  toISOString(): string {
    return this.toDate().toISOString();
  }
}

// Competition Participant Interface used by the dashboards
export interface CompetitionParticipant {
  id?: string;
  competitionId: string;
  userId: string;
  name: string;
  email: string;
  currentScore: number;
  questionsAnswered: number;
  isActive: boolean;
  joinedAt?: Date;
  violations?: {
    tabSwitches: number;
    copyPasteAttempts: number;
  };
}

// Generate random 6-character competition code
export function generateCompetitionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// Helper to check environment and get/set local storage data safely
const getLocalStorageItem = (key: string): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(key);
  }
  return null;
};

const setLocalStorageItem = (key: string, value: string): void => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, value);
  }
};

// Seed initial data if none exists
const seedData = () => {
  if (typeof window === 'undefined') return;

  const compKey = 'mindrift_competitions';
  const participantsKey = 'mindrift_competition_participants';

  if (!localStorage.getItem(compKey)) {
    const demoComp: Competition = {
      id: 'competition-quiz-1',
      title: 'Mindrift Web Championship 2026',
      description: 'The ultimate showdown for full stack web developers. Test your core knowledge of JavaScript, React, and databases in a secure competition.',
      category: 'react',
      categories: ['react', 'javascript'],
      difficulty: 'hard',
      scheduledAt: new Date(Date.now() + 600000), // starts in 10 minutes
      duration: 120,
      totalQuestions: 20,
      maxParticipants: 1000,
      instructions: 'Please close all background processes. No external aids are permitted. Good luck!',
      competitionCode: 'MIND26',
      antiCheat: {
        copyPasteLock: true,
        tabSwitchLimit: 3,
        cooldownPeriod: 30
      },
      status: 'active',
      currentParticipants: 3,
      createdBy: 'demo-user-1'
    };

    localStorage.setItem(compKey, JSON.stringify([demoComp]));
  }

  if (!localStorage.getItem(participantsKey)) {
    const demoParticipants: CompetitionParticipant[] = [
      {
        id: 'cp-p1',
        competitionId: 'competition-quiz-1',
        userId: 'participant-1',
        name: 'John Doe',
        email: 'john.doe@university.edu',
        currentScore: 85,
        questionsAnswered: 17,
        isActive: true,
        joinedAt: new Date(Date.now() - 300000),
        violations: {
          tabSwitches: 0,
          copyPasteAttempts: 0
        }
      },
      {
        id: 'cp-p2',
        competitionId: 'competition-quiz-1',
        userId: 'participant-2',
        name: 'Jane Smith',
        email: 'jane.smith@university.edu',
        currentScore: 90,
        questionsAnswered: 18,
        isActive: true,
        joinedAt: new Date(Date.now() - 240000),
        violations: {
          tabSwitches: 1,
          copyPasteAttempts: 0
        }
      },
      {
        id: 'cp-p3',
        competitionId: 'competition-quiz-1',
        userId: 'participant-3',
        name: 'Mike Johnson',
        email: 'mike.johnson@university.edu',
        currentScore: 70,
        questionsAnswered: 15,
        isActive: true,
        joinedAt: new Date(Date.now() - 180000),
        violations: {
          tabSwitches: 2,
          copyPasteAttempts: 1
        }
      }
    ];

    localStorage.setItem(participantsKey, JSON.stringify(demoParticipants));
  }
};

// Initialize seeding
seedData();

// Core Firestore Service Mock
export class FirestoreService {
  // Get all competitions (optionally filtered by creator)
  static async getCompetitions(filter?: { createdBy?: string }): Promise<Competition[]> {
    seedData();
    const stored = getLocalStorageItem('mindrift_competitions');
    if (!stored) return [];
    
    try {
      const competitions: Competition[] = JSON.parse(stored);
      // Map ISO string dates back to Date objects
      const parsedCompetitions = competitions.map(c => ({
        ...c,
        scheduledAt: new Date(c.scheduledAt),
        createdAt: c.createdAt ? new Date(c.createdAt) : undefined
      }));

      if (filter?.createdBy) {
        return parsedCompetitions.filter(c => c.createdBy === filter.createdBy);
      }
      return parsedCompetitions;
    } catch (e) {
      console.error('Failed to parse competitions:', e);
      return [];
    }
  }

  // Get single competition by its random code (case-insensitive)
  static async getCompetitionByCode(code: string): Promise<Competition | null> {
    seedData();
    const competitions = await this.getCompetitions();
    const found = competitions.find(c => c.competitionCode.toUpperCase() === code.toUpperCase().trim());
    return found || null;
  }

  // Create/Save a new competition
  static async createCompetition(competitionData: any): Promise<string> {
    seedData();
    const competitions = await this.getCompetitions();
    const newId = `comp-${Date.now()}`;
    
    // Resolve Timestamp type if passed
    let scheduledDate: Date;
    if (competitionData.scheduledAt && typeof competitionData.scheduledAt.toDate === 'function') {
      scheduledDate = competitionData.scheduledAt.toDate();
    } else {
      scheduledDate = new Date(competitionData.scheduledAt);
    }

    const newComp: Competition = {
      id: newId,
      title: competitionData.title,
      description: competitionData.description,
      category: competitionData.categories?.[0] || 'javascript',
      categories: competitionData.categories || ['javascript'],
      difficulty: competitionData.difficulty,
      scheduledAt: scheduledDate,
      duration: competitionData.duration,
      totalQuestions: competitionData.totalQuestions,
      maxParticipants: competitionData.maxParticipants,
      instructions: competitionData.instructions,
      competitionCode: competitionData.competitionCode || generateCompetitionCode(),
      antiCheat: competitionData.antiCheat || { copyPasteLock: true, tabSwitchLimit: 3, cooldownPeriod: 30 },
      status: 'scheduled',
      currentParticipants: 0,
      createdAt: new Date(),
      createdBy: competitionData.createdBy
    };

    competitions.push(newComp);
    setLocalStorageItem('mindrift_competitions', JSON.stringify(competitions));
    return newId;
  }

  // Update competition status (e.g. active, completed)
  static async updateCompetitionStatus(competitionId: string, status: 'scheduled' | 'active' | 'completed' | 'cancelled'): Promise<void> {
    seedData();
    const competitions = await this.getCompetitions();
    const index = competitions.findIndex(c => c.id === competitionId);
    if (index !== -1) {
      competitions[index].status = status;
      setLocalStorageItem('mindrift_competitions', JSON.stringify(competitions));
    }
  }

  // Retrieve participants for a particular tournament
  static async getCompetitionParticipants(competitionId: string): Promise<CompetitionParticipant[]> {
    seedData();
    const stored = getLocalStorageItem('mindrift_competition_participants');
    if (!stored) return [];

    try {
      const participants: CompetitionParticipant[] = JSON.parse(stored);
      return participants
        .filter(p => p.competitionId === competitionId)
        .map(p => ({
          ...p,
          joinedAt: p.joinedAt ? new Date(p.joinedAt) : undefined
        }));
    } catch (e) {
      console.error('Failed to parse participants:', e);
      return [];
    }
  }

  // Update participant details (score, violations, active status)
  static async updateParticipant(participantId: string, updates: Partial<CompetitionParticipant>): Promise<void> {
    seedData();
    const stored = getLocalStorageItem('mindrift_competition_participants');
    if (!stored) return;

    try {
      const participants: CompetitionParticipant[] = JSON.parse(stored);
      const index = participants.findIndex(p => p.id === participantId);
      if (index !== -1) {
        participants[index] = {
          ...participants[index],
          ...updates
        };
        setLocalStorageItem('mindrift_competition_participants', JSON.stringify(participants));
      }
    } catch (e) {
      console.error('Failed to update participant:', e);
    }
  }

  // Add/Register a live participant
  static async addParticipant(participantData: any): Promise<void> {
    seedData();
    const stored = getLocalStorageItem('mindrift_competition_participants');
    const participants: CompetitionParticipant[] = stored ? JSON.parse(stored) : [];

    const newId = `cp-${Date.now()}`;
    const newParticipant: CompetitionParticipant = {
      id: newId,
      competitionId: participantData.competitionId,
      userId: participantData.userId,
      name: participantData.name,
      email: participantData.email,
      currentScore: participantData.currentScore || 0,
      questionsAnswered: participantData.questionsAnswered || 0,
      isActive: participantData.isActive !== undefined ? participantData.isActive : true,
      joinedAt: new Date(),
      violations: participantData.violations || { tabSwitches: 0, copyPasteAttempts: 0 }
    };

    // Remove old registration for this user in this competition to avoid duplicates
    const filtered = participants.filter(
      p => !(p.competitionId === participantData.competitionId && p.userId === participantData.userId)
    );

    filtered.push(newParticipant);
    setLocalStorageItem('mindrift_competition_participants', JSON.stringify(filtered));

    // Update competition counter
    const competitions = await this.getCompetitions();
    const compIndex = competitions.findIndex(c => c.id === participantData.competitionId);
    if (compIndex !== -1) {
      competitions[compIndex].currentParticipants = filtered.filter(p => p.competitionId === participantData.competitionId).length;
      setLocalStorageItem('mindrift_competitions', JSON.stringify(competitions));
    }
  }
}

// Competition Specific Service Alias
export class CompetitionFirestoreService {
  static async getCompetition(competitionId: string): Promise<Competition | null> {
    seedData();
    const competitions = await FirestoreService.getCompetitions();
    const found = competitions.find(c => c.id === competitionId);
    return found || null;
  }

  static async addParticipant(participantData: any): Promise<void> {
    return FirestoreService.addParticipant(participantData);
  }
}
