package com.pamana.service;

import com.pamana.dto.SyllableProgressResponse;
import com.pamana.dto.SyllableStatusResponse;
import com.pamana.model.SyllableProgress;
import com.pamana.repository.SyllableProgressRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class SyllableService extends BaseGameService {

    private static final Logger log = LoggerFactory.getLogger(SyllableService.class);
    private final SyllableProgressRepository syllableProgressRepository;

    public SyllableService(SyllableProgressRepository syllableProgressRepository) {
        this.syllableProgressRepository = syllableProgressRepository;
    }

    @Transactional
    public SyllableProgressResponse evaluateAnswer(UUID userId, String subLevel, Integer setId, String answer, boolean isCorrect) {
        log.info("Evaluating Syllable answer: userId={}, subLevel={}, setId={}, correct={}", userId, subLevel, setId, isCorrect);

        // 1. Fetch or create the progress entry for this subLevel and setId
        SyllableProgress progress = syllableProgressRepository
                .findByUserIdAndSubLevelAndSetId(userId, subLevel, setId)
                .orElseGet(() -> {
                    SyllableProgress newRecord = new SyllableProgress(userId, subLevel, setId);
                    return syllableProgressRepository.save(newRecord);
                });

        // 2. Increment attempts and correctCount
        progress.setAttempts(progress.getAttempts() + 1);
        if (isCorrect) {
            progress.setCorrectCount(progress.getCorrectCount() + 1);
        }

        // 3. Compute accuracy
        double calculatedAccuracy = (progress.getCorrectCount() * 100.0) / progress.getAttempts();
        progress.setAccuracy(BigDecimal.valueOf(calculatedAccuracy).setScale(2, RoundingMode.HALF_UP));
        syllableProgressRepository.save(progress);

        // 4. Compute overall Module 1 progress
        double moduleAccuracy = computeModuleAccuracy(userId);
        boolean isModule1Completed = moduleAccuracy >= 80.0 && hasAttemptedAllSubLevels(userId);

        if (isModule1Completed) {
            moduleLockService.evaluateAndUnlock(userId, 1, moduleAccuracy);
        }

        // Standard logic: advance to the next set when they get it correct
        Integer nextSetId = setId;
        if (isCorrect) {
            nextSetId = setId + 1; // Unlock next phoneme set
        }

        boolean module2Unlocked = moduleLockService.isModuleUnlocked(userId, 2);

        return new SyllableProgressResponse(
                progress.getAttempts(),
                progress.getCorrectCount(),
                calculatedAccuracy,
                nextSetId,
                moduleAccuracy,
                module2Unlocked
        );
    }

    @Transactional(readOnly = true)
    public SyllableStatusResponse computeModuleStatus(UUID userId) {
        double pagsamaAcc = getSubLevelAverageAccuracy(userId, "pagsama");
        double pakingganAcc = getSubLevelAverageAccuracy(userId, "pakinggan");
        double kilalaninAcc = getSubLevelAverageAccuracy(userId, "kilalanin");
        double rhymingAcc = getSubLevelAverageAccuracy(userId, "rhyming");

        double overallAcc = computeModuleAccuracy(userId);
        boolean module2Unlocked = moduleLockService.isModuleUnlocked(userId, 2);
        boolean isComplete = overallAcc >= 80.0 && hasAttemptedAllSubLevels(userId);

        return new SyllableStatusResponse(
                pagsamaAcc,
                pakingganAcc,
                kilalaninAcc,
                rhymingAcc,
                overallAcc,
                isComplete,
                module2Unlocked
        );
    }

    public double computeModuleAccuracy(UUID userId) {
        double pagsamaAcc = getSubLevelAverageAccuracy(userId, "pagsama");
        double pakingganAcc = getSubLevelAverageAccuracy(userId, "pakinggan");
        double kilalaninAcc = getSubLevelAverageAccuracy(userId, "kilalanin");
        double rhymingAcc = getSubLevelAverageAccuracy(userId, "rhyming");

        return (pagsamaAcc + pakingganAcc + kilalaninAcc + rhymingAcc) / 4.0;
    }

    private double getSubLevelAverageAccuracy(UUID userId, String subLevel) {
        List<SyllableProgress> records = syllableProgressRepository.findByUserIdAndSubLevel(userId, subLevel);
        if (records.isEmpty()) {
            return 0.0;
        }

        double sum = 0.0;
        for (SyllableProgress p : records) {
            sum += p.getAccuracy().doubleValue();
        }
        return sum / records.size();
    }

    private boolean hasAttemptedAllSubLevels(UUID userId) {
        List<SyllableProgress> allProgress = syllableProgressRepository.findByUserId(userId);
        boolean pagsama = false;
        boolean pakinggan = false;
        boolean kilalanin = false;
        boolean rhyming = false;

        for (SyllableProgress p : allProgress) {
            if ("pagsama".equalsIgnoreCase(p.getSubLevel())) pagsama = true;
            if ("pakinggan".equalsIgnoreCase(p.getSubLevel())) pakinggan = true;
            if ("kilalanin".equalsIgnoreCase(p.getSubLevel())) kilalanin = true;
            if ("rhyming".equalsIgnoreCase(p.getSubLevel())) rhyming = true;
        }

        return pagsama && pakinggan && kilalanin && rhyming;
    }
}
