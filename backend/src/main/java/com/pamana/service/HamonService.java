package com.pamana.service;

import com.pamana.dto.HamonResultResponse;
import com.pamana.model.HamonSession;
import com.pamana.model.WordMastery;
import com.pamana.model.VocabularyItem;
import com.pamana.repository.HamonSessionRepository;
import com.pamana.repository.WordMasteryRepository;
import com.pamana.repository.VocabularyItemRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class HamonService {

    private static final Logger log = LoggerFactory.getLogger(HamonService.class);

    private final HamonSessionRepository hamonSessionRepository;
    private final WordMasteryRepository wordMasteryRepository;
    private final VocabularyItemRepository vocabularyItemRepository;

    public HamonService(HamonSessionRepository hamonSessionRepository,
                        WordMasteryRepository wordMasteryRepository,
                        VocabularyItemRepository vocabularyItemRepository) {
        this.hamonSessionRepository = hamonSessionRepository;
        this.wordMasteryRepository = wordMasteryRepository;
        this.vocabularyItemRepository = vocabularyItemRepository;
    }

    @Transactional(readOnly = true)
    public boolean shouldTriggerHamon(UUID userId) {
        long greenCount = wordMasteryRepository.countByUserIdAndStatus(userId, "green");
        log.info("Checking Hamon trigger: userId={}, greenCount={}", userId, greenCount);

        if (greenCount == 0 || greenCount % 5 != 0) {
            return false;
        }

        List<HamonSession> sessions = hamonSessionRepository.findByUserId(userId);
        boolean hasActive = sessions.stream().anyMatch(s -> !s.getIsComplete());
        if (hasActive) {
            log.info("Active Hamon session already exists. Skipping new trigger.");
            return false;
        }

        long completedCount = sessions.stream().filter(HamonSession::getIsComplete).count();
        long expectedMilestones = greenCount / 5;

        boolean shouldTrigger = completedCount < expectedMilestones;
        log.info("Hamon should trigger: {} (milestone={}/completed={})", shouldTrigger, expectedMilestones, completedCount);
        return shouldTrigger;
    }

    @Transactional
    public HamonSession generateHamonSession(UUID userId) {
        log.info("Generating Hamon session for user: {}", userId);

        // Return active session if it exists to avoid losing state
        Optional<HamonSession> activeOpt = hamonSessionRepository.findByUserIdAndIsCompleteFalse(userId);
        if (activeOpt.isPresent()) {
            return activeOpt.get();
        }

        // Fetch all green words
        List<WordMastery> greenMasteries = wordMasteryRepository.findByUserIdAndStatus(userId, "green");
        List<UUID> wordIds = greenMasteries.stream()
                .map(WordMastery::getVocabItemId)
                .collect(Collectors.toList());

        // Shuffle the list of green words to randomize review order
        Collections.shuffle(wordIds);

        HamonSession session = new HamonSession(userId, wordIds);
        return hamonSessionRepository.save(session);
    }

    @Transactional
    public void skipHamonSession(UUID userId) {
        log.info("Skipping Hamon session for user: {}", userId);
        HamonSession session = generateHamonSession(userId);
        session.setIsComplete(true);
        session.setPassRate(null);
        hamonSessionRepository.save(session);
    }

    @Transactional
    public HamonResultResponse recordHamonResult(UUID sessionId, Map<UUID, Double> results) {
        log.info("Recording Hamon session results for session: {}", sessionId);

        HamonSession session = hamonSessionRepository.findById(sessionId)
                .orElseThrow(() -> new IllegalArgumentException("Hamon session not found with ID: " + sessionId));

        if (session.getIsComplete()) {
            throw new IllegalStateException("Hamon session is already completed.");
        }

        int totalWords = session.getWordIds().size();
        if (totalWords == 0) {
            session.setIsComplete(true);
            session.setPassRate(BigDecimal.valueOf(100.0));
            hamonSessionRepository.save(session);
            return new HamonResultResponse(100.0, 0, 0, new ArrayList<>());
        }

        int passedCount = 0;
        List<String> failedWordNames = new ArrayList<>();

        for (UUID wordId : session.getWordIds()) {
            double accuracy = results.getOrDefault(wordId, 0.0);
            WordMastery mastery = wordMasteryRepository.findByUserIdAndVocabItemId(session.getUserId(), wordId)
                    .orElseGet(() -> {
                        WordMastery newMastery = new WordMastery(session.getUserId(), wordId);
                        return wordMasteryRepository.save(newMastery);
                    });

            // Retrieve VocabularyItem word label for reporting
            VocabularyItem item = vocabularyItemRepository.findById(wordId)
                    .orElseThrow(() -> new IllegalArgumentException("Vocabulary item not found with ID: " + wordId));

            // Update gamitinAccuracy and recompute overallAccuracy
            mastery.setGamitinAccuracy(BigDecimal.valueOf(accuracy).setScale(2, RoundingMode.HALF_UP));
            double newOverall = (mastery.getKilalaninAccuracy().doubleValue() +
                    mastery.getBasahinAccuracy().doubleValue() +
                    accuracy) / 3.0;
            mastery.setOverallAccuracy(BigDecimal.valueOf(newOverall).setScale(2, RoundingMode.HALF_UP));

            // Grade 2 Repetition mechanic: words scoring <60% are flagged Red and re-queued
            if (accuracy < 60.0) {
                mastery.setHamonFailCount(mastery.getHamonFailCount() + 1);
                mastery.setStatus("red");
                failedWordNames.add(item.getWord());
                log.info("Word '{}' failed Hamon: accuracy={}%, status set to RED", item.getWord(), accuracy);
            } else {
                passedCount++;
                mastery.setStatus("green");
                log.info("Word '{}' passed Hamon: accuracy={}%", item.getWord(), accuracy);
            }

            wordMasteryRepository.save(mastery);
        }

        double passRate = (passedCount * 100.0) / totalWords;
        session.setPassRate(BigDecimal.valueOf(passRate).setScale(2, RoundingMode.HALF_UP));
        session.setIsComplete(true);
        hamonSessionRepository.save(session);

        log.info("Completed Hamon session: passRate={}% (passed={}/failed={})", passRate, passedCount, failedWordNames.size());

        return new HamonResultResponse(
                BigDecimal.valueOf(passRate).setScale(2, RoundingMode.HALF_UP).doubleValue(),
                passedCount,
                failedWordNames.size(),
                failedWordNames
        );
    }
}
