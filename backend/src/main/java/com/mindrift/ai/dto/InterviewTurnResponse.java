package com.mindrift.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

import java.util.List;
import java.util.UUID;

/** Single question/evaluation/completion turn in interview */
@Value @Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class InterviewTurnResponse {
    UUID sessionId;
    Integer questionNumber;
    String question;
    String difficulty;
    Integer estimatedMinutes;
    Boolean isLastQuestion;

    // ─── Evaluation fields (for answer submission) ────────────────────────
    Integer answerScore;
    String answerFeedback;

    // ─── Completion fields ────────────────────────────────────────────────
    Boolean sessionCompleted;
    Double overallScore;
    Double technicalScore;
    Double communicationScore;
    Double problemSolvingScore;
    String finalFeedback;
    List<String> strengths;
    List<String> improvements;
    String readinessLevel;
}
