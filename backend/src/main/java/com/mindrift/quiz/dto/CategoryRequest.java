package com.mindrift.quiz.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Getter;
import lombok.Setter;
import java.util.UUID;

@Getter
@Setter
public class CategoryRequest {

    @NotBlank(message = "Category name is required")
    @Size(max = 100, message = "Category name cannot exceed 100 characters")
    private String name;

    @NotBlank(message = "Slug is required")
    @Size(max = 100, message = "Slug cannot exceed 100 characters")
    private String slug;

    @Size(max = 2000, message = "Description cannot exceed 2000 characters")
    private String description;

    private String iconUrl;

    private UUID parentId;
}
