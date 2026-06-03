package com.mindrift.quiz.controller;

import com.mindrift.common.response.ApiResponse;
import com.mindrift.common.security.RequirePermission;
import com.mindrift.common.security.UserPrincipal;
import com.mindrift.quiz.dto.TagRequest;
import com.mindrift.quiz.dto.TagResponse;
import com.mindrift.quiz.service.TagService;
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
 * Tag REST Controller — /api/tags
 *
 * POST   /api/tags           → Create tag
 * GET    /api/tags           → List all (paginated)
 * GET    /api/tags/search    → Search by keyword
 * GET    /api/tags/{id}      → Get by ID
 * PUT    /api/tags/{id}      → Update
 * DELETE /api/tags/{id}      → Delete (guarded by quiz count)
 */
@Slf4j
@RestController
@RequestMapping("/api/tags")
@RequiredArgsConstructor
public class TagController {

    private final TagService tagService;
    private final UserRepository userRepository;

    @PostMapping
    @RequirePermission("quiz:create")
    public ResponseEntity<ApiResponse<TagResponse>> createTag(
            @Valid @RequestBody TagRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest http) {

        User actor = resolveUser(principal);
        TagResponse response = tagService.createTag(request, actor, getIp(http), getUa(http));
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Tag created successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<Page<TagResponse>>> getAllPaged(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size,
            @RequestParam(defaultValue = "name") String sortBy,
            @RequestParam(defaultValue = "asc") String sortDir) {

        Sort sort = sortDir.equalsIgnoreCase("desc")
                ? Sort.by(sortBy).descending() : Sort.by(sortBy).ascending();
        Pageable pageable = PageRequest.of(page, Math.min(size, 200), sort);
        return ResponseEntity.ok(ApiResponse.success("Tags retrieved", tagService.getAllPaged(pageable)));
    }

    @GetMapping("/search")
    public ResponseEntity<ApiResponse<List<TagResponse>>> searchTags(
            @RequestParam String keyword) {
        return ResponseEntity.ok(ApiResponse.success("Tag search results", tagService.searchTags(keyword)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<TagResponse>> getById(@PathVariable UUID id) {
        return ResponseEntity.ok(ApiResponse.success("Tag retrieved", tagService.getTagById(id)));
    }

    @PutMapping("/{id}")
    @RequirePermission("quiz:update")
    public ResponseEntity<ApiResponse<TagResponse>> updateTag(
            @PathVariable UUID id,
            @Valid @RequestBody TagRequest request,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest http) {

        User actor = resolveUser(principal);
        TagResponse response = tagService.updateTag(id, request, actor, getIp(http), getUa(http));
        return ResponseEntity.ok(ApiResponse.success("Tag updated successfully", response));
    }

    @DeleteMapping("/{id}")
    @RequirePermission("quiz:delete")
    public ResponseEntity<ApiResponse<Void>> deleteTag(
            @PathVariable UUID id,
            @AuthenticationPrincipal UserPrincipal principal,
            HttpServletRequest http) {

        User actor = resolveUser(principal);
        tagService.deleteTag(id, actor, getIp(http), getUa(http));
        return ResponseEntity.ok(ApiResponse.success("Tag deleted successfully"));
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
