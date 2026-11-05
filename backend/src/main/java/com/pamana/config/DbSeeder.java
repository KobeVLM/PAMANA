package com.pamana.config;

import com.pamana.vocabulary.VocabularyItemRepository;
import com.pamana.vocabulary.VocabularyItem;
import com.pamana.vocabulary.WordMasteryRepository;

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
    private final WordMasteryRepository wordMasteryRepository;

    public DbSeeder(VocabularyItemRepository vocabularyItemRepository, WordMasteryRepository wordMasteryRepository) {
        this.vocabularyItemRepository = vocabularyItemRepository;
        this.wordMasteryRepository = wordMasteryRepository;
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

            // Remove out-of-scope words without custom audio
            List<String> unneeded = List.of("laro", "luto", "linis", "basa", "ligo", "kapatid");
            List<VocabularyItem> toRemove = existingItems.stream()
                .filter(item -> unneeded.contains(item.getWord().toLowerCase()))
                .toList();
            if (!toRemove.isEmpty()) {
                log.info("Removing {} out-of-scope vocabulary items without audio: {}", toRemove.size(), unneeded);
                for (VocabularyItem rm : toRemove) {
                    wordMasteryRepository.findAll().stream()
                        .filter(wm -> wm.getVocabItemId().equals(rm.getId()))
                        .forEach(wordMasteryRepository::delete);
                    vocabularyItemRepository.delete(rm);
                }
            }
        }

        if (vocabularyItemRepository.count() == 0) {
            log.info("No vocabulary items detected in database. Seeding standard MATATAG Q1-Q2 Filipino words...");

            List<VocabularyItem> items = Arrays.asList(
                // Module 2: Self & Body (10 words)
                new VocabularyItem("mata",  "self_body",   "/audio/words/mata.mp3",  "/images/module2/mata.png",  1),
                new VocabularyItem("kamay", "self_body",   "/audio/words/kamay.mp3", "/images/module2/kamay.png", 2),
                new VocabularyItem("ilong", "self_body",   "/audio/words/ilong.mp3", "/images/module2/ilong.png", 3),
                new VocabularyItem("bibig", "self_body",   "/audio/words/bibig.mp3", "/images/module2/bibig.png", 4),
                new VocabularyItem("tenga", "self_body",   "/audio/words/tenga.mp3", "/images/module2/tenga.png", 5),
                new VocabularyItem("ulo",   "self_body",   "/audio/words/ulo.mp3",   "/images/module2/ulo.png",   6),
                new VocabularyItem("paa",   "self_body",   "/audio/words/paa.mp3",   "/images/module2/paa.png",   7),
                new VocabularyItem("likod", "self_body",   "/audio/words/likod.mp3", "/images/module2/likod.png", 8),
                new VocabularyItem("tiyan", "self_body",   "/audio/words/tiyan.mp3", "/images/module2/tiyan.png", 9),
                new VocabularyItem("noo",   "self_body",   "/audio/words/noo.mp3",   "/images/module2/noo.png",   10),
                // Module 3: Family & Home (9 words with custom audio)
                new VocabularyItem("Nanay",   "family_home", "/audio/words/nanay.mp3",   "/images/module3/nanay.png",   11),
                new VocabularyItem("Tatay",   "family_home", "/audio/words/tatay.mp3",   "/images/module3/tatay.png",   12),
                new VocabularyItem("Lola",    "family_home", "/audio/words/lola.mp3",    "/images/module3/lola.png",    13),
                new VocabularyItem("Lolo",    "family_home", "/audio/words/lolo.mp3",    "/images/module3/lolo.png",    14),
                new VocabularyItem("Kuya",    "family_home", "/audio/words/kuya.mp3",    "/images/module3/kuya.png",    15),
                new VocabularyItem("Ate",     "family_home", "/audio/words/ate.mp3",     "/images/module3/ate.png",     16),
                new VocabularyItem("bahay",   "family_home", "/audio/words/bahay.mp3",   "/images/module3/bahay.png",   17),
                new VocabularyItem("kain",    "family_home", "/audio/words/kain.mp3",    "/images/module3/kain.png",    18),
                new VocabularyItem("tulog",   "family_home", "/audio/words/tulog.mp3",   "/images/module3/tulog.png",   19)
            );

            vocabularyItemRepository.saveAll(items);
            log.info("Successfully seeded {} vocabulary items.", items.size());
        } else {
            log.info("Vocabulary items count: {}.", vocabularyItemRepository.count());
        }
    }
}
