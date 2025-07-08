import { 
  RegisteredParticipant, 
  KickedUser, 
  LiveParticipant, 
  CompetitionLeaderboard,
  Quiz 
} from './types';

// Mock data for registered participants (in production, this would come from your database)
const registeredParticipants: RegisteredParticipant[] = [
  {
    id: 'participant-1',
    name: 'John Doe',
    email: 'john.doe@university.edu',
    rollNumber: 'CS2021001',
    registeredAt: new Date(),
    quizId: 'competition-quiz-1'
  },
  {
    id: 'participant-2',
    name: 'Jane Smith',
    email: 'jane.smith@university.edu',
    rollNumber: 'CS2021002',
    registeredAt: new Date(),
    quizId: 'competition-quiz-1'
  },
  {
    id: 'participant-3',
    name: 'Mike Johnson',
    email: 'mike.johnson@university.edu',
    rollNumber: 'CS2021003',
    registeredAt: new Date(),
    quizId: 'competition-quiz-1'
  },
  // Add more participants as needed
];

// In-memory storage for kicked users (in production, use Firebase/database)
const kickedUsers: Map<string, KickedUser> = new Map();

// In-memory storage for live participants (in production, use Firebase Realtime DB)
const liveParticipants: Map<string, LiveParticipant> = new Map();

// In-memory storage for competition leaderboard (in production, use Firebase Realtime DB)
const competitionLeaderboard: Map<string, CompetitionLeaderboard> = new Map();

export class CompetitionService {
  // Check if user is registered for the competition
  static isUserRegistered(email: string, quizId: string): RegisteredParticipant | null {
    return registeredParticipants.find(
      p => p.email.toLowerCase() === email.toLowerCase() && p.quizId === quizId
    ) || null;
  }

  // Check if user is currently kicked and within 30-minute block period
  static isUserKicked(userId: string, quizId: string): { isKicked: boolean; timeRemaining?: number } {
    const kickKey = `${quizId}-${userId}`;
    const kickedUser = kickedUsers.get(kickKey);
    
    if (!kickedUser) {
      return { isKicked: false };
    }

    const now = new Date();
    const kickTime = new Date(kickedUser.kickedAt);
    const timeDiff = now.getTime() - kickTime.getTime();
    const thirtyMinutes = 30 * 60 * 1000; // 30 minutes in milliseconds

    if (timeDiff < thirtyMinutes) {
      const timeRemaining = Math.ceil((thirtyMinutes - timeDiff) / (60 * 1000)); // minutes remaining
      return { isKicked: true, timeRemaining };
    } else {
      // Remove expired kick
      kickedUsers.delete(kickKey);
      return { isKicked: false };
    }
  }

  // Validate if user can join competition
  static validateCompetitionAccess(
    userEmail: string, 
    userId: string, 
    quiz: Quiz
  ): { canJoin: boolean; error?: string } {
    // Check if it's a competition quiz
    if (!quiz.isCompetition) {
      return { canJoin: true }; // Regular quiz, no restrictions
    }

    // Check if user is registered
    const registeredUser = this.isUserRegistered(userEmail, quiz.id);
    if (!registeredUser) {
      return { 
        canJoin: false, 
        error: 'You are not authorized to join this quiz. Only pre-registered participants can join.' 
      };
    }

    // Check if user is kicked
    const kickStatus = this.isUserKicked(userId, quiz.id);
    if (kickStatus.isKicked) {
      return { 
        canJoin: false, 
        error: `You've been removed from this quiz. Try again after ${kickStatus.timeRemaining} minutes.` 
      };
    }

    // Check quiz status
    if (quiz.status !== 'active' && quiz.status !== 'live') {
      return { 
        canJoin: false, 
        error: 'This quiz is not currently active.' 
      };
    }

    return { canJoin: true };
  }

  // Kick user from competition
  static kickUser(userId: string, quizId: string, kickedBy: string, reason?: string): boolean {
    try {
      const kickKey = `${quizId}-${userId}`;
      const kickedUser: KickedUser = {
        userId,
        quizId,
        kickedAt: new Date(),
        kickedBy,
        reason
      };

      kickedUsers.set(kickKey, kickedUser);
      
      // Remove from live participants
      const participantKey = `${quizId}-${userId}`;
      liveParticipants.delete(participantKey);

      // In production, you would also:
      // 1. Update Firebase Realtime DB
      // 2. Send real-time notification to kick the user
      // 3. Log the action for audit purposes

      return true;
    } catch (error) {
      console.error('Error kicking user:', error);
      return false;
    }
  }

  // Add participant to live tracking
  static addLiveParticipant(participant: LiveParticipant): void {
    const key = `${participant.userId}`;
    liveParticipants.set(key, participant);
  }

  // Update participant score
  static updateParticipantScore(userId: string, quizId: string, score: number, questionsAnswered: number): void {
    const key = `${userId}`;
    const participant = liveParticipants.get(key);
    
    if (participant) {
      participant.currentScore = score;
      participant.questionsAnswered = questionsAnswered;
      liveParticipants.set(key, participant);
    }

    // Update leaderboard
    this.updateLeaderboard(userId, quizId, score, 0); // timeSpent would be calculated properly
  }

  // Update competition leaderboard
  static updateLeaderboard(userId: string, quizId: string, score: number, timeSpent: number): void {
    const participant = liveParticipants.get(userId);
    if (!participant) return;

    const leaderboardEntry: CompetitionLeaderboard = {
      userId,
      name: participant.name,
      score,
      timeSpent,
      rank: 0, // Will be calculated when getting leaderboard
      updatedAt: new Date()
    };

    competitionLeaderboard.set(userId, leaderboardEntry);
  }

  // Get live participants for admin dashboard
  static getLiveParticipants(quizId: string): LiveParticipant[] {
    return Array.from(liveParticipants.values())
      .filter(p => p.isActive)
      .sort((a, b) => b.currentScore - a.currentScore);
  }

  // Get competition leaderboard with rankings
  static getCompetitionLeaderboard(quizId: string): CompetitionLeaderboard[] {
    const entries = Array.from(competitionLeaderboard.values())
      .sort((a, b) => {
        // Sort by score (desc), then by time (asc)
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return a.timeSpent - b.timeSpent;
      });

    // Assign ranks
    entries.forEach((entry, index) => {
      entry.rank = index + 1;
    });

    return entries;
  }

  // Get registered participants for a quiz
  static getRegisteredParticipants(quizId: string): RegisteredParticipant[] {
    return registeredParticipants.filter(p => p.quizId === quizId);
  }

  // Get kicked users for admin view
  static getKickedUsers(quizId: string): KickedUser[] {
    return Array.from(kickedUsers.values())
      .filter(k => k.quizId === quizId);
  }

  // Remove participant (when they leave)
  static removeParticipant(userId: string): void {
    const participant = liveParticipants.get(userId);
    if (participant) {
      participant.isActive = false;
      liveParticipants.set(userId, participant);
    }
  }

  // Check if quiz is a competition
  static isCompetitionQuiz(quiz: Quiz): boolean {
    return quiz.isCompetition === true;
  }
}