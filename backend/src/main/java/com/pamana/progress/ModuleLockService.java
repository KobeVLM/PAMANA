package com.pamana.progress;

import com.pamana.syllable.SyllableProgressRepository;
import com.pamana.sentence.SentenceProgressRepository;
import com.pamana.progress.ModuleLockService;
import com.pamana.progress.ModuleAttemptHistoryRepository;
import com.pamana.progress.ModuleProgressRepository;
import com.pamana.progress.ModuleAttemptHistory;
import com.pamana.progress.ModuleProgress;
import com.pamana.vocabulary.VocabularyItem;
import com.pamana.vocabulary.VocabularyItemRepository;
import com.pamana.vocabulary.WordMasteryRepository;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;


@Service
public class ModuleLockService {

    private static final Logger log = LoggerFactory.getLogger(ModuleLockService.class);
    private final ModuleProgressRepository moduleProgressRepository;
    private final ModuleAttemptHistoryRepository moduleAttemptHistoryRepository;
    private final SyllableProgressRepository syllableProgressRepository;
    private final SentenceProgressRepository sentenceProgressRepository;
    private final VocabularyItemRepository vocabularyItemRepository;
    private final WordMasteryRepository wordMasteryRepository;

    public ModuleLockService(ModuleProgressRepository moduleProgressRepository,
                             ModuleAttemptHistoryRepository moduleAttemptHistoryRepository,
                             SyllableProgressRepository syllableProgressRepository,
                             SentenceProgressRepository sentenceProgressRepository,
                             VocabularyItemRepository vocabularyItemRepository,
                             WordMasteryRepository wordMasteryRepository) {
        this.moduleProgressRepository = moduleProgressRepository;
        this.moduleAttemptHistoryRepository = moduleAttemptHistoryRepository;
        this.syllableProgressRepository = syllableProgressRepository;
        this.sentenceProgressRepository = sentenceProgressRepository;
        this.vocabularyItemRepository = vocabularyItemRepository;
        this.wordMasteryRepository = wordMasteryRepository;
    }

    /**
     * Clears the in-progress attempt data for a module so it can be played from
     * the start again. The saved completion and score in {@link ModuleProgress}
     * are deliberately left untouched: they are only rewritten once the new
     * attempt is actually finished (see {@link #evaluateAndUnlock}).
     */
    @Transactional
    public void resetModuleGameData(UUID userId, int moduleNumber) {
        log.info("Restarting attempt for user {} and module {} (saved result is kept)", userId, moduleNumber);

        if (moduleNumber == 1) {
            syllableProgressRepository.deleteByUserId(userId);
        } else if (moduleNumber == 4) {
            sentenceProgressRepository.deleteByUserId(userId);
        } else if (moduleNumber == 2 || moduleNumber == 3) {
            String domain = moduleNumber == 2 ? "self_body" : "family_home";
            List<UUID> itemIds = new ArrayList<>();
            for (VocabularyItem item : vocabularyItemRepository.findByDomain(domain)) {
                itemIds.add(item.getId());
            }
            if (!itemIds.isEmpty()) {
                wordMasteryRepository.deleteByUserIdAndVocabItemIdIn(userId, itemIds);
            }
        }
    }

    @Transactional
    public void evaluateAndUnlock(UUID userId, int completedModule, double finalAccuracy) {
        log.info("Evaluating module lock status for user: {}, completedModule: {}, accuracy: {}%", 
                userId, completedModule, finalAccuracy);

        // Record Attempt History
        Integer currentMaxAttempt = moduleAttemptHistoryRepository.findMaxAttemptNumberByUserIdAndModuleNumber(userId, completedModule);
        ModuleAttemptHistory history = new ModuleAttemptHistory(
                userId, 
                completedModule, 
                currentMaxAttempt + 1, 
                BigDecimal.valueOf(finalAccuracy)
        );
        moduleAttemptHistoryRepository.save(history);
        log.info("Recorded ModuleAttemptHistory for user: {}, module: {}, attempt: {}, accuracy: {}", 
                userId, completedModule, currentMaxAttempt + 1, finalAccuracy);

        // 1. Mark completed module complete, keeping the best score ever achieved
        Optional<ModuleProgress> currentModuleOpt = moduleProgressRepository.findByUserIdAndModuleNumber(userId, completedModule);
        if (currentModuleOpt.isPresent()) {
            ModuleProgress progress = currentModuleOpt.get();
            BigDecimal incoming = BigDecimal.valueOf(finalAccuracy);
            BigDecimal saved = progress.getAccuracy();
            progress.setIsComplete(true);
            if (saved == null || incoming.compareTo(saved) > 0) {
                progress.setAccuracy(incoming);
            }
            moduleProgressRepository.save(progress);
            log.info("Marked Module {} complete for user: {} (attempt {}%, saved {}%)",
                    completedModule, userId, finalAccuracy, progress.getAccuracy());
        }

        // 2. Unlock the next module (Module 1 requires >= 80%, Modules 2 & 3 require >= 75%)
        boolean shouldUnlockNext = false;
        if (completedModule == 1 && finalAccuracy >= 80.0) {
            shouldUnlockNext = true;
        } else if ((completedModule == 2 || completedModule == 3) && finalAccuracy >= 75.0) {
            shouldUnlockNext = true;
        }

        if (completedModule < 4 && shouldUnlockNext) {
            int nextModule = completedModule + 1;
            Optional<ModuleProgress> nextModuleOpt = moduleProgressRepository.findByUserIdAndModuleNumber(userId, nextModule);
            if (nextModuleOpt.isPresent()) {
                ModuleProgress nextProgress = nextModuleOpt.get();
                nextProgress.setIsUnlocked(true);
                moduleProgressRepository.save(nextProgress);
                log.info("Unlocked Module {} for user: {}", nextModule, userId);
            }
        } else if (completedModule < 4) {
            log.info("Did NOT unlock next module for user: {} because accuracy {} did not meet the threshold (80% for Mod1, 75% for Mod2/3)", userId, finalAccuracy);
        }
    }

    @Transactional(readOnly = true)
    public boolean isModuleUnlocked(UUID userId, int moduleNumber) {
        return moduleProgressRepository.findByUserIdAndModuleNumber(userId, moduleNumber)
                .map(ModuleProgress::getIsUnlocked)
                .orElse(false);
    }
}
