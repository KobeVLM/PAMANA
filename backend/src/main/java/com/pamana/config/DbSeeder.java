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
        List<VocabularyItem> existingItems = vocabularyItemRepository.findAll();
        if (!existingItems.isEmpty()) {
            boolean changed = false;
            for (VocabularyItem item : existingItems) {
                if (item.getAudioUrl() != null && item.getAudioUrl().contains("/static/assets/audio/")) {
                    item.setAudioUrl(item.getAudioUrl().replace("/static/assets/audio/", "/audio/words/"));
                    changed = true;
                }
                if (item.getImageUrl() != null && item.getImageUrl().contains("/static/assets/images/")) {
                    item.setImageUrl(item.getImageUrl().replace("/static/assets/images/", "/images/"));
                    changed = true;
                }
            }
            if (changed) {
                log.info("Updating existing vocabulary asset URLs to frontend paths...");
                vocabularyItemRepository.saveAll(existingItems);
            }
        }

        if (vocabularyItemRepository.count() == 0) {
            log.info("No vocabulary items detected in database. Seeding standard MATATAG Q1-Q2 Filipino words...");

            List<VocabularyItem> items = Arrays.asList(
                // Module 2: Self & Body (10 words)
                new VocabularyItem("mata",  "self_body",   "/audio/words/mata.mp3",  "/images/mata.png",  1),
                new VocabularyItem("kamay", "self_body",   "/audio/words/kamay.mp3", "/images/kamay.png", 2),
                new VocabularyItem("ilong", "self_body",   "/audio/words/ilong.mp3", "/images/ilong.png", 3),
                new VocabularyItem("bibig", "self_body",   "/audio/words/bibig.mp3", "/images/bibig.png", 4),
                new VocabularyItem("tenga", "self_body",   "/audio/words/tenga.mp3", "/images/tenga.png", 5),
                new VocabularyItem("ulo",   "self_body",   "/audio/words/ulo.mp3",   "/images/ulo.png",   6),
                new VocabularyItem("paa",   "self_body",   "/audio/words/paa.mp3",   "/images/paa.png",   7),
                new VocabularyItem("likod", "self_body",   "/audio/words/likod.mp3", "/images/likod.png", 8),
                new VocabularyItem("tiyan", "self_body",   "/audio/words/tiyan.mp3", "/images/tiyan.png", 9),
                new VocabularyItem("noo",   "self_body",   "/audio/words/noo.mp3",   "/images/noo.png",   10),

                // Module 3: Family & Home (15 words)
                new VocabularyItem("Nanay",   "family_home", "/audio/words/nanay.mp3",   "/images/nanay.png",   11),
                new VocabularyItem("Tatay",   "family_home", "/audio/words/tatay.mp3",   "/images/tatay.png",   12),
                new VocabularyItem("Lola",    "family_home", "/audio/words/lola.mp3",    "/images/lola.png",    13),
                new VocabularyItem("Lolo",    "family_home", "/audio/words/lolo.mp3",    "/images/lolo.png",    14),
                new VocabularyItem("Kuya",    "family_home", "/audio/words/kuya.mp3",    "/images/kuya.png",    15),
                new VocabularyItem("Ate",     "family_home", "/audio/words/ate.mp3",     "/images/ate.png",     16),
                new VocabularyItem("bahay",   "family_home", "/audio/words/bahay.mp3",   "/images/bahay.png",   17),
                new VocabularyItem("kain",    "family_home", "/audio/words/kain.mp3",    "/images/kain.png",    18),
                new VocabularyItem("tulog",   "family_home", "/audio/words/tulog.mp3",   "/images/tulog.png",   19),
                new VocabularyItem("damit",   "family_home", "/audio/words/damit.mp3",   "/images/damit.png",   20),
                new VocabularyItem("sapatos", "family_home", "/audio/words/sapatos.mp3", "/images/sapatos.png", 21),
                new VocabularyItem("silya",   "family_home", "/audio/words/silya.mp3",   "/images/silya.png",   22),
                new VocabularyItem("mesa",    "family_home", "/audio/words/mesa.mp3",    "/images/mesa.png",    23),
                new VocabularyItem("pintuan", "family_home", "/audio/words/pintuan.mp3", "/images/pintuan.png", 24),
                new VocabularyItem("baso",    "family_home", "/audio/words/baso.mp3",    "/images/baso.png",    25)
            );

            vocabularyItemRepository.saveAll(items);
            log.info("Successfully seeded {} vocabulary items.", items.size());
        } else {
            log.info("Vocabulary items already seeded (Count: {}). Skipping seeder.", vocabularyItemRepository.count());
        }
    }
}
