package com.mindrift.quiz.dto;

import com.mindrift.quiz.entity.QuizAttemptStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

/**
 * Rich result scorecard returned after attempt submission or retrieval.
 */
@Getter
@Builder
public class QuizResultResponse {

    private UUID attemptId;
    private UUID quizId;
    private String quizTitle;

    private Double score;
    private Double totalScore;
    private Double percentage;
    private Boolean passed;
    private Double passingScoreThreshold;

    private Integer correctAnswersCount;
    private Integer incorrectAnswersCount;
    private Integer unansweredCount;
    private Integer totalQuestions;

    private Long timeTakenSeconds;
    private Instant submittedAt;
    private QuizAttemptStatus status;

    /** Detailed per-question breakdown */
    private List<QuestionBreakdown> breakdown;

    @Getter
    @Builder
    public static class QuestionBreakdown {
        private UUID questionId;
        private String questionText;
        private String questionType;
        private Boolean isCorrect;
        private Boolean isPartial;
        private String scoreType;
        private Double pointsEarned;
        private Double maxPoints;
        private List<String> selectedOptionIds;
        private List<String> correctOptionIds;
        private String explanation;
    }
}
