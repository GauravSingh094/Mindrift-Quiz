package com.mindrift.quiz.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class PublishQuizRequest {

    @Size(max = 1000, message = "Change notes cannot exceed 1000 characters")
    private String changeNotes;
}
