package com.mindrift.quiz.scoring;

import com.mindrift.quiz.entity.Question;
import java.util.List;

/**
 * Contract for quiz scoring strategies.
 * Implementations must handle MCQ, TRUE_FALSE, and MULTI_SELECT question types
 * with support for negative marking and partial credit.
 */
public interface ScoringService {

    /**
     * Calculate the raw points earned for a single question.
     *
     * @param question          the question being scored
     * @param selectedOptionIds list of option UUIDs the user selected
     * @param negativeMarking   fraction to deduct for wrong answers (e.g. 0.25 = 25%)
     * @return score result containing pointsEarned, scoreType, and metadata
     */
    ScoreResult calculateQuestionScore(Question question, List<String> selectedOptionIds, double negativeMarking);

    /**
     * Legacy overload — no negative marking (backward compat).
     */
    default double calculateQuestionScore(Question question, List<String> selectedOptionIds) {
        return calculateQuestionScore(question, selectedOptionIds, 0.0).getPointsEarned();
    }
}
