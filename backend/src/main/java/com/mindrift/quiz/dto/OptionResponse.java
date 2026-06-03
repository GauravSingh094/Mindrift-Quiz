package com.mindrift.quiz.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.UUID;

@Getter
@Builder
public class OptionResponse {
    private UUID id;
    private String optionText;
    private Boolean isCorrect;
    private Integer orderIndex;
}
