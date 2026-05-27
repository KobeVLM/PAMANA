package com.pamana.service;

import com.pamana.dto.SentenceResultResponse;
import com.pamana.dto.SentenceTaskResponse;
import com.pamana.model.SentenceProgress;
import com.pamana.repository.SentenceProgressRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class SentenceService extends BaseGameService {

    private static final Logger log = LoggerFactory.getLogger(SentenceService.class);

    private final SentenceProgressRepository sentenceProgressRepository;

    public static class SentenceTask {
        private final UUID id;
        private final int tier;
        private final List<String> scrambledWords;
        private final List<String> correctOrder;
        private final String audioUrl;

        public SentenceTask(String id, int tier, List<String> scrambledWords, List<String> correctOrder, String audioUrl) {
            this.id = UUID.fromString(id);
            this.tier = tier;
            this.scrambledWords = scrambledWords;
            this.correctOrder = correctOrder;
            this.audioUrl = audioUrl;
        }

        public UUID getId() { return id; }
        public int getTier() { return tier; }
        public List<String> getScrambledWords() { return scrambledWords; }
        public List<String> getCorrectOrder() { return correctOrder; }
        public String getAudioUrl() { return audioUrl; }
    }

    // Static baseline tasks for Module 4 (5 for Tier 1, 5 for Tier 2)
    private static final List<SentenceTask> TASKS = Arrays.asList(
        // Tier 1: 2-to-3-word Paturol (declarative) sentences
        new SentenceTask("11111111-1111-1111-1111-111111111111", 1, Arrays.asList("si", "Ako", "Lolo"), Arrays.asList("Ako", "si", "Lolo"), "/static/assets/audio/sentence_1.wav"),
        new SentenceTask("22222222-2222-2222-2222-222222222222", 1, Arrays.asList("si", "Nanay", "Kumain"), Arrays.asList("Kumain", "si", "Nanay"), "/static/assets/audio/sentence_2.wav"),
        new SentenceTask("33333333-3333-3333-3333-333333333333", 1, Arrays.asList("ang", "bahay", "Malinis"), Arrays.asList("Malinis", "ang", "bahay"), "/static/assets/audio/sentence_3.wav"),
        new SentenceTask("44444444-4444-4444-4444-444444444444", 1, Arrays.asList("Ate", "si", "Bumasa"), Arrays.asList("Bumasa", "si", "Ate"), "/static/assets/audio/sentence_4.wav"),
        new SentenceTask("55555555-5555-5555-5555-555555555555", 1, Arrays.asList("si", "Kuya", "Uminom"), Arrays.asList("Uminom", "si", "Kuya"), "/static/assets/audio/sentence_5.wav"),

        // Tier 2: Simple Patanong (interrogative) sentences
        new SentenceTask("66666666-6666-6666-6666-666666666666", 2, Arrays.asList("si", "?", "Lola", "Saan"), Arrays.asList("Saan", "si", "Lola", "?"), "/static/assets/audio/sentence_6.wav"),
        new SentenceTask("77777777-7777-7777-7777-777777777777", 2, Arrays.asList("si", "Sino", "?", "Tatay"), Arrays.asList("Sino", "si", "Tatay", "?"), "/static/assets/audio/sentence_7.wav"),
        new SentenceTask("88888888-8888-8888-8888-888888888888", 2, Arrays.asList("baso", "ang", "?", "Nasaan"), Arrays.asList("Nasaan", "ang", "baso", "?"), "/static/assets/audio/sentence_8.wav"),
        new SentenceTask("99999999-9999-9999-9999-999999999999", 2, Arrays.asList("tulog", "ka", "?", "Kailan"), Arrays.asList("Kailan", "ka", "tulog", "?"), "/static/assets/audio/sentence_9.wav"),
        new SentenceTask("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa", 2, Arrays.asList("damit", "?", "ang", "Ano"), Arrays.asList("Ano", "ang", "damit", "?"), "/static/assets/audio/sentence_10.wav")
    );

    public SentenceService(SentenceProgressRepository sentenceProgressRepository) {
        this.sentenceProgressRepository = sentenceProgressRepository;
    }

    @Transactional(readOnly = true)
    public SentenceTaskResponse getSentenceTask(UUID userId, int tier) {
        log.info("Fetching active sentence task: userId={}, tier={}", userId, tier);

        List<SentenceProgress> attempts = sentenceProgressRepository.findByUserIdAndTier(userId, tier);
        Set<UUID> completedIds = attempts.stream()
                .filter(SentenceProgress::getIsCorrect)
                .map(SentenceProgress::getTaskId)
                .collect(Collectors.toSet());

        List<SentenceTask> tierTasks = TASKS.stream()
                .filter(t -> t.getTier() == tier)
                .collect(Collectors.toList());

        for (SentenceTask task : tierTasks) {
            if (!completedIds.contains(task.getId())) {
                log.info("Active sentence task found: ID={}", task.getId());
                return new SentenceTaskResponse(
                        task.getId(),
                        task.getScrambledWords(),
                        task.getAudioUrl(),
                        task.getTier(),
                        false
                );
            }
        }

        log.info("All tasks in sentence tier {} are completed for user: {}", tier, userId);
        return null;
    }

    @Transactional
    public SentenceResultResponse evaluateSentenceAnswer(UUID userId, UUID taskId, List<String> submittedOrder) {
        log.info("Evaluating sentence attempt: userId={}, taskId={}, order={}", userId, taskId, submittedOrder);

        SentenceTask target = TASKS.stream()
                .filter(t -> t.getId().equals(taskId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Sentence task not found with ID: " + taskId));

        // Evaluate exact match element-by-element
        boolean correct = target.getCorrectOrder().equals(submittedOrder);

        SentenceProgress progress = sentenceProgressRepository
                .findByUserIdAndTierAndTaskId(userId, target.getTier(), taskId)
                .orElseGet(() -> {
                    SentenceProgress newRecord = new SentenceProgress(userId, target.getTier(), taskId);
                    return sentenceProgressRepository.save(newRecord);
                });

        progress.setAttempts(progress.getAttempts() + 1);
        if (correct) {
            progress.setIsCorrect(true);
        }

        // Calculate attempts-based accuracy
        double calculatedAccuracy = correct ? (100.0 / progress.getAttempts()) : 0.0;
        progress.setAccuracy(BigDecimal.valueOf(calculatedAccuracy).setScale(2, RoundingMode.HALF_UP));
        sentenceProgressRepository.save(progress);

        // Recompute overall tier-specific accuracy
        double tierAccuracy = computeTierAccuracy(userId, target.getTier());

        // Check locks evaluations
        boolean tierComplete = hasCompletedAllTierTasks(userId, target.getTier());
        boolean moduleComplete = false;

        if (tierComplete && tierAccuracy >= 75.0) {
            if (target.getTier() == 1) {
                log.info("Tier 1 paturol completed with average accuracy {}%! Unlocking Tier 2.", tierAccuracy);
                // System automatically registers unlock markers internally (locks map will be checked by UI shell)
            } else if (target.getTier() == 2) {
                log.info("Tier 2 patanong completed with average accuracy {}%! Unlocking Module 4 Reunion Ending.", tierAccuracy);
                moduleComplete = true;
                moduleLockService.evaluateAndUnlock(userId, 4, tierAccuracy);
            }
        }

        // Fetch next uncompleted task
        SentenceTaskResponse nextTask = getSentenceTask(userId, target.getTier());
        UUID nextTaskId = nextTask != null ? nextTask.getTaskId() : null;

        return new SentenceResultResponse(
                correct,
                progress.getAttempts(),
                calculatedAccuracy,
                tierAccuracy,
                tierComplete,
                moduleComplete,
                nextTaskId
        );
    }

    public double computeTierAccuracy(UUID userId, int tier) {
        List<SentenceProgress> attempts = sentenceProgressRepository.findByUserIdAndTier(userId, tier);
        if (attempts.isEmpty()) {
            return 0.0;
        }

        double sum = 0.0;
        for (SentenceProgress p : attempts) {
            sum += p.getAccuracy().doubleValue();
        }
        return sum / attempts.size();
    }

    private boolean hasCompletedAllTierTasks(UUID userId, int tier) {
        List<SentenceProgress> attempts = sentenceProgressRepository.findByUserIdAndTier(userId, tier);
        long correctCount = attempts.stream().filter(SentenceProgress::getIsCorrect).count();
        return correctCount >= 5; // All 5 baseline tasks completed
    }
}
