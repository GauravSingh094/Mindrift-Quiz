package com.mindrift.quiz.dto;

import lombok.Builder;
import lombok.Getter;
import java.util.UUID;

@Getter
@Builder
public class CategoryResponse {
    private UUID id;
    private String name;
    private String slug;
    private String description;
    private String iconUrl;
    private UUID parentId;
    private String parentName;
    private Long quizCount;
}
