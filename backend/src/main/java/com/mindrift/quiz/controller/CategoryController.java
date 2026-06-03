package com.mindrift.quiz.controller;

import com.mindrift.common.response.ApiResponse;
import com.mindrift.common.security.RequirePermission;
import com.mindrift.common.security.UserPrincipal;
import com.mindrift.quiz.dto.CategoryRequest;
import com.mindrift.quiz.dto.CategoryResponse;
import com.mindrift.quiz.service.CategoryService;
import com.mindrift.user.entity.User;
import com.mindrift.user.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Category REST Controller — /api/categories
 *
 * POST   /api/categories             → Create category
 * GET    /api/categories             → List all (paginated)
 * GET    /api/categories/top-level   → Top-level categories only
 * GET    /api/categories/{id}        → Get by ID
 * GET    /api/categories/{id}/children → Sub-categories
 * PUT    /api/categories/{id}        → Update
 * DELETE /api/categories/{id}        → Delete (guarded by quiz count)
 */
@Slf4j
@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryService categoryService;
    private final UserRepository userRepository;

    @PostMapping
    @RequirePermission("quiz:create")
    public ResponseEntity<ApiResponse<CategoryResponse>> createCategory(
            @Valid @RequestBody CategoryRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest http) {

        User actor = resolveUser(principal);
        CategoryResponse response = categoryService.createCategory(request, actor, getIp(http), getUa(http));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Category created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<CategoryResponse>>> getAllPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, Math.min(size, 200), sort);
        return ResponseEntity.ok(ApiResponse.success("Categories retrieved", categoryService.getAllPaged(pageable)));
    }

    @GetMapping("/top-level")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getTopLevel() {
        return ResponseEntity.ok(ApiResponse.success("Top-level categories retrieved", categoryService.getAllTopLevel()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<CategoryResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Category retrieved", categoryService.getCategoryById(id)));
    }

    @GetMapping("/{id}/children")
    public ResponseEntity<ApiResponse<List<CategoryResponse>>> getChildren(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Sub-categories retrieved", categoryService.getChildren(id)));
    }

    @PutMapping("/{id}")
    @RequirePermission("quiz:update")
    public ResponseEntity<ApiResponse<CategoryResponse>> updateCategory(
            @PathVariable UUID id,
            @Valid @RequestBody CategoryRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest http) {

        User actor = resolveUser(principal);
        CategoryResponse response = categoryService.updateCategory(id, request, actor, getIp(http), getUa(http));
        return ResponseEntity.ok(ApiResponse.success("Category updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("quiz:delete")
    public ResponseEntity<ApiResponse<Void>> deleteCategory(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest http) {

        User actor = resolveUser(principal);
        categoryService.deleteCategory(id, actor, getIp(http), getUa(http));
        return ResponseEntity.ok(ApiResponse.success("Category deleted successfully"));
    }

    private User resolveUser(UserPrincipal principal) {
        return userRepository.findById(principal.getId())
                .orElseThrow(() -> new com.mindrift.common.exception.ResourceNotFoundException("User not found"));
    }

    private String getIp(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        return (ip == null || ip.isBlank()) ? request.getRemoteAddr() : ip.split(",")[0].trim();
    }

    private String getUa(HttpServletRequest request) {
        return request.getHeader("User-Agent");
    }
}
