package com.pamana.adaptive;

import com.pamana.progress.AnswerEvent;
import com.pamana.progress.AnswerEventRepository;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

/**
 * Assigns a difficulty tier from the learner's most recent scored answers.
 *
 * <p>This is the "Dynamic Question Dispatcher" input for the Priority 3
 * refactor. It deliberately uses only the append-only answer log: mastery rows
 * keep the latest result per item and cannot describe a trend. A small sample
 * falls back to STANDARD so a brand-new learner is never penalised, and the
 * listening-only {@code pakinggan} step is excluded because it is not a scored
 * question.
 *
 * <p>The resolver is read-only and deterministic for a given history, so
 * repeated question requests in one session keep the same tier.
 */
@Service
public class AdaptiveTierResolver {

    public static final String ITEM_TYPE_VOCABULARY = "vocabulary_word";
    public static final String ITEM_TYPE_SYLLABLE = "syllable_set";

    /** Number of most-recent answers considered. */
    static final int WINDOW_SIZE = 10;
    /** Below this many scored answers there is not enough evidence to adapt. */
    static final int MIN_SCORED_EVENTS = 3;
    static final double FOUNDATIONAL_MAX_ACCURACY = 0.60;
    static final double CHALLENGE_MIN_ACCURACY = 0.85;

    private final AnswerEventRepository answerEventRepository;

    public AdaptiveTierResolver(AnswerEventRepository answerEventRepository) {
        this.answerEventRepository = answerEventRepository;
    }

    @Transactional(readOnly = true)
    public AdaptiveTier forVocabulary(UUID userId) {
        return resolve(userId, ITEM_TYPE_VOCABULARY, "pakinggan");
    }

    @Transactional(readOnly = true)
    public AdaptiveTier forSyllables(UUID userId) {
        return resolve(userId, ITEM_TYPE_SYLLABLE, null);
    }

    /**
     * Tier for an incoming answer event's item type. Activities outside the
     * Priority 3 scope (for example sentence tasks) stay at STANDARD so their
     * telemetry keeps the historical default.
     */
    @Transactional(readOnly = true)
    public AdaptiveTier forItemType(UUID userId, String itemType) {
        if (ITEM_TYPE_VOCABULARY.equalsIgnoreCase(itemType)) {
            return forVocabulary(userId);
        }
        if (ITEM_TYPE_SYLLABLE.equalsIgnoreCase(itemType)) {
            return forSyllables(userId);
        }
        return AdaptiveTier.STANDARD;
    }

    /**
     * @param excludedStep step to ignore (e.g. listening-only {@code pakinggan}),
     *                     or {@code null} to count every answer
     */
    @Transactional(readOnly = true)
    public AdaptiveTier resolve(UUID userId, String itemType, String excludedStep) {
        List<AnswerEvent> recent = answerEventRepository
                .findTop10ByUserIdAndItemTypeOrderByAnsweredAtDesc(userId, itemType);

        int scored = 0;
        int correct = 0;
        for (AnswerEvent event : recent) {
            if (event.getCorrect() == null) {
                continue;
            }
            if (excludedStep != null && excludedStep.equalsIgnoreCase(event.getStep())) {
                continue;
            }
            scored++;
            if (Boolean.TRUE.equals(event.getCorrect())) {
                correct++;
            }
        }

        if (scored < MIN_SCORED_EVENTS) {
            return AdaptiveTier.STANDARD;
        }

        double accuracy = (double) correct / scored;
        if (accuracy < FOUNDATIONAL_MAX_ACCURACY) {
            return AdaptiveTier.FOUNDATIONAL;
        }
        if (accuracy > CHALLENGE_MIN_ACCURACY) {
            return AdaptiveTier.CHALLENGE;
        }
        return AdaptiveTier.STANDARD;
    }
}
