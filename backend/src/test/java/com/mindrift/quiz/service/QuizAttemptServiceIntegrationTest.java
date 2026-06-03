package com.mindrift.quiz.service;

import com.mindrift.BaseIntegrationTest;
import com.mindrift.common.exception.BaseMindriftException;
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

class QuizAttemptServiceIntegrationTest extends BaseIntegrationTest {

    @Autowired private QuizAttemptService attemptService;
    @Autowired private QuizService quizService;
    @Autowired private QuizAttemptRepository attemptRepository;
    @Autowired private QuestionResponseRepository responseRepository;
    @Autowired private QuizRepository quizRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private TagRepository tagRepository;

    private User player;
    private User admin;
    private Quiz publishedQuiz;
    private Question mcqQuestion;
    private QuestionOption correctOption;
    private QuestionOption wrongOption;

    @BeforeEach
    void setUp() {
        responseRepository.deleteAll();
        attemptRepository.deleteAll();
        quizRepository.deleteAll();
        categoryRepository.deleteAll();
        tagRepository.deleteAll();
        userRepository.deleteAll();

        player = userRepository.save(buildUser("player1", UserRole.ROLE_PLAYER));
        admin  = userRepository.save(buildUser("admin1",  UserRole.ROLE_ADMIN));

        Category category = categoryRepository.save(buildCategory("Science", "science"));
        publishedQuiz = buildAndPublishQuiz(category);
        mcqQuestion   = publishedQuiz.getQuestions().get(0);
        correctOption = mcqQuestion.getOptions().stream().filter(QuestionOption::getIsCorrect).findFirst().orElseThrow();
        wrongOption   = mcqQuestion.getOptions().stream().filter(o -> !o.getIsCorrect()).findFirst().orElseThrow();
    }

    // ─── START ATTEMPT ────────────────────────────────────────────────

    @Test
    void startAttempt_success() {
        StartAttemptResponse resp = attemptService.startAttempt(
                publishedQuiz.getId(), player, "127.0.0.1", "Test");

        assertNotNull(resp.getAttemptId());
        assertEquals(publishedQuiz.getId(), resp.getQuizId());
        assertEquals(QuizAttemptStatus.STARTED, resp.getStatus());
        assertNotNull(resp.getEndTime());
        assertTrue(resp.getRemainingSeconds() > 0);
        assertNotNull(resp.getQuestions());
        assertFalse(resp.getQuestions().isEmpty());
        // Correct flags must be hidden
        resp.getQuestions().forEach(q ->
                q.getOptions().forEach(o -> assertNull(o.getIsCorrect())));
    }

    @Test
    void startAttempt_unpublishedQuiz_throwsException() {
        // Create a DRAFT quiz
        Category cat = categoryRepository.save(buildCategory("Math", "math"));
        CreateQuizRequest req = buildCreateQuizRequest("Draft Quiz", cat.getId());
        QuizResponse draft = quizService.createQuiz(req, admin, "127.0.0.1", "Test");

        assertThrows(BaseMindriftException.class, () ->
                attemptService.startAttempt(draft.getId(), player, "127.0.0.1", "Test"));
    }

    @Test
    void startAttempt_duplicateActive_throwsException() {
        attemptService.startAttempt(publishedQuiz.getId(), player, "127.0.0.1", "Test");

        assertThrows(BaseMindriftException.class, () ->
                attemptService.startAttempt(publishedQuiz.getId(), player, "127.0.0.1", "Test"));
    }

    @Test
    void startAttempt_incrementsAttemptNumber() {
        StartAttemptResponse first = attemptService.startAttempt(
                publishedQuiz.getId(), player, "127.0.0.1", "Test");
        assertEquals(1, attemptRepository.findById(first.getAttemptId()).orElseThrow().getAttemptNumber());

        // Submit first, then start second
        attemptService.submitAttempt(first.getAttemptId(), player, "127.0.0.1", "Test");

        StartAttemptResponse second = attemptService.startAttempt(
                publishedQuiz.getId(), player, "127.0.0.1", "Test");
        assertEquals(2, attemptRepository.findById(second.getAttemptId()).orElseThrow().getAttemptNumber());
    }

    // ─── SAVE ANSWER ──────────────────────────────────────────────────

    @Test
    void saveAnswer_correctAnswer_returnsProgress() {
        StartAttemptResponse started = attemptService.startAttempt(
                publishedQuiz.getId(), player, "127.0.0.1", "Test");

        SaveAnswerRequest req = buildSaveAnswerRequest(mcqQuestion.getId(),
                List.of(correctOption.getId().toString()));
        AttemptProgressResponse progress = attemptService.saveAnswer(
                started.getAttemptId(), req, player, "127.0.0.1", "Test");

        assertEquals(1, progress.getAnsweredCount());
        assertTrue(progress.getRunningScore() > 0);
    }

    @Test
    void saveAnswer_wrongAnswer_scoreIsZeroOrNegative() {
        StartAttemptResponse started = attemptService.startAttempt(
                publishedQuiz.getId(), player, "127.0.0.1", "Test");

        SaveAnswerRequest req = buildSaveAnswerRequest(mcqQuestion.getId(),
                List.of(wrongOption.getId().toString()));
        AttemptProgressResponse progress = attemptService.saveAnswer(
                started.getAttemptId(), req, player, "127.0.0.1", "Test");

        assertEquals(1, progress.getAnsweredCount());
        assertEquals(0.0, progress.getRunningScore(), 0.01);
    }

    @Test
    void saveAnswer_idempotent_overwritesPreviousAnswer() {
        StartAttemptResponse started = attemptService.startAttempt(
                publishedQuiz.getId(), player, "127.0.0.1", "Test");
        UUID attemptId = started.getAttemptId();

        // Save wrong first
        attemptService.saveAnswer(attemptId,
                buildSaveAnswerRequest(mcqQuestion.getId(), List.of(wrongOption.getId().toString())),
                player, "127.0.0.1", "Test");

        // Then change to correct
        attemptService.saveAnswer(attemptId,
                buildSaveAnswerRequest(mcqQuestion.getId(), List.of(correctOption.getId().toString())),
                player, "127.0.0.1", "Test");

        // Only 1 response row should exist (upsert)
        assertEquals(1, responseRepository.findByAttemptId(attemptId).size());
        // And it should be the correct one
        assertTrue(responseRepository.findByAttemptId(attemptId).get(0).getIsCorrect());
    }

    @Test
    void saveAnswer_wrongAttemptOwner_throwsForbidden() {
        User otherUser = userRepository.save(buildUser("other", UserRole.ROLE_PLAYER));
        StartAttemptResponse started = attemptService.startAttempt(
                publishedQuiz.getId(), player, "127.0.0.1", "Test");

        assertThrows(BaseMindriftException.class, () ->
                attemptService.saveAnswer(started.getAttemptId(),
                        buildSaveAnswerRequest(mcqQuestion.getId(), List.of(correctOption.getId().toString())),
                        otherUser, "127.0.0.1", "Test"));
    }

    // ─── SUBMIT ───────────────────────────────────────────────────────

    @Test
    void submitAttempt_withCorrectAnswer_passesQuiz() {
        StartAttemptResponse started = attemptService.startAttempt(
                publishedQuiz.getId(), player, "127.0.0.1", "Test");
        attemptService.saveAnswer(started.getAttemptId(),
                buildSaveAnswerRequest(mcqQuestion.getId(), List.of(correctOption.getId().toString())),
                player, "127.0.0.1", "Test");

        QuizResultResponse result = attemptService.submitAttempt(
                started.getAttemptId(), player, "127.0.0.1", "Test");

        assertEquals(QuizAttemptStatus.SUBMITTED, result.getStatus());
        assertTrue(result.getScore() > 0);
        assertEquals(1, result.getCorrectAnswersCount());
        assertEquals(0, result.getIncorrectAnswersCount());
        assertNotNull(result.getBreakdown());
        assertFalse(result.getBreakdown().isEmpty());
        // Correct option IDs must be revealed in result
        assertFalse(result.getBreakdown().get(0).getCorrectOptionIds().isEmpty());
    }

    @Test
    void submitAttempt_withWrongAnswer_failsQuiz() {
        StartAttemptResponse started = attemptService.startAttempt(
                publishedQuiz.getId(), player, "127.0.0.1", "Test");
        attemptService.saveAnswer(started.getAttemptId(),
                buildSaveAnswerRequest(mcqQuestion.getId(), List.of(wrongOption.getId().toString())),
                player, "127.0.0.1", "Test");

        QuizResultResponse result = attemptService.submitAttempt(
                started.getAttemptId(), player, "127.0.0.1", "Test");

        assertFalse(result.getPassed());
        assertEquals(0, result.getCorrectAnswersCount());
        assertEquals("INCORRECT", result.getBreakdown().get(0).getScoreType());
    }

    @Test
    void submitAttempt_noAnswers_unansweredCountCorrect() {
        StartAttemptResponse started = attemptService.startAttempt(
                publishedQuiz.getId(), player, "127.0.0.1", "Test");

        QuizResultResponse result = attemptService.submitAttempt(
                started.getAttemptId(), player, "127.0.0.1", "Test");

        assertEquals(publishedQuiz.getQuestions().size(), result.getUnansweredCount());
        assertEquals(0.0, result.getScore(), 0.001);
    }

    @Test
    void submitAttempt_idempotent_returnsAlreadySubmittedResult() {
        StartAttemptResponse started = attemptService.startAttempt(
                publishedQuiz.getId(), player, "127.0.0.1", "Test");
        UUID attemptId = started.getAttemptId();

        QuizResultResponse first  = attemptService.submitAttempt(attemptId, player, "127.0.0.1", "Test");
        QuizResultResponse second = attemptService.submitAttempt(attemptId, player, "127.0.0.1", "Test");

        assertEquals(first.getScore(), second.getScore());
        assertEquals(QuizAttemptStatus.SUBMITTED, second.getStatus());
    }

    // ─── RESULT ───────────────────────────────────────────────────────

    @Test
    void getResult_afterSubmit_returnsFullBreakdown() {
        StartAttemptResponse started = attemptService.startAttempt(
                publishedQuiz.getId(), player, "127.0.0.1", "Test");
        attemptService.saveAnswer(started.getAttemptId(),
                buildSaveAnswerRequest(mcqQuestion.getId(), List.of(correctOption.getId().toString())),
                player, "127.0.0.1", "Test");
        attemptService.submitAttempt(started.getAttemptId(), player, "127.0.0.1", "Test");

        QuizResultResponse result = attemptService.getResult(started.getAttemptId(), player);

        assertNotNull(result.getBreakdown());
        assertEquals(publishedQuiz.getQuestions().size(), result.getBreakdown().size());
        assertEquals(publishedQuiz.getTitle(), result.getQuizTitle());
        assertNotNull(result.getSubmittedAt());
    }

    @Test
    void getResult_inProgressAttempt_throwsException() {
        StartAttemptResponse started = attemptService.startAttempt(
                publishedQuiz.getId(), player, "127.0.0.1", "Test");

        assertThrows(BaseMindriftException.class, () ->
                attemptService.getResult(started.getAttemptId(), player));
    }

    @Test
    void getResult_adminCanViewAnyResult() {
        StartAttemptResponse started = attemptService.startAttempt(
                publishedQuiz.getId(), player, "127.0.0.1", "Test");
        attemptService.submitAttempt(started.getAttemptId(), player, "127.0.0.1", "Test");

        // Admin viewing player's result
        assertDoesNotThrow(() -> attemptService.getResult(started.getAttemptId(), admin));
    }

    // ─── PROGRESS ─────────────────────────────────────────────────────

    @Test
    void getProgress_returnsCurrentState() {
        StartAttemptResponse started = attemptService.startAttempt(
                publishedQuiz.getId(), player, "127.0.0.1", "Test");
        attemptService.saveAnswer(started.getAttemptId(),
                buildSaveAnswerRequest(mcqQuestion.getId(), List.of(correctOption.getId().toString())),
                player, "127.0.0.1", "Test");

        AttemptProgressResponse progress = attemptService.getProgress(started.getAttemptId(), player);

        assertEquals(started.getAttemptId(), progress.getAttemptId());
        assertEquals(1, progress.getAnsweredCount());
        assertTrue(progress.getRemainingSeconds() > 0);
    }

    // ─── MY ATTEMPTS ──────────────────────────────────────────────────

    @Test
    void getMyAttempts_returnsPaginatedHistory() {
        StartAttemptResponse a1 = attemptService.startAttempt(publishedQuiz.getId(), player, "127.0.0.1", "Test");
        attemptService.submitAttempt(a1.getAttemptId(), player, "127.0.0.1", "Test");

        StartAttemptResponse a2 = attemptService.startAttempt(publishedQuiz.getId(), player, "127.0.0.1", "Test");
        attemptService.submitAttempt(a2.getAttemptId(), player, "127.0.0.1", "Test");

        Page<QuizResultResponse> history = attemptService.getMyAttempts(player, PageRequest.of(0, 10));
        assertEquals(2, history.getTotalElements());
    }

    // ─── SCORING UNIT: MULTI_SELECT ───────────────────────────────────

    @Test
    void multiSelectQuestion_partialCredit_scoredCorrectly() {
        // Build quiz with MULTI_SELECT question (manual for isolation)
        Category cat = categoryRepository.save(buildCategory("Logic", "logic"));
        Quiz quiz = buildAndPublishQuizWithMultiSelect(cat);

        StartAttemptResponse started = attemptService.startAttempt(quiz.getId(), player, "127.0.0.1", "Test");
        Question msq = quiz.getQuestions().get(0);
        List<QuestionOption> correctOpts = msq.getOptions().stream().filter(QuestionOption::getIsCorrect).toList();
        // Select only one of two correct answers → partial credit
        String oneCorrect = correctOpts.get(0).getId().toString();
        AttemptProgressResponse progress = attemptService.saveAnswer(started.getAttemptId(),
                buildSaveAnswerRequest(msq.getId(), List.of(oneCorrect)),
                player, "127.0.0.1", "Test");

        assertTrue(progress.getRunningScore() > 0, "Partial credit should be > 0");
        assertTrue(progress.getRunningScore() < msq.getPoints(), "Partial credit should be < full marks");
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

    private Quiz buildAndPublishQuiz(Category category) {
        CreateQuizRequest req = buildCreateQuizRequest("Integration Test Quiz", category.getId());
        QuizResponse created = quizService.createQuiz(req, admin, "127.0.0.1", "Test");

        // Bulk add 1 MCQ question
        BulkQuestionsRequest.OptionItem opt1 = new BulkQuestionsRequest.OptionItem();
        opt1.setOptionText("Correct Answer"); opt1.setIsCorrect(true); opt1.setOrderIndex(0);

        BulkQuestionsRequest.OptionItem opt2 = new BulkQuestionsRequest.OptionItem();
        opt2.setOptionText("Wrong Answer"); opt2.setIsCorrect(false); opt2.setOrderIndex(1);

        BulkQuestionsRequest.QuestionItem q = new BulkQuestionsRequest.QuestionItem();
        q.setType(QuestionType.MCQ); q.setQuestionText("Test MCQ?");
        q.setPoints(10); q.setOrderIndex(0); q.setOptions(List.of(opt1, opt2));

        BulkQuestionsRequest bulk = new BulkQuestionsRequest();
        bulk.setQuestions(List.of(q));
        quizService.bulkAddQuestions(created.getId(), bulk, admin, "127.0.0.1", "Test");

        quizService.publishQuiz(created.getId(), new PublishQuizRequest(), admin, "127.0.0.1", "Test");
        return quizRepository.findById(created.getId()).orElseThrow();
    }

    private Quiz buildAndPublishQuizWithMultiSelect(Category category) {
        CreateQuizRequest req = buildCreateQuizRequest("Multi-Select Quiz", category.getId());
        QuizResponse created = quizService.createQuiz(req, admin, "127.0.0.1", "Test");

        BulkQuestionsRequest.OptionItem opt1 = new BulkQuestionsRequest.OptionItem();
        opt1.setOptionText("Correct 1"); opt1.setIsCorrect(true); opt1.setOrderIndex(0);
        BulkQuestionsRequest.OptionItem opt2 = new BulkQuestionsRequest.OptionItem();
        opt2.setOptionText("Correct 2"); opt2.setIsCorrect(true); opt2.setOrderIndex(1);
        BulkQuestionsRequest.OptionItem opt3 = new BulkQuestionsRequest.OptionItem();
        opt3.setOptionText("Wrong 1"); opt3.setIsCorrect(false); opt3.setOrderIndex(2);

        BulkQuestionsRequest.QuestionItem q = new BulkQuestionsRequest.QuestionItem();
        q.setType(QuestionType.MULTI_SELECT); q.setQuestionText("Select all correct?");
        q.setPoints(10); q.setOrderIndex(0); q.setOptions(List.of(opt1, opt2, opt3));

        BulkQuestionsRequest bulk = new BulkQuestionsRequest();
        bulk.setQuestions(List.of(q));
        quizService.bulkAddQuestions(created.getId(), bulk, admin, "127.0.0.1", "Test");
        quizService.publishQuiz(created.getId(), new PublishQuizRequest(), admin, "127.0.0.1", "Test");
        return quizRepository.findById(created.getId()).orElseThrow();
    }

    private CreateQuizRequest buildCreateQuizRequest(String title, UUID categoryId) {
        CreateQuizRequest req = new CreateQuizRequest();
        req.setTitle(title);
        req.setDescription("Test");
        req.setCategoryId(categoryId);
        req.setDifficulty(QuizDifficulty.MEDIUM);
        req.setEstimatedDuration(30);
        req.setPassingScore(50.0);
        req.setVisibility(QuizVisibility.PUBLIC);
        req.setTags(Set.of());
        return req;
    }

    private SaveAnswerRequest buildSaveAnswerRequest(UUID questionId, List<String> selectedIds) {
        SaveAnswerRequest req = new SaveAnswerRequest();
        req.setQuestionId(questionId);
        req.setSelectedOptionIds(selectedIds);
        return req;
    }
}
