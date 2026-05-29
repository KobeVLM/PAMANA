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

        // Standard logic: advance to the next set when they get it correct
        Integer nextSetId = setId;
        if (isCorrect) {
            nextSetId = setId + 1;
            if (nextSetId > 5) {
                nextSetId = null; // No more sets for this sublevel!
            }
        }

        // 4. Compute overall Module 1 progress
        double moduleAccuracy = computeModuleAccuracy(userId);
        
        boolean isModule1Completed = false;
        if ("rhyming".equals(subLevel) && isCorrect && nextSetId == null) {
            // Evaluates and potentially unlocks Module 2!
            moduleLockService.evaluateAndUnlock(userId, 1, moduleAccuracy);
            isModule1Completed = true;
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
        
        String[] consonantsList = {"b", "d", "g", "h", "k", "l", "m", "n", "ng", "p", "r", "s", "t", "w", "y"};
        String[] vowelsList = {"a", "e", "i", "o", "u"};
        
        int vIdx = (setId - 1) % vowelsList.length;
        String vowel = vowelsList[vIdx];
        
        List<String> cons = new ArrayList<>(java.util.Arrays.asList(consonantsList));
        java.util.Collections.shuffle(cons, new java.util.Random(setId + subLevel.hashCode())); 
        
        String targetConsonant = cons.get(0);
        String targetSyllable = targetConsonant + vowel;

        if ("pagsama".equals(subLevel) || "pakinggan".equals(subLevel)) {
            response.setConsonant(targetConsonant.toUpperCase());
            response.setVowel(vowel.toUpperCase());
            response.setTargetSyllable(targetSyllable.toUpperCase());
            
            response.setConsonantAudioUrl("/audio/phonemes/" + targetConsonant + ".mp3");
            response.setVowelAudioUrl("/audio/phonemes/" + vowel + ".mp3");
            response.setAudioUrl("/audio/syllables/" + targetSyllable + ".mp3");
            
            options.add(new SyllableSetResponse.Option(targetSyllable.toLowerCase(), targetSyllable.toUpperCase()));
            
            if ("pagsama".equals(subLevel)) {
                int added = 1;
                for (String v : vowelsList) {
                    if (added >= 4) break;
                    if (!v.equals(vowel)) {
                        String opt = targetConsonant + v;
                        options.add(new SyllableSetResponse.Option(opt.toLowerCase(), opt.toUpperCase()));
                        added++;
                    }
                }
            } else {
                for (int i = 1; i < 4; i++) {
                    String opt = cons.get(i) + vowel;
                    options.add(new SyllableSetResponse.Option(opt.toLowerCase(), opt.toUpperCase()));
                }
            }
            java.util.Collections.shuffle(options);
        } else if ("kilalanin".equals(subLevel)) {
            String[] words = {"mata", "bahay", "tatay", "nanay", "bibig"};
            String[] targetSylls = {"ma", "ba", "ta", "na", "bi"};
            int index = (setId - 1) % words.length;
            String word = words[index];
            String targetSyll = targetSylls[index];
            
            response.setTargetSyllable(targetSyll.toUpperCase());
            response.setAudioUrl("/audio/words/" + word + ".mp3");
            
            options.add(new SyllableSetResponse.Option(targetSyll.toLowerCase(), targetSyll.toUpperCase()));
            for (int i = 1; i < 4; i++) {
                String opt = cons.get(i) + "a";
                options.add(new SyllableSetResponse.Option(opt.toLowerCase(), opt.toUpperCase()));
            }
            java.util.Collections.shuffle(options);
        } else if ("rhyming".equals(subLevel)) {
            String[] words = {"mata", "lola", "lolo", "tenga", "kuya"};
            String[] targetSylls = {"ta", "la", "lo", "nga", "ya"};
            int index = (setId - 1) % words.length;
            String word = words[index];
            String targetSyll = targetSylls[index];
            
            response.setTargetSyllable(targetSyll.toUpperCase());
            response.setAudioUrl("/audio/words/" + word + ".mp3");
            
            options.add(new SyllableSetResponse.Option(targetSyll.toLowerCase(), targetSyll.toUpperCase()));
            for (int i = 1; i < 4; i++) {
                String opt = cons.get(i) + "a";
                options.add(new SyllableSetResponse.Option(opt.toLowerCase(), opt.toUpperCase()));
            }
            java.util.Collections.shuffle(options);
        }

        response.setOptions(options);
        return response;
    }
}
