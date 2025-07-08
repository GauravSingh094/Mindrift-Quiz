import { Quiz } from '@/lib/types';

export class QuizActivationService {
  private intervalId: NodeJS.Timeout | null = null;
  private quizzes: Quiz[] = [];
  public onQuizActivated: ((quiz: Quiz) => void) | null = null;

  constructor() {
    this.checkActivations = this.checkActivations.bind(this);
  }

  startMonitoring(quizzes: Quiz[]) {
    this.quizzes = quizzes;
    
    // Check immediately
    this.checkActivations();
    
    // Then check every 30 seconds
    this.intervalId = setInterval(this.checkActivations, 30000);
  }

  stopMonitoring() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private checkActivations() {
    const now = new Date();
    
    this.quizzes.forEach(quiz => {
      if (quiz.status === 'scheduled' && new Date(quiz.startTime) <= now) {
        // Quiz should be activated
        const activatedQuiz: Quiz = {
          ...quiz,
          status: 'active',
          isLive: true,
          updatedAt: now
        };
        
        // Simulate API call to update quiz status
        this.updateQuizStatus(activatedQuiz);
        
        // Notify callback
        if (this.onQuizActivated) {
          this.onQuizActivated(activatedQuiz);
        }
        
        console.log(`Quiz "${quiz.title}" has been automatically activated`);
      }
    });
  }

  private async updateQuizStatus(quiz: Quiz) {
    try {
      // In a real app, this would be an API call
      // await fetch(`/api/quizzes/${quiz.id}`, {
      //   method: 'PATCH',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ status: 'active', isLive: true })
      // });
      
      // For now, just simulate the API call
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Update local quiz data
      const index = this.quizzes.findIndex(q => q.id === quiz.id);
      if (index !== -1) {
        this.quizzes[index] = quiz;
      }
    } catch (error) {
      console.error('Failed to update quiz status:', error);
    }
  }

  // Method to manually activate a quiz (for testing)
  activateQuiz(quizId: string) {
    const quiz = this.quizzes.find(q => q.id === quizId);
    if (quiz && quiz.status === 'scheduled') {
      const activatedQuiz: Quiz = {
        ...quiz,
        status: 'active',
        isLive: true,
        updatedAt: new Date()
      };
      
      this.updateQuizStatus(activatedQuiz);
      
      if (this.onQuizActivated) {
        this.onQuizActivated(activatedQuiz);
      }
    }
  }

  // Get next activation time for UI display
  getNextActivation(): Date | null {
    const scheduledQuizzes = this.quizzes
      .filter(q => q.status === 'scheduled')
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    
    return scheduledQuizzes.length > 0 ? new Date(scheduledQuizzes[0].startTime) : null;
  }
}