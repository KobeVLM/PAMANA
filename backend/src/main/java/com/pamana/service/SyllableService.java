package com.pamana.service;

import com.pamana.dto.SyllableProgressResponse;
import com.pamana.dto.SyllableStatusResponse;
import com.pamana.dto.SyllableSetResponse;
import com.pamana.model.SyllableProgress;
import com.pamana.repository.SyllableProgressRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Service
public class SyllableService extends BaseGameService {

    private static final Logger log = LoggerFactory.getLogger(SyllableService.class);
    private final SyllableProgressRepository syllableProgressRepository;

    public SyllableService(SyllableProgressRepository syllableProgressRepository) {
        this.syllableProgressRepository = syllableProgressRepository;
    }

    @Transactional
    public SyllableProgressResponse evaluateAnswer(UUID userId, String subLevel, Integer setId, String answer,
            boolean isCorrect) {
        log.info("Evaluating Syllable answer: userId={}, subLevel={}, setId={}, correct={}", userId, subLevel, setId,
                isCorrect);

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
                module2Unlocked);
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
                module2Unlocked);
    }

    public double computeModuleAccuracy(UUID userId) {
        double pagsamaAcc = getSubLevelAverageAccuracy(userId, "pagsama");
        double pakingganAcc = getSubLevelAverageAccuracy(userId, "pakinggan");
        double kilalaninAcc = getSubLevelAverageAccuracy(userId, "kilalanin");
        double rhymingAcc = getSubLevelAverageAccuracy(userId, "rhyming");

        // Module 1 accuracy is the average of all 4 sub-levels
        double rawAvg = (pagsamaAcc + pakingganAcc + kilalaninAcc + rhymingAcc) / 4.0;
        return BigDecimal.valueOf(rawAvg).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private double getSubLevelAverageAccuracy(UUID userId, String subLevel) {
        List<SyllableProgress> records = syllableProgressRepository.findByUserIdAndSubLevel(userId, subLevel);
        if (records == null || records.isEmpty()) {
            return 0.0;
        }
        double sum = records.stream().mapToDouble(r -> r.getAccuracy().doubleValue()).sum();
        return BigDecimal.valueOf(sum / records.size()).setScale(2, RoundingMode.HALF_UP).doubleValue();
    }

    private boolean hasAttemptedAllSubLevels(UUID userId) {
        List<SyllableProgress> allProgress = syllableProgressRepository.findByUserId(userId);
        boolean pagsama = false;
        boolean pakinggan = false;
        boolean kilalanin = false;
        boolean rhyming = false;

        for (SyllableProgress p : allProgress) {
            if ("pagsama".equalsIgnoreCase(p.getSubLevel()))
                pagsama = true;
            if ("pakinggan".equalsIgnoreCase(p.getSubLevel()))
                pakinggan = true;
            if ("kilalanin".equalsIgnoreCase(p.getSubLevel()))
                kilalanin = true;
            if ("rhyming".equalsIgnoreCase(p.getSubLevel()))
                rhyming = true;
        }

        return pagsama && pakinggan && kilalanin && rhyming;
    }

    @Transactional(readOnly = true)
    public SyllableSetResponse getSyllableSet(String subLevel, int setId, UUID userId) {
        log.info("Generating syllable set for subLevel: {}, setId: {}", subLevel, setId);
        SyllableSetResponse response = new SyllableSetResponse();
        response.setSetId(setId);
        response.setSubLevel(subLevel);

        List<SyllableSetResponse.Option> options = new ArrayList<>();

        if ("pagsama".equals(subLevel)) {
            response.setConsonant("B");
            response.setVowel("A");
            response.setTargetSyllable("BA");
            response.setConsonantAudioUrl("/audio/phonemes/b.mp3");
            response.setVowelAudioUrl("/audio/phonemes/a.mp3");
            options.add(new SyllableSetResponse.Option("BA", "BA"));
            options.add(new SyllableSetResponse.Option("MA", "MA"));
            options.add(new SyllableSetResponse.Option("TA", "TA"));
            options.add(new SyllableSetResponse.Option("SA", "SA"));
        } else if ("pakinggan".equals(subLevel)) {
            response.setTargetSyllable("MA");
            response.setAudioUrl("/audio/syllables/ma.mp3");
            options.add(new SyllableSetResponse.Option("BA", "BA"));
            options.add(new SyllableSetResponse.Option("MA", "MA"));
            options.add(new SyllableSetResponse.Option("TA", "TA"));
            options.add(new SyllableSetResponse.Option("SA", "SA"));
        } else if ("kilalanin".equals(subLevel)) {
            response.setTargetSyllable("TA");
            response.setAudioUrl("/audio/words/tao.mp3");
            options.add(new SyllableSetResponse.Option("BA", "BA"));
            options.add(new SyllableSetResponse.Option("MA", "MA"));
            options.add(new SyllableSetResponse.Option("TA", "TA"));
            options.add(new SyllableSetResponse.Option("SA", "SA"));
        } else if ("rhyming".equals(subLevel)) {
            response.setTargetSyllable("SA");
            response.setAudioUrl("/audio/words/basa.mp3");
            options.add(new SyllableSetResponse.Option("BA", "BA"));
            options.add(new SyllableSetResponse.Option("MA", "MA"));
            options.add(new SyllableSetResponse.Option("TA", "TA"));
            options.add(new SyllableSetResponse.Option("SA", "SA"));
        } else {
            // Default
            response.setTargetSyllable("PA");
            options.add(new SyllableSetResponse.Option("PA", "PA"));
            options.add(new SyllableSetResponse.Option("KA", "KA"));
            options.add(new SyllableSetResponse.Option("NA", "NA"));
            options.add(new SyllableSetResponse.Option("LA", "LA"));
        }

        response.setOptions(options);
        return response;
    }
}
