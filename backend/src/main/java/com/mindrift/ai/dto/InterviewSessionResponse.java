package com.mindrift.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.UUID;

@Value @Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class InterviewSessionResponse {
    UUID sessionId;
    String topic;
    String roleTitle;
    String experienceLevel;
    Integer totalQuestions;
    Integer currentQuestion;
    String status;
    InterviewTurnResponse firstQuestion;
    Instant startedAt;
}
