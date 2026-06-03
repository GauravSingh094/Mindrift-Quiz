package com.mindrift.quiz.dto;

import lombok.Builder;
import lombok.Getter;
import java.util.UUID;

@Getter
@Builder
public class TagResponse {
    private UUID id;
    private String name;
    private String description;
    private Long quizCount;
}
