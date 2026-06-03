package com.mindrift.quiz.dto;

import lombok.Builder;
import lombok.Getter;

import java.util.List;
import java.util.UUID;

@Getter
@Builder
public class QuestionResponse {
    private UUID id;
    private com.mindrift.quiz.entity.QuestionType type;
    private String questionText;
    private String explanation;
    private Integer points;
    private Integer orderIndex;
    private List<OptionResponse> options;
}
