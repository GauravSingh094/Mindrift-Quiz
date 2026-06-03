package com.mindrift.quiz.dto;

import com.mindrift.quiz.entity.QuizDifficulty;
import com.mindrift.quiz.entity.QuizStatus;
import com.mindrift.quiz.entity.QuizVisibility;
import lombok.Builder;
import lombok.Getter;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

@Getter
@Builder
public class QuizResponse {
    private UUID id;
    private String title;
    private String description;
    private UUID creatorId;
    private String creatorUsername;
    private UUID categoryId;
    private String categoryName;
    private QuizDifficulty difficulty;
    private QuizStatus status;
    private Integer estimatedDuration;
    private Double passingScore;
    private QuizVisibility visibility;
    private Integer quizVersion;
    private Set<String> tags;
    private List<QuestionResponse> questions;
    private Integer questionCount;
    private Instant publishedAt;
    private Instant archivedAt;
    private Instant createdAt;
    private Instant updatedAt;
}
