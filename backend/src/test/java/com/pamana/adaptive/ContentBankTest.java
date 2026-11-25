package com.pamana.adaptive;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Verifies that the seeded Content Bank contains a distinct, structured pool
 * for every item and tier, and that the tier rules match the validation plan.
 */
@SpringBootTest
public class ContentBankTest {

    @Autowired
    private ContentBankRepository contentBankRepository;

    @Test
    public void everyItemHasAllThreeTiers() {
        // 19 vocabulary words + (4 sublevels x 5 sets) syllable rows, x3 tiers.
        assertThat(contentBankRepository.count()).isEqualTo((19 + 20) * 3);

        for (String word : List.of("mata", "kamay", "nanay", "bahay", "tulog")) {
            for (AdaptiveTier tier : AdaptiveTier.values()) {
                assertThat(lookup(TieredDistractors.ACTIVITY_VOCABULARY, word, tier)).isPresent();
            }
        }
        for (String subLevel : List.of("pagsama", "pakinggan", "kilalanin", "rhyming")) {
            for (int setId = 1; setId <= 5; setId++) {
                for (AdaptiveTier tier : AdaptiveTier.values()) {
                    assertThat(lookup(
                            TieredDistractors.ACTIVITY_SYLLABLE,
                            subLevel + ":" + setId,
                            tier)).isPresent();
                }
            }
        }
    }

    @Test
    public void everyPoolHasThreeDistinctDistractors() {
        for (ContentBankItem item : contentBankRepository.findAll()) {
            List<String> distractors = split(item.getDistractors());
            assertThat(distractors)
                    .as("%s / %s / %s", item.getActivity(), item.getItemKey(), item.getDifficultyTier())
                    .hasSize(3)
                    .doesNotHaveDuplicates()
                    .doesNotContain("");
        }
    }

    @Test
    public void foundationalVocabularyUsesDifferentInitialLetters() {
        ContentBankItem item = lookup(TieredDistractors.ACTIVITY_VOCABULARY, "mata", AdaptiveTier.FOUNDATIONAL)
                .orElseThrow();

        assertThat(split(item.getDistractors()))
                .allSatisfy(word -> assertThat(word.charAt(0)).isNotEqualTo('m'));
    }

    @Test
    public void eachVocabularyTierHasItsOwnPool() {
        String foundational = lookup(TieredDistractors.ACTIVITY_VOCABULARY, "mata", AdaptiveTier.FOUNDATIONAL)
                .orElseThrow().getDistractors();
        String standard = lookup(TieredDistractors.ACTIVITY_VOCABULARY, "mata", AdaptiveTier.STANDARD)
                .orElseThrow().getDistractors();
        String challenge = lookup(TieredDistractors.ACTIVITY_VOCABULARY, "mata", AdaptiveTier.CHALLENGE)
                .orElseThrow().getDistractors();

        assertThat(standard).isNotEqualTo(foundational);
        assertThat(challenge).isNotEqualTo(standard);
    }

    @Test
    public void foundationalSyllablesDifferInConsonantAndVowel() {
        String subLevel = "pagsama";
        int setId = 1;
        String target = SyllableContent.targetSyllable(subLevel, setId);
        String targetVowel = target.substring(target.length() - 1);
        String targetConsonant = target.substring(0, target.length() - 1);

        assertThat(split(pool(TieredDistractors.ACTIVITY_SYLLABLE, subLevel + ":" + setId,
                AdaptiveTier.FOUNDATIONAL)))
                .allSatisfy(option -> {
                    assertThat(option.substring(option.length() - 1)).isNotEqualTo(targetVowel);
                    assertThat(option.substring(0, option.length() - 1)).isNotEqualTo(targetConsonant);
                });
    }

    @Test
    public void challengeSyllablesKeepTheTargetVowel() {
        String subLevel = "pakinggan";
        int setId = 2;
        String target = SyllableContent.targetSyllable(subLevel, setId);
        String targetVowel = target.substring(target.length() - 1);

        assertThat(split(pool(TieredDistractors.ACTIVITY_SYLLABLE, subLevel + ":" + setId,
                AdaptiveTier.CHALLENGE)))
                .allSatisfy(option ->
                        assertThat(option.substring(option.length() - 1)).isEqualTo(targetVowel));
    }

    @Test
    public void standardSyllablesPreserveTheLegacyPool() {
        String subLevel = "pagsama";
        int setId = 1;
        String target = SyllableContent.targetSyllable(subLevel, setId);
        String vowel = target.substring(target.length() - 1);
        String consonant = target.substring(0, target.length() - 1);

        assertThat(split(pool(TieredDistractors.ACTIVITY_SYLLABLE, subLevel + ":" + setId,
                AdaptiveTier.STANDARD)))
                .allSatisfy(option -> {
                    assertThat(option.substring(0, option.length() - 1)).isEqualTo(consonant);
                    assertThat(option.substring(option.length() - 1)).isNotEqualTo(vowel);
                });
    }

    private String pool(String activity, String itemKey, AdaptiveTier tier) {
        return lookup(activity, itemKey, tier).orElseThrow().getDistractors();
    }

    private Optional<ContentBankItem> lookup(String activity, String itemKey, AdaptiveTier tier) {
        return contentBankRepository.findByActivityAndItemKeyAndDifficultyTier(
                activity, itemKey.toLowerCase(Locale.ROOT), tier.value());
    }

    private List<String> split(String distractors) {
        return Arrays.asList(distractors.split(","));
    }
}
