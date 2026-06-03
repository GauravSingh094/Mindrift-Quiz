package com.mindrift.quiz.service;

import com.mindrift.common.base.AuditService;
import com.mindrift.common.exception.BaseMindriftException;
import com.mindrift.common.exception.ErrorCode;
import com.mindrift.common.exception.MindriftException;
import com.mindrift.common.exception.ResourceNotFoundException;
import com.mindrift.quiz.dto.TagRequest;
import com.mindrift.quiz.dto.TagResponse;
import com.mindrift.quiz.entity.Tag;
import com.mindrift.quiz.repository.TagRepository;
import com.mindrift.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
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
public class TagService {

    private final TagRepository tagRepository;
    private final AuditService auditService;

    @Transactional
    public TagResponse createTag(TagRequest request, User actor, String ipAddress, String userAgent) {
        log.info("Creating tag '{}' by user {}", request.getName(), actor.getId());

        if (tagRepository.existsByName(request.getName().trim())) {
            throw new MindriftException(
                    "Tag '" + request.getName() + "' already exists.", ErrorCode.DUPLICATE_RESOURCE);
        }

        Tag tag = new Tag();
        tag.setName(request.getName().trim());
        tag.setDescription(request.getDescription());

        Tag saved = tagRepository.save(tag);
        auditService.logAction(actor, "TAG_CREATED",
                Map.of("tagId", saved.getId().toString(), "name", saved.getName()),
                ipAddress, userAgent);

        return mapToResponse(saved, 0L);
    }

    @Transactional
    public TagResponse updateTag(UUID id, TagRequest request, User actor,
                                 String ipAddress, String userAgent) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found: " + id));

        if (tagRepository.existsByNameAndIdNot(request.getName().trim(), id)) {
            throw new MindriftException(
                    "Tag name '" + request.getName() + "' is already in use.", ErrorCode.DUPLICATE_RESOURCE);
        }

        tag.setName(request.getName().trim());
        tag.setDescription(request.getDescription());

        Tag saved = tagRepository.save(tag);
        auditService.logAction(actor, "TAG_UPDATED",
                Map.of("tagId", id.toString()), ipAddress, userAgent);

        long quizCount = tagRepository.countQuizzesByTagId(id);
        return mapToResponse(saved, quizCount);
    }

    @Transactional
    public void deleteTag(UUID id, User actor, String ipAddress, String userAgent) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found: " + id));

        long quizCount = tagRepository.countQuizzesByTagId(id);
        if (quizCount > 0) {
            throw new MindriftException(
                    "Cannot delete tag '" + tag.getName() + "': it is used by " + quizCount + " active quizzes.",
                    ErrorCode.INVALID_STATE);
        }

        tagRepository.delete(tag);
        auditService.logAction(actor, "TAG_DELETED",
                Map.of("tagId", id.toString(), "name", tag.getName()), ipAddress, userAgent);
    }

    @Transactional(readOnly = true)
    public TagResponse getTagById(UUID id) {
        Tag tag = tagRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Tag not found: " + id));
        long quizCount = tagRepository.countQuizzesByTagId(id);
        return mapToResponse(tag, quizCount);
    }

    @Transactional(readOnly = true)
    public Page<TagResponse> getAllPaged(Pageable pageable) {
        return tagRepository.findAll(pageable)
                .map(t -> mapToResponse(t, tagRepository.countQuizzesByTagId(t.getId())));
    }

    @Transactional(readOnly = true)
    public List<TagResponse> searchTags(String keyword) {
        return tagRepository.findByNameContainingIgnoreCase(keyword).stream()
                .map(t -> mapToResponse(t, tagRepository.countQuizzesByTagId(t.getId())))
                .collect(Collectors.toList());
    }

    private TagResponse mapToResponse(Tag tag, long quizCount) {
        return TagResponse.builder()
                .id(tag.getId())
                .name(tag.getName())
                .description(tag.getDescription())
                .quizCount(quizCount)
                .build();
    }
}
