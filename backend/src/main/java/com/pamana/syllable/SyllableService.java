package com.pamana.syllable;

import com.pamana.syllable.SyllableProgressRepository;
import com.pamana.syllable.SyllableProgress;
import com.pamana.syllable.dto.SyllableProgressResponse;
import com.pamana.syllable.dto.SyllableSetResponse;
import com.pamana.syllable.dto.SyllableStatusResponse;
import com.pamana.common.BaseGameService;

import com.pamana.adaptive.AdaptiveTier;
import com.pamana.adaptive.AdaptiveTierResolver;
import com.pamana.adaptive.ContentBankItem;
import com.pamana.adaptive.ContentBankRepository;
import com.pamana.adaptive.SyllableContent;
import com.pamana.adaptive.TieredDistractors;
import com.pamana.progress.AnswerEventService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.util.UUID;

@Service
public class SyllableService extends BaseGameService {

    private static final Logger log = LoggerFactory.getLogger(SyllableService.class);
    private final SyllableProgressRepository syllableProgressRepository;
    private final AnswerEventService answerEventService;
    private final AdaptiveTierResolver adaptiveTierResolver;
    private final ContentBankRepository contentBankRepository;

    public SyllableService(SyllableProgressRepository syllableProgressRepository,
            AnswerEventService answerEventService,
            AdaptiveTierResolver adaptiveTierResolver,
            ContentBankRepository contentBankRepository) {
        this.syllableProgressRepository = syllableProgressRepository;
        this.answerEventService = answerEventService;
        this.adaptiveTierResolver = adaptiveTierResolver;
        this.contentBankRepository = contentBankRepository;
    }

    @Transactional
    public SyllableProgressResponse evaluateAnswer(UUID userId, String subLevel, Integer setId, String answer,
            boolean isCorrect, UUID runId) {
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

        // Record which adaptive tier was actually served, alongside the answer.
        AdaptiveTier tier = adaptiveTierResolver.forSyllables(userId);
        answerEventService.record(
                userId,
                runId,
                AnswerEventService.ACTIVITY_MODULE,
                AdaptiveTierResolver.ITEM_TYPE_SYLLABLE,
                subLevel + ":" + setId,
                subLevel,
                1,
                isCorrect,
                tier.value());

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
        if (hasAttemptedAllSubLevels(userId) && Math.round(moduleAccuracy) >= 80) {
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

    @Transactional
    public SyllableStatusResponse computeModuleStatus(UUID userId) {
        double pagsamaAcc = getSubLevelAverageAccuracy(userId, "pagsama");
        double pakingganAcc = getSubLevelAverageAccuracy(userId, "pakinggan");
        double kilalaninAcc = getSubLevelAverageAccuracy(userId, "kilalanin");
        double rhymingAcc = getSubLevelAverageAccuracy(userId, "rhyming");

        double overallAcc = computeModuleAccuracy(userId);
        if (Math.round(overallAcc) >= 80 && hasAttemptedAllSubLevels(userId)) {
            moduleLockService.evaluateAndUnlock(userId, 1, overallAcc);
        }
        boolean module2Unlocked = moduleLockService.isModuleUnlocked(userId, 2);
        boolean isComplete = Math.round(overallAcc) >= 80 && hasAttemptedAllSubLevels(userId);

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

    /**
     * Builds one syllable question for the learner's adaptive tier.
     *
     * <p>The target (consonant, vowel, word and audio) is still derived exactly
     * as before via {@link SyllableContent}; only the distractor pool changes.
     * STANDARD uses the legacy pool so existing gameplay is unchanged.
     */
    @Transactional(readOnly = true)
    public SyllableSetResponse getSyllableSet(String subLevel, int setId, UUID userId) {
        AdaptiveTier tier = adaptiveTierResolver.forSyllables(userId);
        log.info("Generating syllable set for subLevel: {}, setId: {}, tier: {}", subLevel, setId, tier);

        SyllableSetResponse response = new SyllableSetResponse();
        response.setSetId(setId);
        response.setSubLevel(subLevel);

        String vowel = SyllableContent.vowel(setId);
        String targetConsonant = SyllableContent.shuffledConsonants(setId, subLevel).get(0);
        String targetSyllable = SyllableContent.targetSyllable(subLevel, setId);

        if (SyllableContent.isWordContext(subLevel)) {
            // kilalanin / rhyming: listen to a word and find its first syllable.
            String word = SyllableContent.contextWord(subLevel, setId);
            response.setTargetSyllable(targetSyllable.toUpperCase());
            response.setAudioUrl("/audio/words/" + word + ".mp3");
        } else {
            response.setConsonant(targetConsonant.toUpperCase());
            response.setVowel(vowel.toUpperCase());
            response.setTargetSyllable(targetSyllable.toUpperCase());
            response.setConsonantAudioUrl("/audio/phonemes/" + targetConsonant + ".mp3");
            response.setVowelAudioUrl("/audio/phonemes/" + vowel + ".mp3");
            response.setAudioUrl("/audio/syllables/" + targetSyllable + ".mp3");
        }

        List<SyllableSetResponse.Option> options = new ArrayList<>();
        options.add(new SyllableSetResponse.Option(targetSyllable.toLowerCase(), targetSyllable.toUpperCase()));
        for (String distractor : tieredDistractorLabels(subLevel, setId, tier)) {
            options.add(new SyllableSetResponse.Option(distractor.toLowerCase(), distractor.toUpperCase()));
        }

        // The tier is part of the seed: options stay stable while the learner's
        // tier does, and rearrange when the dispatcher changes the tier.
        long seed = setId + subLevel.hashCode() + tier.hashCode();
        Collections.shuffle(options, new Random(seed));

        response.setOptions(options);
        return response;
    }

    /**
     * Distractor labels for one item at the learner's tier, read from the
     * Content Bank. A missing or stale pool falls back to the deterministic
     * {@link TieredDistractors} rule so a partially migrated database still
     * serves playable questions.
     */
    private List<String> tieredDistractorLabels(String subLevel, int setId, AdaptiveTier tier) {
        String target = SyllableContent.targetSyllable(subLevel, setId);
        Optional<ContentBankItem> pool = contentBankRepository.findByActivityAndItemKeyAndDifficultyTier(
                TieredDistractors.ACTIVITY_SYLLABLE,
                subLevel + ":" + setId,
                tier.value());

        List<String> labels = pool.isPresent()
                ? Arrays.asList(pool.get().getDistractors().split(","))
                : TieredDistractors.forSyllable(subLevel, setId, tier);

        Set<String> unique = new LinkedHashSet<>();
        addValidDistractors(unique, labels, target);
        if (unique.size() < TieredDistractors.OPTION_COUNT) {
            addValidDistractors(unique, TieredDistractors.forSyllable(subLevel, setId, tier), target);
        }
        return new ArrayList<>(unique);
    }

    private void addValidDistractors(Set<String> into, List<String> labels, String target) {
        for (String label : labels) {
            if (into.size() >= TieredDistractors.OPTION_COUNT) {
                return;
            }
            String normalized = label.trim().toLowerCase(Locale.ROOT);
            if (!normalized.isEmpty() && !normalized.equals(target)) {
                into.add(normalized);
            }
        }
    }
}
