package com.mindrift.quiz.dto;

import com.mindrift.quiz.entity.QuizDifficulty;
import com.mindrift.quiz.entity.QuizVisibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import java.util.Set;
import java.util.UUID;

@Getter
@Setter
public class CreateQuizRequest {

    @NotBlank(message = "Title is required")
    @Size(max = 150, message = "Title cannot exceed 150 characters")
    private String title;

    private String description;

    @NotNull(message = "CategoryId is required")
    private UUID categoryId;

    @NotNull(message = "Difficulty is required")
    private QuizDifficulty difficulty;

    @NotNull(message = "Estimated duration is required")
    private Integer estimatedDuration;

    @NotNull(message = "Passing score is required")
    private Double passingScore;

    @NotNull(message = "Visibility is required")
    private QuizVisibility visibility;

    private Set<String> tags;
}
