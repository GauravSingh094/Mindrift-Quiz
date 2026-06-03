import { useCompetitionStore } from "../store/competition-store";
import { CompetitionParticipant } from "../types";

export class CompetitionWebSocketService {
  private static socket: WebSocket | null = null;
  private static emulatorInterval: NodeJS.Timeout | null = null;
  private static mockNames = ["Sarah Connor", "Gaurav Singh", "Alex Mercer", "Ford Prefect", "Trillian Astra", "Zaphod Beeblebrox"];

  static connect(competitionId: string, userId: string, userName: string) {
    const store = useCompetitionStore.getState();
    if (store.socketConnected) return;

    console.log(`🔌 Initializing WebSocket connection to competition lobby: ${competitionId}...`);
    
    // Simulate real socket handshakes
    store.setSocketConnected(true);
    store.addAnnouncement("📡 Connection to live proctor systems established.");

    // Start emulated live participant activity loop (Tasks 6, 9, 10, 11)
    // Simulates other participants submitting answers, updating scores, and triggering leaderboard shuffles in real-time!
    let tickCount = 0;
    this.emulatorInterval = setInterval(() => {
      tickCount += 1;
      const currentStore = useCompetitionStore.getState();
      
      // Every 12 seconds, simulate a new announcement
      if (tickCount % 4 === 0) {
        const announcement = `📢 System Broadcast: User '${this.mockNames[tickCount % this.mockNames.length]}' just finished 5 questions.`;
        currentStore.addAnnouncement(announcement);
      }

      // Simulate leaderboard movements
      const baseRoster: CompetitionParticipant[] = [
        { userId: "1", name: "Sarah Connor", score: 950 + Math.floor(Math.random() * 50), questionsAnswered: 10, rank: 1, timeSpentSeconds: 240 + Math.floor(Math.random() * 10), isActive: true },
        { userId: "2", name: "Gaurav Singh", score: 880 + Math.floor(Math.random() * 80), questionsAnswered: 9, rank: 2, timeSpentSeconds: 260 + Math.floor(Math.random() * 10), isActive: true },
        { userId: "3", name: "Alex Mercer", score: 850 + Math.floor(Math.random() * 100), questionsAnswered: 9, rank: 3, timeSpentSeconds: 280 + Math.floor(Math.random() * 10), isActive: true },
        { userId: "user_demo", name: `${userName} (You)`, score: 920 + Math.floor(Math.random() * 30), questionsAnswered: 10, rank: 2, timeSpentSeconds: 250, isActive: true },
      ];

      currentStore.setLeaderboard(baseRoster);
    }, 3500);
  }

  static sendScoreUpdate(userId: string, score: number, questionsAnswered: number, timeSpent: number) {
    console.log(`📤 WS Score Update: User ${userId} -> ${score} XP (${questionsAnswered} answered)`);
    // In production, this would stringify and send over the WS connection:
    // this.socket?.send(JSON.stringify({ type: "SCORE_UPDATE", userId, score, questionsAnswered, timeSpent }));
  }

  static broadcastIntegrityWarning(userId: string, userName: string, violation: string) {
    console.warn(`🚨 WS Integrity violation: User ${userName} (${userId}) flagged for: ${violation}`);
    // In production:
    // this.socket?.send(JSON.stringify({ type: "INTEGRITY_VIOLATION", userId, userName, violation }));
  }

  static disconnect() {
    console.log("🔌 Disconnecting WebSocket from competition lobbies.");
    if (this.emulatorInterval) {
      clearInterval(this.emulatorInterval);
      this.emulatorInterval = null;
    }
    useCompetitionStore.getState().setSocketConnected(false);
  }
}

export default CompetitionWebSocketService;
