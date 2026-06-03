package com.mindrift.quiz.service;

import com.mindrift.common.base.AuditService;
import com.mindrift.common.exception.BaseMindriftException;
import com.mindrift.common.exception.ErrorCode;
import com.mindrift.common.exception.MindriftException;
import com.mindrift.common.exception.ResourceNotFoundException;
import com.mindrift.quiz.dto.CategoryRequest;
import com.mindrift.quiz.dto.CategoryResponse;
import com.mindrift.quiz.entity.Category;
import com.mindrift.quiz.repository.CategoryRepository;
import com.mindrift.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final AuditService auditService;

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request, User actor,
                                           String ipAddress, String userAgent) {
        log.info("Creating category '{}' by user {}", request.getName(), actor.getId());

        if (categoryRepository.existsBySlug(request.getSlug())) {
            throw new MindriftException(
                    "Category slug '" + request.getSlug() + "' is already in use.", ErrorCode.DUPLICATE_RESOURCE);
        }

        Category category = new Category();
        category.setName(request.getName());
        category.setSlug(request.getSlug().toLowerCase().trim());
        category.setDescription(request.getDescription());
        category.setIconUrl(request.getIconUrl());

        if (request.getParentId() != null) {
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found: " + request.getParentId()));
            category.setParent(parent);
        }

        Category saved = categoryRepository.save(category);
        auditService.logAction(actor, "CATEGORY_CREATED",
                Map.of("categoryId", saved.getId().toString(), "slug", saved.getSlug()),
                ipAddress, userAgent);

        return mapToResponse(saved, 0L);
    }

    @Transactional
    @CacheEvict(value = "categories", key = "#id")
    public CategoryResponse updateCategory(UUID id, CategoryRequest request, User actor,
                                           String ipAddress, String userAgent) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));

        if (categoryRepository.existsBySlugAndIdNot(request.getSlug(), id)) {
            throw new MindriftException(
                    "Category slug '" + request.getSlug() + "' is already in use.", ErrorCode.DUPLICATE_RESOURCE);
        }

        category.setName(request.getName());
        category.setSlug(request.getSlug().toLowerCase().trim());
        category.setDescription(request.getDescription());
        category.setIconUrl(request.getIconUrl());

        if (request.getParentId() != null) {
            if (request.getParentId().equals(id)) {
                throw new MindriftException("Category cannot be its own parent.", ErrorCode.INVALID_STATE);
            }
            Category parent = categoryRepository.findById(request.getParentId())
                    .orElseThrow(() -> new ResourceNotFoundException("Parent category not found: " + request.getParentId()));
            category.setParent(parent);
        } else {
            category.setParent(null);
        }

        Category saved = categoryRepository.save(category);
        auditService.logAction(actor, "CATEGORY_UPDATED",
                Map.of("categoryId", id.toString()), ipAddress, userAgent);

        long quizCount = categoryRepository.countQuizzesByCategoryId(id);
        return mapToResponse(saved, quizCount);
    }

    @Transactional
    @CacheEvict(value = "categories", key = "#id")
    public void deleteCategory(UUID id, User actor, String ipAddress, String userAgent) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));

        long quizCount = categoryRepository.countQuizzesByCategoryId(id);
        if (quizCount > 0) {
            throw new MindriftException(
                    "Cannot delete category '" + category.getName() + "': it has " + quizCount + " active quizzes.",
                    ErrorCode.INVALID_STATE);
        }

        categoryRepository.delete(category);
        auditService.logAction(actor, "CATEGORY_DELETED",
                Map.of("categoryId", id.toString(), "name", category.getName()), ipAddress, userAgent);
    }

    @Transactional(readOnly = true)
    @Cacheable(value = "categories", key = "#id")
    public CategoryResponse getCategoryById(UUID id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + id));
        long quizCount = categoryRepository.countQuizzesByCategoryId(id);
        return mapToResponse(category, quizCount);
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getAllTopLevel() {
        return categoryRepository.findByParentIsNull().stream()
                .map(c -> mapToResponse(c, categoryRepository.countQuizzesByCategoryId(c.getId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> getChildren(UUID parentId) {
        return categoryRepository.findByParentId(parentId).stream()
                .map(c -> mapToResponse(c, categoryRepository.countQuizzesByCategoryId(c.getId())))
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public Page<CategoryResponse> getAllPaged(Pageable pageable) {
        return categoryRepository.findAll(pageable)
                .map(c -> mapToResponse(c, categoryRepository.countQuizzesByCategoryId(c.getId())));
    }

    private CategoryResponse mapToResponse(Category category, long quizCount) {
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .slug(category.getSlug())
                .description(category.getDescription())
                .iconUrl(category.getIconUrl())
                .parentId(category.getParent() != null ? category.getParent().getId() : null)
                .parentName(category.getParent() != null ? category.getParent().getName() : null)
                .quizCount(quizCount)
                .build();
    }
}
