package com.mindrift.quiz.service;

import com.mindrift.BaseIntegrationTest;
import com.mindrift.common.exception.BaseMindriftException;
import com.mindrift.common.exception.ResourceNotFoundException;
import com.mindrift.quiz.dto.*;
import com.mindrift.quiz.entity.*;
import com.mindrift.quiz.repository.*;
import com.mindrift.user.entity.User;
import com.mindrift.user.entity.UserRole;
import com.mindrift.user.entity.UserStatus;
import com.mindrift.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class QuizServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired private QuizService quizService;
    @Autowired private QuizRepository quizRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private TagRepository tagRepository;
    @Autowired private QuizVersionRepository quizVersionRepository;
    @Autowired private UserRepository userRepository;

    private User creator;
    private User admin;
    private Category category;

    @BeforeEach
    void setUp() {
        quizVersionRepository.deleteAll();
        quizRepository.deleteAll();
        categoryRepository.deleteAll();
        tagRepository.deleteAll();
        userRepository.deleteAll();

        creator = userRepository.save(buildUser("quiz_creator", UserRole.ROLE_PLAYER));
        admin = userRepository.save(buildUser("quiz_admin", UserRole.ROLE_ADMIN));
        category = categoryRepository.save(buildCategory("Science", "science"));
    }

    // ─── CREATE ──────────────────────────────────────────────────────

    @Test
    void createQuiz_success() {
        CreateQuizRequest req = buildCreateRequest("Java Fundamentals", category.getId());
        QuizResponse response = quizService.createQuiz(req, creator, "127.0.0.1", "Test");

        assertNotNull(response.getId());
        assertEquals("Java Fundamentals", response.getTitle());
        assertEquals(QuizStatus.DRAFT, response.getStatus());
        assertEquals(1, response.getQuizVersion());
        assertEquals(category.getId(), response.getCategoryId());
    }

    @Test
    void createQuiz_invalidCategory_throwsResourceNotFound() {
        CreateQuizRequest req = buildCreateRequest("Test", UUID.randomUUID());
        assertThrows(ResourceNotFoundException.class,
                () -> quizService.createQuiz(req, creator, "127.0.0.1", "Test"));
    }

    // ─── UPDATE ──────────────────────────────────────────────────────

    @Test
    void updateQuiz_success() {
        QuizResponse created = quizService.createQuiz(
                buildCreateRequest("Old Title", category.getId()), creator, "127.0.0.1", "Test");

        UpdateQuizRequest updateReq = buildUpdateRequest("New Title", category.getId());
        QuizResponse updated = quizService.updateQuiz(created.getId(), updateReq, creator, "127.0.0.1", "Test");

        assertEquals("New Title", updated.getTitle());
    }

    @Test
    void updatePublishedQuiz_throwsInvalidState() {
        Quiz quiz = forceSavePublished(buildCreateRequest("Pub Quiz", category.getId()));
        UpdateQuizRequest req = buildUpdateRequest("Attempt Update", category.getId());

        assertThrows(BaseMindriftException.class,
                () -> quizService.updateQuiz(quiz.getId(), req, admin, "127.0.0.1", "Test"));
    }

    // ─── DELETE ──────────────────────────────────────────────────────

    @Test
    void deleteQuiz_success_softDeletes() {
        QuizResponse created = quizService.createQuiz(
                buildCreateRequest("Delete Me", category.getId()), creator, "127.0.0.1", "Test");

        quizService.deleteQuiz(created.getId(), creator, "127.0.0.1", "Test");

        // Quiz should not be findable via normal queries (@Where filters)
        assertFalse(quizRepository.findById(created.getId()).isPresent());
        // But should still exist in DB via raw query
        assertTrue(quizRepository.findByIdIncludingDeleted(created.getId()).isPresent());
    }

    @Test
    void deletePublishedQuiz_throwsInvalidState() {
        Quiz quiz = forceSavePublished(buildCreateRequest("Pub Quiz", category.getId()));

        assertThrows(BaseMindriftException.class,
                () -> quizService.deleteQuiz(quiz.getId(), admin, "127.0.0.1", "Test"));
    }

    // ─── PUBLISH ─────────────────────────────────────────────────────

    @Test
    void publishQuiz_success_createsVersionSnapshot() {
        QuizResponse created = quizService.createQuiz(
                buildCreateRequest("Pub Test", category.getId()), creator, "127.0.0.1", "Test");

        // Add questions to pass validation
        quizService.bulkAddQuestions(created.getId(),
                buildBulkRequest(), creator, "127.0.0.1", "Test");

        PublishQuizRequest publishReq = new PublishQuizRequest();
        QuizResponse published = quizService.publishQuiz(
                created.getId(), publishReq, admin, "127.0.0.1", "Test");

        assertEquals(QuizStatus.PUBLISHED, published.getStatus());
        assertNotNull(published.getPublishedAt());
        assertEquals(2, published.getQuizVersion()); // version increments on publish

        List<QuizVersionResponse> versions = quizService.getVersionHistory(created.getId());
        assertEquals(1, versions.size());
    }

    @Test
    void publishQuiz_noQuestions_throwsInvalidState() {
        QuizResponse created = quizService.createQuiz(
                buildCreateRequest("No Questions Quiz", category.getId()), creator, "127.0.0.1", "Test");

        assertThrows(BaseMindriftException.class,
                () -> quizService.publishQuiz(created.getId(), new PublishQuizRequest(), admin, "127.0.0.1", "Test"));
    }

    // ─── ARCHIVE ─────────────────────────────────────────────────────

    @Test
    void archiveQuiz_success() {
        QuizResponse created = quizService.createQuiz(
                buildCreateRequest("Archive Me", category.getId()), creator, "127.0.0.1", "Test");

        QuizResponse archived = quizService.archiveQuiz(
                created.getId(), creator, "127.0.0.1", "Test");

        assertEquals(QuizStatus.ARCHIVED, archived.getStatus());
        assertNotNull(archived.getArchivedAt());
    }

    // ─── CLONE ───────────────────────────────────────────────────────

    @Test
    void cloneQuiz_success_deepCopiesQuestionsAndOptions() {
        QuizResponse source = quizService.createQuiz(
                buildCreateRequest("Source Quiz", category.getId()), creator, "127.0.0.1", "Test");
        quizService.bulkAddQuestions(source.getId(), buildBulkRequest(), creator, "127.0.0.1", "Test");

        QuizResponse clone = quizService.cloneQuiz(source.getId(), admin, "127.0.0.1", "Test");

        assertEquals("Copy of Source Quiz", clone.getTitle());
        assertNotEquals(source.getId(), clone.getId());
        assertEquals(QuizStatus.DRAFT, clone.getStatus());
        assertEquals(1, clone.getQuizVersion());
        assertEquals(1, clone.getQuestions().size());
        assertNotEquals(source.getQuestions().get(0).getId(), clone.getQuestions().get(0).getId());
    }

    // ─── QUESTIONS ───────────────────────────────────────────────────

    @Test
    void addQuestion_success() {
        QuizResponse created = quizService.createQuiz(
                buildCreateRequest("Q Test", category.getId()), creator, "127.0.0.1", "Test");

        AddQuestionRequest req = buildAddQuestionRequest();
        QuizResponse updated = quizService.addQuestion(created.getId(), req, creator, "127.0.0.1", "Test");

        assertEquals(1, updated.getQuestions().size());
        assertEquals("What is 2+2?", updated.getQuestions().get(0).getQuestionText());
    }

    @Test
    void removeQuestion_success() {
        QuizResponse created = quizService.createQuiz(
                buildCreateRequest("Remove Q Test", category.getId()), creator, "127.0.0.1", "Test");
        quizService.bulkAddQuestions(created.getId(), buildBulkRequest(), creator, "127.0.0.1", "Test");

        QuizResponse withQ = quizService.getQuizById(created.getId());
        assertEquals(1, withQ.getQuestions().size());
        UUID questionId = withQ.getQuestions().get(0).getId();

        QuizResponse after = quizService.removeQuestion(created.getId(), questionId, creator, "127.0.0.1", "Test");
        assertEquals(0, after.getQuestions().size());
    }

    // ─── SEARCH ──────────────────────────────────────────────────────

    @Test
    void searchQuizzes_byTitle_returnsResults() {
        quizService.createQuiz(buildCreateRequest("Spring Boot Deep Dive", category.getId()), creator, "127.0.0.1", "Test");
        quizService.createQuiz(buildCreateRequest("Kafka Fundamentals", category.getId()), creator, "127.0.0.1", "Test");

        Page<QuizResponse> results = quizService.searchQuizzes(
                null, null, null, null, null, null, "Spring", PageRequest.of(0, 10));

        assertEquals(1, results.getTotalElements());
        assertEquals("Spring Boot Deep Dive", results.getContent().get(0).getTitle());
    }

    @Test
    void searchQuizzes_byCategory_returnsOnlyMatching() {
        Category other = categoryRepository.save(buildCategory("Math", "math"));
        quizService.createQuiz(buildCreateRequest("Science Quiz", category.getId()), creator, "127.0.0.1", "Test");
        quizService.createQuiz(buildCreateRequest("Math Quiz", other.getId()), creator, "127.0.0.1", "Test");

        Page<QuizResponse> results = quizService.searchQuizzes(
                category.getId(), null, null, null, null, null, null, PageRequest.of(0, 10));

        assertEquals(1, results.getTotalElements());
        assertEquals("Science Quiz", results.getContent().get(0).getTitle());
    }

    @Test
    void softDeletedQuiz_doesNotAppearInSearch() {
        QuizResponse created = quizService.createQuiz(
                buildCreateRequest("Ghost Quiz", category.getId()), creator, "127.0.0.1", "Test");
        quizService.deleteQuiz(created.getId(), creator, "127.0.0.1", "Test");

        Page<QuizResponse> results = quizService.searchQuizzes(
                null, null, null, null, null, null, "Ghost", PageRequest.of(0, 10));

        assertEquals(0, results.getTotalElements());
    }

    // ─── VERSION HISTORY ─────────────────────────────────────────────

    @Test
    void getVersionHistory_returnsAllSnapshots() {
        QuizResponse created = quizService.createQuiz(
                buildCreateRequest("Versioned Quiz", category.getId()), creator, "127.0.0.1", "Test");
        quizService.bulkAddQuestions(created.getId(), buildBulkRequest(), creator, "127.0.0.1", "Test");
        quizService.publishQuiz(created.getId(), new PublishQuizRequest(), admin, "127.0.0.1", "Test");

        List<QuizVersionResponse> history = quizService.getVersionHistory(created.getId());
        assertEquals(1, history.size());
        assertEquals(1, history.get(0).getVersion());
    }

    // ─── HELPERS ─────────────────────────────────────────────────────

    private User buildUser(String username, UserRole role) {
        User user = new User();
        user.setId(UUID.randomUUID());
        user.setClerkId("clerk_" + username + "_" + UUID.randomUUID());
        user.setEmail(username + "@test.com");
        user.setUsername(username);
        user.setRole(role);
        user.setStatus(UserStatus.ACTIVE);
        user.setCreatedAt(Instant.now());
        user.setUpdatedAt(Instant.now());
        return user;
    }

    private Category buildCategory(String name, String slug) {
        Category c = new Category();
        c.setName(name);
        c.setSlug(slug);
        return c;
    }

    private CreateQuizRequest buildCreateRequest(String title, UUID categoryId) {
        CreateQuizRequest req = new CreateQuizRequest();
        req.setTitle(title);
        req.setDescription("Test description");
        req.setCategoryId(categoryId);
        req.setDifficulty(QuizDifficulty.MEDIUM);
        req.setEstimatedDuration(30);
        req.setPassingScore(70.0);
        req.setVisibility(QuizVisibility.PUBLIC);
        req.setTags(Set.of("java", "backend"));
        return req;
    }

    private UpdateQuizRequest buildUpdateRequest(String title, UUID categoryId) {
        UpdateQuizRequest req = new UpdateQuizRequest();
        req.setTitle(title);
        req.setDescription("Updated description");
        req.setCategoryId(categoryId);
        req.setDifficulty(QuizDifficulty.EASY);
        req.setEstimatedDuration(20);
        req.setPassingScore(60.0);
        req.setVisibility(QuizVisibility.PUBLIC);
        return req;
    }

    private BulkQuestionsRequest buildBulkRequest() {
        BulkQuestionsRequest.OptionItem opt1 = new BulkQuestionsRequest.OptionItem();
        opt1.setOptionText("4");
        opt1.setIsCorrect(true);
        opt1.setOrderIndex(0);

        BulkQuestionsRequest.OptionItem opt2 = new BulkQuestionsRequest.OptionItem();
        opt2.setOptionText("5");
        opt2.setIsCorrect(false);
        opt2.setOrderIndex(1);

        BulkQuestionsRequest.QuestionItem question = new BulkQuestionsRequest.QuestionItem();
        question.setType(QuestionType.MCQ);
        question.setQuestionText("What is 2+2?");
        question.setExplanation("Basic arithmetic");
        question.setPoints(10);
        question.setOrderIndex(0);
        question.setOptions(List.of(opt1, opt2));

        BulkQuestionsRequest req = new BulkQuestionsRequest();
        req.setQuestions(List.of(question));
        return req;
    }

    private AddQuestionRequest buildAddQuestionRequest() {
        AddQuestionRequest.OptionRequest opt1 = new AddQuestionRequest.OptionRequest();
        opt1.setOptionText("4");
        opt1.setIsCorrect(true);
        opt1.setOrderIndex(0);

        AddQuestionRequest.OptionRequest opt2 = new AddQuestionRequest.OptionRequest();
        opt2.setOptionText("5");
        opt2.setIsCorrect(false);
        opt2.setOrderIndex(1);

        AddQuestionRequest req = new AddQuestionRequest();
        req.setType(QuestionType.MCQ);
        req.setQuestionText("What is 2+2?");
        req.setPoints(10);
        req.setOrderIndex(0);
        req.setOptions(List.of(opt1, opt2));
        return req;
    }

    /** Bypasses service to force a quiz into PUBLISHED state for testing guards */
    private Quiz forceSavePublished(CreateQuizRequest createReq) {
        QuizResponse created = quizService.createQuiz(createReq, creator, "127.0.0.1", "Test");
        Quiz quiz = quizRepository.findById(created.getId()).orElseThrow();
        quiz.setStatus(QuizStatus.PUBLISHED);
        return quizRepository.save(quiz);
    }
}
