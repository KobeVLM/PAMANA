package com.pamana.adaptive;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * Seeds the tiered Content Bank once, in both production and the H2 test
 * profile (which disables Flyway and builds the schema from entities).
 *
 * <p>Rows are derived from the same word lists and syllable arrays the legacy
 * generator used, with {@link TieredDistractors} supplying the three pools.
 * Seeding is idempotent: existing rows are never overwritten, so a deployment
 * can safely add or edit a pool by hand later.
 */
@Component
@Order(2)
public class ContentBankSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ContentBankSeeder.class);

    private static final List<String> SELF_BODY_WORDS = List.of(
            "mata", "kamay", "ilong", "bibig", "tenga", "ulo", "paa", "likod", "tiyan", "noo");
    private static final List<String> FAMILY_HOME_WORDS = List.of(
            "nanay", "tatay", "lola", "lolo", "kuya", "ate", "bahay", "kain", "tulog");
    private static final List<String> SUB_LEVELS = List.of(
            "pagsama", "pakinggan", "kilalanin", "rhyming");

    private final ContentBankRepository contentBankRepository;

    public ContentBankSeeder(ContentBankRepository contentBankRepository) {
        this.contentBankRepository = contentBankRepository;
    }

    @Override
    public void run(String... args) {
        if (contentBankRepository.count() > 0) {
            log.info("Content Bank already has {} rows; skipping seed.", contentBankRepository.count());
            return;
        }

        List<ContentBankItem> rows = new ArrayList<>();
        rows.addAll(vocabularyRows(SELF_BODY_WORDS));
        rows.addAll(vocabularyRows(FAMILY_HOME_WORDS));
        rows.addAll(syllableRows());

        contentBankRepository.saveAll(rows);
        log.info("Seeded {} tiered Content Bank rows.", rows.size());
    }

    private List<ContentBankItem> vocabularyRows(List<String> domainWords) {
        List<ContentBankItem> rows = new ArrayList<>();
        for (String word : domainWords) {
            String key = word.toLowerCase(Locale.ROOT);
            for (AdaptiveTier tier : AdaptiveTier.values()) {
                List<String> distractors = TieredDistractors.forVocabulary(word, domainWords, tier);
                rows.add(new ContentBankItem(
                        TieredDistractors.ACTIVITY_VOCABULARY,
                        key,
                        tier.value(),
                        String.join(",", distractors),
                        null));
            }
        }
        return rows;
    }

    private List<ContentBankItem> syllableRows() {
        List<ContentBankItem> rows = new ArrayList<>();
        for (String subLevel : SUB_LEVELS) {
            for (int setId = 1; setId <= 5; setId++) {
                for (AdaptiveTier tier : AdaptiveTier.values()) {
                    List<String> distractors = TieredDistractors.forSyllable(subLevel, setId, tier);
                    rows.add(new ContentBankItem(
                            TieredDistractors.ACTIVITY_SYLLABLE,
                            subLevel + ":" + setId,
                            tier.value(),
                            String.join(",", distractors),
                            SyllableContent.isWordContext(subLevel)
                                    ? SyllableContent.contextWord(subLevel, setId)
                                    : null));
                }
            }
        }
        return rows;
    }
}
