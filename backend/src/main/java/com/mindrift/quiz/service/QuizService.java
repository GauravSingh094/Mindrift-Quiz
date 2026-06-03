package com.mindrift.quiz.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindrift.common.base.AuditService;
import com.mindrift.common.exception.BaseMindriftException;
import com.mindrift.common.exception.ErrorCode;
import com.mindrift.common.exception.MindriftException;
import com.mindrift.common.exception.ResourceNotFoundException;
import com.mindrift.common.security.RequirePermission;
import com.mindrift.quiz.dto.*;
import com.mindrift.quiz.entity.*;
import com.mindrift.quiz.repository.*;
import com.mindrift.user.entity.User;
import com.mindrift.user.entity.UserRole;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class QuizService {

    private final QuizRepository quizRepository;
    private final CategoryRepository categoryRepository;
    private final TagRepository tagRepository;
    private final QuizVersionRepository quizVersionRepository;
    private final AuditService auditService;
    private final ObjectMapper objectMapper;

    // ─────────────────────────────────────────────────────────────────
    //  CREATE
    // ─────────────────────────────────────────────────────────────────

    @Transactional
    public QuizResponse createQuiz(CreateQuizRequest request, User creator,
                                   String ipAddress, String userAgent) {
        log.info("Creating quiz '{}' for creator {}", request.getTitle(), creator.getId());

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + request.getCategoryId()));

        Quiz quiz = new Quiz();
        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setCreator(creator);
        quiz.setCategory(category);
        quiz.setDifficulty(request.getDifficulty());
        quiz.setEstimatedDuration(request.getEstimatedDuration());
        quiz.setPassingScore(request.getPassingScore());
        quiz.setVisibility(request.getVisibility());
        quiz.setStatus(QuizStatus.DRAFT);
        quiz.setQuizVersion(1);

        resolveAndSetTags(request.getTags(), quiz);

        Quiz saved = quizRepository.save(quiz);
        auditService.logAction(creator, "QUIZ_CREATED",
                Map.of("quizId", saved.getId().toString(), "title", saved.getTitle()),
                ipAddress, userAgent);

        log.info("Quiz created with id {}", saved.getId());
        return mapToResponse(saved, false);
    }

    // ─────────────────────────────────────────────────────────────────
    //  UPDATE
    // ─────────────────────────────────────────────────────────────────

    @Transactional
    @CacheEvict(value = "quizzes", key = "#id")
    public QuizResponse updateQuiz(UUID id, UpdateQuizRequest request, User editor,
                                   String ipAddress, String userAgent) {
        log.info("Updating quiz {} by user {}", id, editor.getId());

        Quiz quiz = findActiveQuizOrThrow(id);
        assertNotPublished(quiz, "update");
        assertOwnerOrAdmin(quiz, editor, "update");

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Category not found: " + request.getCategoryId()));

        quiz.setTitle(request.getTitle());
        quiz.setDescription(request.getDescription());
        quiz.setCategory(category);
        quiz.setDifficulty(request.getDifficulty());
        quiz.setEstimatedDuration(request.getEstimatedDuration());
        quiz.setPassingScore(request.getPassingScore());
        quiz.setVisibility(request.getVisibility());

        resolveAndSetTags(request.getTags(), quiz);

        Quiz saved = quizRepository.save(quiz);
        auditService.logAction(editor, "QUIZ_UPDATED",
                Map.of("quizId", saved.getId().toString()), ipAddress, userAgent);

        return mapToResponse(saved, false);
    }

    // ─────────────────────────────────────────────────────────────────
    //  SOFT DELETE
    // ─────────────────────────────────────────────────────────────────

    @Transactional
    @CacheEvict(value = "quizzes", key = "#id")
    public void deleteQuiz(UUID id, User actor, String ipAddress, String userAgent) {
        log.info("Soft-deleting quiz {} by user {}", id, actor.getId());

        Quiz quiz = findActiveQuizOrThrow(id);
        assertOwnerOrAdmin(quiz, actor, "delete");

        if (quiz.getStatus() == QuizStatus.PUBLISHED) {
            throw new MindriftException(
                    "Published quizzes cannot be deleted. Archive it first.", ErrorCode.INVALID_STATE);
        }

        quizRepository.softDeleteById(id, Instant.now());
        auditService.logAction(actor, "QUIZ_DELETED",
                Map.of("quizId", id.toString(), "title", quiz.getTitle()), ipAddress, userAgent);

        log.info("Quiz {} soft-deleted successfully", id);
    }

    // ─────────────────────────────────────────────────────────────────
    //  PUBLISH
    // ─────────────────────────────────────────────────────────────────

    @Transactional
    @CacheEvict(value = "quizzes", key = "#id")
    public QuizResponse publishQuiz(UUID id, PublishQuizRequest request, User actor,
                                    String ipAddress, String userAgent) {
        log.info("Publishing quiz {} by user {}", id, actor.getId());

        Quiz quiz = findActiveQuizOrThrow(id);

        if (quiz.getStatus() == QuizStatus.PUBLISHED) {
            throw new MindriftException("Quiz is already published.", ErrorCode.INVALID_STATE);
        }
        if (quiz.getStatus() == QuizStatus.ARCHIVED) {
            throw new MindriftException("Archived quizzes cannot be published. Create a new draft.", ErrorCode.INVALID_STATE);
        }
        if (quiz.getQuestions() == null || quiz.getQuestions().isEmpty()) {
            throw new MindriftException("A quiz must have at least one question before publishing.", ErrorCode.INVALID_STATE);
        }

        // Validate every question has at least one correct answer
        for (Question q : quiz.getQuestions()) {
            boolean hasCorrect = q.getOptions().stream().anyMatch(QuestionOption::getIsCorrect);
            if (!hasCorrect) {
                throw new MindriftException(
                        "Question '" + q.getQuestionText() + "' has no correct option configured.",
                        ErrorCode.INVALID_STATE);
            }
            // Multi-select must have ≥2 correct answers
            if (q.getType() == QuestionType.MULTI_SELECT) {
                long correctCount = q.getOptions().stream().filter(QuestionOption::getIsCorrect).count();
                if (correctCount < 2) {
                    throw new MindriftException(
                            "MULTI_SELECT question '" + q.getQuestionText() + "' must have at least 2 correct options.",
                            ErrorCode.INVALID_STATE);
                }
            }
            // True/False must have exactly 2 options
            if (q.getType() == QuestionType.TRUE_FALSE && q.getOptions().size() != 2) {
                throw new MindriftException(
                        "TRUE_FALSE question '" + q.getQuestionText() + "' must have exactly 2 options.",
                        ErrorCode.INVALID_STATE);
            }
        }

        // Snapshot the current state for version history
        captureVersionSnapshot(quiz, actor.getEmail(),
                request.getChangeNotes() != null ? request.getChangeNotes() : "Published");

        quiz.setStatus(QuizStatus.PUBLISHED);
        quiz.setPublishedAt(Instant.now());
        quiz.setQuizVersion(quiz.getQuizVersion() + 1);

        Quiz saved = quizRepository.save(quiz);
        auditService.logAction(actor, "QUIZ_PUBLISHED",
                Map.of("quizId", saved.getId().toString(), "version", saved.getQuizVersion().toString()),
                ipAddress, userAgent);

        log.info("Quiz {} published at version {}", id, saved.getQuizVersion());
        return mapToResponse(saved, true);
    }

    // ─────────────────────────────────────────────────────────────────
    //  ARCHIVE
    // ─────────────────────────────────────────────────────────────────

    @Transactional
    @CacheEvict(value = "quizzes", key = "#id")
    public QuizResponse archiveQuiz(UUID id, User actor, String ipAddress, String userAgent) {
        log.info("Archiving quiz {} by user {}", id, actor.getId());

        Quiz quiz = findActiveQuizOrThrow(id);
        assertOwnerOrAdmin(quiz, actor, "archive");

        if (quiz.getStatus() == QuizStatus.ARCHIVED) {
            throw new MindriftException("Quiz is already archived.", ErrorCode.INVALID_STATE);
        }

        quiz.setStatus(QuizStatus.ARCHIVED);
        quiz.setArchivedAt(Instant.now());

        Quiz saved = quizRepository.save(quiz);
        auditService.logAction(actor, "QUIZ_ARCHIVED",
                Map.of("quizId", saved.getId().toString()), ipAddress, userAgent);

        return mapToResponse(saved, false);
    }

    // ─────────────────────────────────────────────────────────────────
    //  CLONE
    // ─────────────────────────────────────────────────────────────────

    @Transactional
    public QuizResponse cloneQuiz(UUID quizId, User cloner, String ipAddress, String userAgent) {
        log.info("Cloning quiz {} by user {}", quizId, cloner.getId());

        Quiz source = findActiveQuizOrThrow(quizId);

        Quiz copy = new Quiz();
        copy.setTitle("Copy of " + source.getTitle());
        copy.setDescription(source.getDescription());
        copy.setCreator(cloner);
        copy.setCategory(source.getCategory());
        copy.setDifficulty(source.getDifficulty());
        copy.setEstimatedDuration(source.getEstimatedDuration());
        copy.setPassingScore(source.getPassingScore());
        copy.setVisibility(QuizVisibility.PRIVATE); // Clones start private
        copy.setStatus(QuizStatus.DRAFT);
        copy.setQuizVersion(1);
        copy.setTags(new HashSet<>(source.getTags()));

        Quiz savedCopy = quizRepository.save(copy);

        // Deep-copy questions and options
        List<Question> copiedQuestions = new ArrayList<>();
        for (Question q : source.getQuestions()) {
            Question qCopy = new Question();
            qCopy.setQuiz(savedCopy);
            qCopy.setType(q.getType());
            qCopy.setQuestionText(q.getQuestionText());
            qCopy.setExplanation(q.getExplanation());
            qCopy.setPoints(q.getPoints());
            qCopy.setOrderIndex(q.getOrderIndex());

            List<QuestionOption> copiedOptions = new ArrayList<>();
            for (QuestionOption opt : q.getOptions()) {
                QuestionOption optCopy = new QuestionOption();
                optCopy.setQuestion(qCopy);
                optCopy.setOptionText(opt.getOptionText());
                optCopy.setIsCorrect(opt.getIsCorrect());
                optCopy.setOrderIndex(opt.getOrderIndex());
                copiedOptions.add(optCopy);
            }
            qCopy.setOptions(copiedOptions);
            copiedQuestions.add(qCopy);
        }

        savedCopy.setQuestions(copiedQuestions);
        Quiz finalSaved = quizRepository.save(savedCopy);

        auditService.logAction(cloner, "QUIZ_CLONED",
                Map.of("sourceId", source.getId().toString(), "clonedId", finalSaved.getId().toString()),
                ipAddress, userAgent);

        log.info("Quiz {} cloned to {}", quizId, finalSaved.getId());
        return mapToResponse(finalSaved, true);
    }

    // ─────────────────────────────────────────────────────────────────
    //  BULK QUESTIONS
    // ─────────────────────────────────────────────────────────────────

    @Transactional
    @CacheEvict(value = "quizzes", key = "#quizId")
    public QuizResponse bulkAddQuestions(UUID quizId, BulkQuestionsRequest request, User editor,
                                         String ipAddress, String userAgent) {
        log.info("Bulk adding {} questions to quiz {} by user {}",
                request.getQuestions().size(), quizId, editor.getId());

        Quiz quiz = findActiveQuizOrThrow(quizId);
        assertNotPublished(quiz, "add questions to");
        assertOwnerOrAdmin(quiz, editor, "add questions to");

        quiz.getQuestions().clear();
        quizRepository.saveAndFlush(quiz);

        List<Question> newQuestions = new ArrayList<>();
        for (BulkQuestionsRequest.QuestionItem item : request.getQuestions()) {
            Question q = buildQuestion(quiz, item);
            newQuestions.add(q);
        }

        quiz.getQuestions().addAll(newQuestions);
        Quiz saved = quizRepository.save(quiz);

        auditService.logAction(editor, "QUIZ_QUESTIONS_BULK_SET",
                Map.of("quizId", quizId.toString(), "count", String.valueOf(request.getQuestions().size())),
                ipAddress, userAgent);

        return mapToResponse(saved, true);
    }

    // ─────────────────────────────────────────────────────────────────
    //  ADD SINGLE QUESTION
    // ─────────────────────────────────────────────────────────────────

    @Transactional
    @CacheEvict(value = "quizzes", key = "#quizId")
    public QuizResponse addQuestion(UUID quizId, AddQuestionRequest request, User editor,
                                    String ipAddress, String userAgent) {
        Quiz quiz = findActiveQuizOrThrow(quizId);
        assertNotPublished(quiz, "add question to");
        assertOwnerOrAdmin(quiz, editor, "add question to");

        Question q = new Question();
        q.setQuiz(quiz);
        q.setType(request.getType());
        q.setQuestionText(request.getQuestionText());
        q.setExplanation(request.getExplanation());
        q.setPoints(request.getPoints());
        q.setOrderIndex(request.getOrderIndex());

        List<QuestionOption> options = new ArrayList<>();
        if (request.getOptions() != null) {
            for (AddQuestionRequest.OptionRequest optReq : request.getOptions()) {
                QuestionOption opt = new QuestionOption();
                opt.setQuestion(q);
                opt.setOptionText(optReq.getOptionText());
                opt.setIsCorrect(optReq.getIsCorrect());
                opt.setOrderIndex(optReq.getOrderIndex());
                options.add(opt);
            }
        }
        q.setOptions(options);
        quiz.getQuestions().add(q);

        Quiz saved = quizRepository.save(quiz);
        auditService.logAction(editor, "QUIZ_QUESTION_ADDED",
                Map.of("quizId", quizId.toString()), ipAddress, userAgent);

        return mapToResponse(saved, true);
    }

    // ─────────────────────────────────────────────────────────────────
    //  DELETE QUESTION
    // ─────────────────────────────────────────────────────────────────

    @Transactional
    @CacheEvict(value = "quizzes", key = "#quizId")
    public QuizResponse removeQuestion(UUID quizId, UUID questionId, User editor,
                                       String ipAddress, String userAgent) {
        Quiz quiz = findActiveQuizOrThrow(quizId);
        assertNotPublished(quiz, "remove question from");
        assertOwnerOrAdmin(quiz, editor, "remove question from");

        boolean removed = quiz.getQuestions().removeIf(q -> q.getId().equals(questionId));
        if (!removed) {
            throw new ResourceNotFoundException("Question not found in quiz: " + questionId);
        }

        Quiz saved = quizRepository.save(quiz);
        auditService.logAction(editor, "QUIZ_QUESTION_REMOVED",
                Map.of("quizId", quizId.toString(), "questionId", questionId.toString()),
                ipAddress, userAgent);

        return mapToResponse(saved, true);
    }

    // ─────────────────────────────────────────────────────────────────
    //  QUERIES
    // ─────────────────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    @Cacheable(value = "quizzes", key = "#id")
    public QuizResponse getQuizById(UUID id) {
        Quiz quiz = findActiveQuizOrThrow(id);
        return mapToResponse(quiz, true);
    }

    @Transactional(readOnly = true)
    public Page<QuizResponse> searchQuizzes(UUID categoryId, QuizDifficulty difficulty,
                                             QuizStatus status, QuizVisibility visibility,
                                             UUID creatorId, String tag, String search,
                                             Pageable pageable) {
        Specification<Quiz> spec = Specification
                .where(QuizSpecification.notDeleted())
                .and(QuizSpecification.hasCategory(categoryId))
                .and(QuizSpecification.hasDifficulty(difficulty))
                .and(QuizSpecification.hasStatus(status))
                .and(QuizSpecification.hasVisibility(visibility))
                .and(QuizSpecification.hasCreator(creatorId))
                .and(QuizSpecification.hasTag(tag))
                .and(QuizSpecification.searchTitleOrDescription(search));

        return quizRepository.findAll(spec, pageable).map(q -> mapToResponse(q, false));
    }

    @Transactional(readOnly = true)
    public List<QuizVersionResponse> getVersionHistory(UUID quizId) {
        findActiveQuizOrThrow(quizId); // verify quiz exists
        return quizVersionRepository.findByQuizIdOrderByVersionDesc(quizId)
                .stream()
                .map(this::mapVersionToResponse)
                .collect(Collectors.toList());
    }

    @Transactional(readOnly = true)
    public QuizVersionResponse getSpecificVersion(UUID quizId, Integer version) {
        QuizVersion qv = quizVersionRepository.findByQuizIdAndVersion(quizId, version)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Version " + version + " not found for quiz " + quizId));
        return mapVersionToResponse(qv);
    }

    // ─────────────────────────────────────────────────────────────────
    //  INTERNAL HELPERS
    // ─────────────────────────────────────────────────────────────────

    private Quiz findActiveQuizOrThrow(UUID id) {
        return quizRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Quiz not found: " + id));
    }

    private void assertNotPublished(Quiz quiz, String action) {
        if (quiz.getStatus() == QuizStatus.PUBLISHED) {
            throw new MindriftException(
                    "Cannot " + action + " a published quiz. Create a clone to modify it.",
                    ErrorCode.INVALID_STATE);
        }
    }

    private void assertOwnerOrAdmin(Quiz quiz, User actor, String action) {
        boolean isOwner = quiz.getCreator().getId().equals(actor.getId());
        boolean isAdmin = actor.getRole() == UserRole.ROLE_ADMIN
                || actor.getRole() == UserRole.ROLE_SUPER_ADMIN;
        if (!isOwner && !isAdmin) {
            throw new MindriftException(
                    "You do not have permission to " + action + " this quiz.", ErrorCode.FORBIDDEN);
        }
    }

    private void resolveAndSetTags(Set<String> tagNames, Quiz quiz) {
        if (tagNames == null || tagNames.isEmpty()) {
            quiz.getTags().clear();
            return;
        }
        Set<Tag> tags = new HashSet<>();
        for (String name : tagNames) {
            Tag tag = tagRepository.findByName(name.trim())
                    .orElseGet(() -> {
                        Tag t = new Tag();
                        t.setName(name.trim());
                        return tagRepository.save(t);
                    });
            tags.add(tag);
        }
        quiz.setTags(tags);
    }

    private Question buildQuestion(Quiz quiz, BulkQuestionsRequest.QuestionItem item) {
        Question q = new Question();
        q.setQuiz(quiz);
        q.setType(item.getType());
        q.setQuestionText(item.getQuestionText());
        q.setExplanation(item.getExplanation());
        q.setPoints(item.getPoints());
        q.setOrderIndex(item.getOrderIndex());

        if (item.getOptions() != null) {
            List<QuestionOption> options = new ArrayList<>();
            for (BulkQuestionsRequest.OptionItem optItem : item.getOptions()) {
                QuestionOption opt = new QuestionOption();
                opt.setQuestion(q);
                opt.setOptionText(optItem.getOptionText());
                opt.setIsCorrect(optItem.getIsCorrect());
                opt.setOrderIndex(optItem.getOrderIndex());
                options.add(opt);
            }
            q.setOptions(options);
        }
        return q;
    }

    private void captureVersionSnapshot(Quiz quiz, String createdBy, String changeNotes) {
        try {
            QuizResponse snapshotData = mapToResponse(quiz, true);
            String snapshotJson = objectMapper.writeValueAsString(snapshotData);

            QuizVersion versionLog = new QuizVersion();
            versionLog.setQuiz(quiz);
            versionLog.setVersion(quiz.getQuizVersion());
            versionLog.setSnapshot(snapshotJson);
            versionLog.setCreatedBy(createdBy);
            versionLog.setChangeNotes(changeNotes);
            versionLog.setCreatedAt(Instant.now());
            quizVersionRepository.save(versionLog);

            log.info("Quiz version snapshot captured: quiz={} version={}", quiz.getId(), quiz.getQuizVersion());
        } catch (Exception e) {
            log.error("Failed to capture quiz version snapshot for quiz {}", quiz.getId(), e);
            throw new MindriftException("Snapshot creation failed during publication.", ErrorCode.INTERNAL_ERROR);
        }
    }

    // ─────────────────────────────────────────────────────────────────
    //  MAPPING
    // ─────────────────────────────────────────────────────────────────

    public QuizResponse mapToResponse(Quiz quiz, boolean includeQuestions) {
        QuizResponse.QuizResponseBuilder builder = QuizResponse.builder()
                .id(quiz.getId())
                .title(quiz.getTitle())
                .description(quiz.getDescription())
                .creatorId(quiz.getCreator().getId())
                .creatorUsername(quiz.getCreator().getUsername())
                .categoryId(quiz.getCategory().getId())
                .categoryName(quiz.getCategory().getName())
                .difficulty(quiz.getDifficulty())
                .status(quiz.getStatus())
                .estimatedDuration(quiz.getEstimatedDuration())
                .passingScore(quiz.getPassingScore())
                .visibility(quiz.getVisibility())
                .quizVersion(quiz.getQuizVersion())
                .publishedAt(quiz.getPublishedAt())
                .archivedAt(quiz.getArchivedAt())
                .createdAt(quiz.getCreatedAt())
                .updatedAt(quiz.getUpdatedAt())
                .tags(quiz.getTags().stream().map(Tag::getName).collect(Collectors.toSet()))
                .questionCount(quiz.getQuestions() != null ? quiz.getQuestions().size() : 0);

        if (includeQuestions && quiz.getQuestions() != null) {
            builder.questions(quiz.getQuestions().stream().map(q ->
                com.mindrift.quiz.dto.QuestionResponse.builder()
                        .id(q.getId())
                        .type(q.getType())
                        .questionText(q.getQuestionText())
                        .explanation(q.getExplanation())
                        .points(q.getPoints())
                        .orderIndex(q.getOrderIndex())
                        .options(q.getOptions().stream().map(o ->
                            OptionResponse.builder()
                                    .id(o.getId())
                                    .optionText(o.getOptionText())
                                    .isCorrect(o.getIsCorrect())
                                    .orderIndex(o.getOrderIndex())
                                    .build()
                        ).collect(Collectors.toList()))
                        .build()
            ).collect(Collectors.toList()));
        }

        return builder.build();
    }

    private QuizVersionResponse mapVersionToResponse(QuizVersion qv) {
        return QuizVersionResponse.builder()
                .id(qv.getId())
                .quizId(qv.getQuiz().getId())
                .quizTitle(qv.getQuiz().getTitle())
                .version(qv.getVersion())
                .snapshot(qv.getSnapshot())
                .createdBy(qv.getCreatedBy())
                .changeNotes(qv.getChangeNotes())
                .createdAt(qv.getCreatedAt())
                .build();
    }
}
