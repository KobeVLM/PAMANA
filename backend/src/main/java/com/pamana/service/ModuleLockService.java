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

@Service
public class ModuleLockService {

    private static final Logger log = LoggerFactory.getLogger(ModuleLockService.class);
    private final ModuleProgressRepository moduleProgressRepository;
    private final ModuleAttemptHistoryRepository moduleAttemptHistoryRepository;

    public ModuleLockService(ModuleProgressRepository moduleProgressRepository,
                             ModuleAttemptHistoryRepository moduleAttemptHistoryRepository) {
        this.moduleProgressRepository = moduleProgressRepository;
        this.moduleAttemptHistoryRepository = moduleAttemptHistoryRepository;
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

        // 2. Unlock the next module (if completedModule is 1, 2, or 3)
        if (completedModule < 4) {
            int nextModule = completedModule + 1;
            Optional<ModuleProgress> nextModuleOpt = moduleProgressRepository.findByUserIdAndModuleNumber(userId, nextModule);
            if (nextModuleOpt.isPresent()) {
                ModuleProgress nextProgress = nextModuleOpt.get();
                nextProgress.setIsUnlocked(true);
                moduleProgressRepository.save(nextProgress);
                log.info("Unlocked Module {} for user: {}", nextModule, userId);
            }
        }
    }

    @Transactional(readOnly = true)
    public boolean isModuleUnlocked(UUID userId, int moduleNumber) {
        return moduleProgressRepository.findByUserIdAndModuleNumber(userId, moduleNumber)
                .map(ModuleProgress::getIsUnlocked)
                .orElse(false);
    }
}
