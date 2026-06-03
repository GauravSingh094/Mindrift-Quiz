package com.mindrift.quiz.dto;

import com.mindrift.quiz.entity.QuestionType;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class BulkQuestionsRequest {

    @NotEmpty(message = "Questions list cannot be empty")
    @Valid
    private List<QuestionItem> questions;

    @Getter
    @Setter
    public static class QuestionItem {

        @NotNull(message = "Question type is required")
        private QuestionType type;

        @NotBlank(message = "Question text is required")
        private String questionText;

        private String explanation;

        @NotNull(message = "Points is required")
        private Integer points;

        @NotNull(message = "OrderIndex is required")
        private Integer orderIndex;

        @Valid
        private List<OptionItem> options;
    }

    @Getter
    @Setter
    public static class OptionItem {

        @NotBlank(message = "Option text is required")
        private String optionText;

        @NotNull(message = "isCorrect is required")
        private Boolean isCorrect;

        @NotNull(message = "OrderIndex is required")
        private Integer orderIndex;
    }
}
