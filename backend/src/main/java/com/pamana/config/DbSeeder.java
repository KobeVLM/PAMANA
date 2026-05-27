package com.pamana.config;

import com.pamana.model.VocabularyItem;
import com.pamana.repository.VocabularyItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.List;

@Component
public class DbSeeder implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DbSeeder.class);
    private final VocabularyItemRepository vocabularyItemRepository;

    public DbSeeder(VocabularyItemRepository vocabularyItemRepository) {
        this.vocabularyItemRepository = vocabularyItemRepository;
    }

    @Override
    public void run(String... args) throws Exception {
        if (vocabularyItemRepository.count() == 0) {
            log.info("No vocabulary items detected in database. Seeding standard MATATAG Q1-Q2 Filipino words...");

            List<VocabularyItem> items = Arrays.asList(
                // Module 2: Self & Body (10 words)
                new VocabularyItem("mata", "self_body", "/static/assets/audio/mata.wav", "/static/assets/images/mata.png", 1),
                new VocabularyItem("kamay", "self_body", "/static/assets/audio/kamay.wav", "/static/assets/images/kamay.png", 2),
                new VocabularyItem("ilong", "self_body", "/static/assets/audio/ilong.wav", "/static/assets/images/ilong.png", 3),
                new VocabularyItem("bibig", "self_body", "/static/assets/audio/bibig.wav", "/static/assets/images/bibig.png", 4),
                new VocabularyItem("tenga", "self_body", "/static/assets/audio/tenga.wav", "/static/assets/images/tenga.png", 5),
                new VocabularyItem("ulo", "self_body", "/static/assets/audio/ulo.wav", "/static/assets/images/ulo.png", 6),
                new VocabularyItem("paa", "self_body", "/static/assets/audio/paa.wav", "/static/assets/images/paa.png", 7),
                new VocabularyItem("likod", "self_body", "/static/assets/audio/likod.wav", "/static/assets/images/likod.png", 8),
                new VocabularyItem("tiyan", "self_body", "/static/assets/audio/tiyan.wav", "/static/assets/images/tiyan.png", 9),
                new VocabularyItem("noo", "self_body", "/static/assets/audio/noo.wav", "/static/assets/images/noo.png", 10),

                // Module 3: Family & Home (15 words)
                new VocabularyItem("Nanay", "family_home", "/static/assets/audio/nanay.wav", "/static/assets/images/nanay.png", 11),
                new VocabularyItem("Tatay", "family_home", "/static/assets/audio/tatay.wav", "/static/assets/images/tatay.png", 12),
                new VocabularyItem("Lola", "family_home", "/static/assets/audio/lola.wav", "/static/assets/images/lola.png", 13),
                new VocabularyItem("Lolo", "family_home", "/static/assets/audio/lolo.wav", "/static/assets/images/lolo.png", 14),
                new VocabularyItem("Kuya", "family_home", "/static/assets/audio/kuya.wav", "/static/assets/images/kuya.png", 15),
                new VocabularyItem("Ate", "family_home", "/static/assets/audio/ate.wav", "/static/assets/images/ate.png", 16),
                new VocabularyItem("bahay", "family_home", "/static/assets/audio/bahay.wav", "/static/assets/images/bahay.png", 17),
                new VocabularyItem("kain", "family_home", "/static/assets/audio/kain.wav", "/static/assets/images/kain.png", 18),
                new VocabularyItem("tulog", "family_home", "/static/assets/audio/tulog.wav", "/static/assets/images/tulog.png", 19),
                new VocabularyItem("damit", "family_home", "/static/assets/audio/damit.wav", "/static/assets/images/damit.png", 20),
                new VocabularyItem("sapatos", "family_home", "/static/assets/audio/sapatos.wav", "/static/assets/images/sapatos.png", 21),
                new VocabularyItem("silya", "family_home", "/static/assets/audio/silya.wav", "/static/assets/images/silya.png", 22),
                new VocabularyItem("mesa", "family_home", "/static/assets/audio/mesa.wav", "/static/assets/images/mesa.png", 23),
                new VocabularyItem("pintuan", "family_home", "/static/assets/audio/pintuan.wav", "/static/assets/images/pintuan.png", 24),
                new VocabularyItem("baso", "family_home", "/static/assets/audio/baso.wav", "/static/assets/images/baso.png", 25)
            );

            vocabularyItemRepository.saveAll(items);
            log.info("Successfully seeded {} vocabulary items.", items.size());
        } else {
            log.info("Vocabulary items already seeded (Count: {}). Skipping seeder.", vocabularyItemRepository.count());
        }
    }
}
