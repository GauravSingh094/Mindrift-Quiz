package com.mindrift.quiz.scoring;

import com.mindrift.quiz.entity.Question;
import com.mindrift.quiz.entity.QuestionOption;
import com.mindrift.quiz.entity.QuestionType;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Production-grade scoring engine supporting:
 *  - MCQ / TRUE_FALSE: full marks or zero (+ optional negative marking)
 *  - MULTI_SELECT: proportional partial credit with optional negative marking per wrong selection
 */
@Service
public class DefaultScoringService implements ScoringService {

    @Override
    public ScoreResult calculateQuestionScore(Question question,
                                              List<String> selectedOptionIds,
                                              double negativeMarkingFraction) {

        double maxPts = question.getPoints().doubleValue();

        if (selectedOptionIds == null || selectedOptionIds.isEmpty()) {
            return ScoreResult.unanswered(maxPts);
        }

        Set<String> selectedSet = Set.copyOf(selectedOptionIds);
        List<QuestionOption> options = question.getOptions();

        Set<String> correctIds = options.stream()
                .filter(QuestionOption::getIsCorrect)
                .map(o -> o.getId().toString())
                .collect(Collectors.toSet());

        Set<String> incorrectIds = options.stream()
                .filter(o -> !o.getIsCorrect())
                .map(o -> o.getId().toString())
                .collect(Collectors.toSet());

        QuestionType type = question.getType();

        // ── MCQ / TRUE_FALSE ──────────────────────────────────────────────────
        if (type == QuestionType.MCQ || type == QuestionType.TRUE_FALSE) {
            if (selectedSet.size() == 1 && correctIds.contains(selectedSet.iterator().next())) {
                return ScoreResult.correct(maxPts);
            }
            // Negative marking for wrong answer
            double penalty = negativeMarkingFraction > 0.0
                    ? -(maxPts * negativeMarkingFraction)
                    : 0.0;
            return ScoreResult.incorrect(penalty);
        }

        // ── MULTI_SELECT ──────────────────────────────────────────────────────
        if (type == QuestionType.MULTI_SELECT) {
            if (correctIds.isEmpty()) {
                return ScoreResult.unanswered(maxPts); // malformed question safeguard
            }

            long numCorrectSelected   = selectedSet.stream().filter(correctIds::contains).count();
            long numIncorrectSelected = selectedSet.stream().filter(incorrectIds::contains).count();

            double correctFraction = (double) numCorrectSelected / correctIds.size();

            // Deduct per incorrect selection proportionally
            double incorrectPenaltyFraction = incorrectIds.isEmpty() ? 0.0
                    : (double) numIncorrectSelected / incorrectIds.size() * negativeMarkingFraction;

            double rawScore = Math.max(0.0, (correctFraction - incorrectPenaltyFraction) * maxPts);
            double finalScore = Math.round(rawScore * 100.0) / 100.0;

            if (finalScore >= maxPts) {
                return ScoreResult.correct(maxPts);
            } else if (finalScore > 0.0) {
                return ScoreResult.partial(finalScore, maxPts);
            } else {
                return ScoreResult.incorrect(
                        negativeMarkingFraction > 0.0 ? -(maxPts * negativeMarkingFraction * numIncorrectSelected) : 0.0);
            }
        }

        return ScoreResult.unanswered(maxPts);
    }
}
