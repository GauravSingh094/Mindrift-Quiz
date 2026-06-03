package com.mindrift.quiz.dto;

import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.UUID;

@Getter
@Builder
public class QuizVersionResponse {
    private UUID id;
    private UUID quizId;
    private String quizTitle;
    private Integer version;
    private Object snapshot;
    private String createdBy;
    private String changeNotes;
    private Instant createdAt;
}
