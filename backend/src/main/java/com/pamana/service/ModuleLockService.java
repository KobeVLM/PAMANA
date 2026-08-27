package com.pamana.service;

import com.pamana.model.ModuleAttemptHistory;
import com.pamana.model.ModuleProgress;
import com.pamana.repository.ModuleAttemptHistoryRepository;
import com.pamana.repository.ModuleProgressRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;

import com.pamana.repository.SyllableProgressRepository;
import com.pamana.repository.SentenceProgressRepository;

@Service
public class ModuleLockService {

    private static final Logger log = LoggerFactory.getLogger(ModuleLockService.class);
    private final ModuleProgressRepository moduleProgressRepository;
    private final ModuleAttemptHistoryRepository moduleAttemptHistoryRepository;
    private final SyllableProgressRepository syllableProgressRepository;
    private final SentenceProgressRepository sentenceProgressRepository;

    public ModuleLockService(ModuleProgressRepository moduleProgressRepository,
                             ModuleAttemptHistoryRepository moduleAttemptHistoryRepository,
                             SyllableProgressRepository syllableProgressRepository,
                             SentenceProgressRepository sentenceProgressRepository) {
        this.moduleProgressRepository = moduleProgressRepository;
        this.moduleAttemptHistoryRepository = moduleAttemptHistoryRepository;
        this.syllableProgressRepository = syllableProgressRepository;
        this.sentenceProgressRepository = sentenceProgressRepository;
    }

    @Transactional
    public void resetModuleGameData(UUID userId, int moduleNumber) {
        log.info("Resetting game data for user {} and module {}", userId, moduleNumber);
        
        if (moduleNumber == 1) {
            syllableProgressRepository.deleteByUserId(userId);
        } else if (moduleNumber == 4) {
            sentenceProgressRepository.deleteByUserId(userId);
        }

        // Reset the ModuleProgress state so it appears as incomplete
        moduleProgressRepository.findByUserIdAndModuleNumber(userId, moduleNumber).ifPresent(p -> {
            p.setIsComplete(false);
            p.setAccuracy(null);
            moduleProgressRepository.save(p);
        });
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

        // 1. Mark completed module complete
        Optional<ModuleProgress> currentModuleOpt = moduleProgressRepository.findByUserIdAndModuleNumber(userId, completedModule);
        if (currentModuleOpt.isPresent()) {
            ModuleProgress progress = currentModuleOpt.get();
            progress.setIsComplete(true);
            progress.setAccuracy(BigDecimal.valueOf(finalAccuracy));
            moduleProgressRepository.save(progress);
            log.info("Marked Module {} complete for user: {}", completedModule, userId);
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
