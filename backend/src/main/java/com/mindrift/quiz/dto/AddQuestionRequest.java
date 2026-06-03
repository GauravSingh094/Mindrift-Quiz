package com.mindrift.quiz.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.*;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class AddQuestionRequest {

    @NotNull(message = "Question type is required")
    private com.mindrift.quiz.entity.QuestionType type;

    @NotBlank(message = "Question text is required")
    @Size(max = 2000, message = "Question text cannot exceed 2000 characters")
    private String questionText;

    @Size(max = 2000, message = "Explanation cannot exceed 2000 characters")
    private String explanation;

    @NotNull(message = "Points is required")
    @Min(value = 1, message = "Points must be at least 1")
    @Max(value = 100, message = "Points cannot exceed 100")
    private Integer points;

    @NotNull(message = "Order index is required")
    @Min(value = 0, message = "Order index must be non-negative")
    private Integer orderIndex;

    @Valid
    @NotEmpty(message = "Options cannot be empty")
    private List<OptionRequest> options;

    @Getter
    @Setter
    public static class OptionRequest {

        @NotBlank(message = "Option text is required")
        @Size(max = 1000, message = "Option text cannot exceed 1000 characters")
        private String optionText;

        @NotNull(message = "isCorrect is required")
        private Boolean isCorrect;

        @NotNull(message = "Order index is required")
        @Min(value = 0, message = "Order index must be non-negative")
        private Integer orderIndex;
    }
}
