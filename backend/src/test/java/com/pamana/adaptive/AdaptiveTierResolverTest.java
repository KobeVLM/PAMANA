package com.pamana.adaptive;

import com.pamana.progress.AnswerEvent;
import com.pamana.progress.AnswerEventRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies the adaptive-only tier policy: a small sample stays at STANDARD,
 * sustained struggle drops to FOUNDATIONAL, sustained success rises to
 * CHALLENGE, and passive listening never inflates vocabulary accuracy.
 */
@SpringBootTest
public class AdaptiveTierResolverTest {

    @Autowired
    private AdaptiveTierResolver resolver;

    @Autowired
    private AnswerEventRepository answerEventRepository;

    private UUID userId;

    @BeforeEach
    public void setup() {
        answerEventRepository.deleteAll();
        userId = UUID.randomUUID();
    }

    @Test
    public void newLearnerStartsAtStandard() {
        assertThat(resolver.forVocabulary(userId)).isEqualTo(AdaptiveTier.STANDARD);
        assertThat(resolver.forSyllables(userId)).isEqualTo(AdaptiveTier.STANDARD);
    }

    @Test
    public void fewerThanThreeScoredAnswersStaysAtStandard() {
        record("vocabulary_word", "kilalanin", true);
        record("vocabulary_word", "basahin", true);

        assertThat(resolver.forVocabulary(userId)).isEqualTo(AdaptiveTier.STANDARD);
    }

    @Test
    public void lowAccuracyDropsToFoundational() {
        for (int i = 0; i < 10; i++) {
            record("vocabulary_word", "kilalanin", i < 3);
        }

        assertThat(resolver.forVocabulary(userId)).isEqualTo(AdaptiveTier.FOUNDATIONAL);
    }

    @Test
    public void highAccuracyRisesToChallenge() {
        for (int i = 0; i < 10; i++) {
            record("syllable_set", "pagsama", i < 9);
        }

        assertThat(resolver.forSyllables(userId)).isEqualTo(AdaptiveTier.CHALLENGE);
    }

    @Test
    public void middleAccuracyStaysAtStandard() {
        for (int i = 0; i < 10; i++) {
            record("vocabulary_word", "gamitin", i < 7);
        }

        assertThat(resolver.forVocabulary(userId)).isEqualTo(AdaptiveTier.STANDARD);
    }

    @Test
    public void listeningOnlyStepsDoNotAffectVocabularyTier() {
        for (int i = 0; i < 10; i++) {
            record("vocabulary_word", "pakinggan", true);
        }

        assertThat(resolver.forVocabulary(userId)).isEqualTo(AdaptiveTier.STANDARD);
    }

    @Test
    public void onlyTheTenMostRecentAnswersCount() {
        LocalDateTime base = LocalDateTime.now().minusMinutes(30);
        // Old struggles should be forgotten once the learner has a strong run.
        for (int i = 0; i < 10; i++) {
            recordAt("syllable_set", "pagsama", false, base.plusSeconds(i));
        }
        for (int i = 0; i < 10; i++) {
            recordAt("syllable_set", "pagsama", true, base.plusMinutes(10).plusSeconds(i));
        }

        assertThat(resolver.forSyllables(userId)).isEqualTo(AdaptiveTier.CHALLENGE);
    }

    @Test
    public void eachActivityHasItsOwnTier() {
        for (int i = 0; i < 10; i++) {
            record("vocabulary_word", "kilalanin", false);
        }
        for (int i = 0; i < 10; i++) {
            record("syllable_set", "pagsama", true);
        }

        assertThat(resolver.forVocabulary(userId)).isEqualTo(AdaptiveTier.FOUNDATIONAL);
        assertThat(resolver.forSyllables(userId)).isEqualTo(AdaptiveTier.CHALLENGE);
    }

    @Test
    public void tiersCarryTheFilipinoLabels() {
        assertThat(AdaptiveTier.FOUNDATIONAL.getLabel()).isEqualTo("Madali");
        assertThat(AdaptiveTier.STANDARD.getLabel()).isEqualTo("Katamtaman");
        assertThat(AdaptiveTier.CHALLENGE.getLabel()).isEqualTo("Mahirap");
    }

    private void record(String itemType, String step, boolean correct) {
        recordAt(itemType, step, correct, LocalDateTime.now());
    }

    private void recordAt(String itemType, String step, boolean correct, LocalDateTime answeredAt) {
        AnswerEvent event = new AnswerEvent(
                userId,
                UUID.randomUUID(),
                "module",
                itemType,
                UUID.randomUUID() + ":" + step,
                step,
                1,
                1,
                correct);
        event.setAnsweredAt(answeredAt);
        answerEventRepository.save(event);
    }
}
