package com.mindrift.quiz.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;
import java.util.UUID;

/**
 * Request for saving a single question answer during an attempt.
 * selectedOptionIds may be empty list (to represent deliberate skip/clear).
 */
@Getter
@Setter
public class SaveAnswerRequest {

    @NotNull(message = "Question ID is required")
    private UUID questionId;

    /** Empty list = clear/skip; non-null list of option UUID strings */
    @NotNull(message = "Selected option IDs must be present (use empty list to clear)")
    private List<String> selectedOptionIds;

    /** Client-reported time spent on this question in milliseconds */
    private Long timeSpentMs;
}
