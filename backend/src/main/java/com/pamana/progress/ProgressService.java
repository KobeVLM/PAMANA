package com.pamana.progress;

import com.pamana.syllable.SyllableProgressRepository;
import com.pamana.syllable.SyllableProgress;
import com.pamana.vocabulary.VocabularyItemRepository;
import com.pamana.vocabulary.WordMasteryRepository;
import com.pamana.vocabulary.VocabularyItem;
import com.pamana.vocabulary.WordMastery;
import com.pamana.vocabulary.dto.WordMasteryStatus;
import com.pamana.sentence.SentenceProgressRepository;
import com.pamana.sentence.SentenceProgress;
import com.pamana.progress.ProgressService;
import com.pamana.progress.ModuleProgressRepository;
import com.pamana.progress.ModuleProgress;
import com.pamana.progress.dto.ModuleAccuracy;
import com.pamana.parent.SessionLogRepository;
import com.pamana.parent.SessionLog;
import com.pamana.parent.dto.DashboardResponse;



import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class ProgressService {

    private static final Logger log = LoggerFactory.getLogger(ProgressService.class);

    private final SyllableProgressRepository syllableProgressRepository;
    private final WordMasteryRepository wordMasteryRepository;
    private final VocabularyItemRepository vocabularyItemRepository;
    private final SentenceProgressRepository sentenceProgressRepository;
    private final SessionLogRepository sessionLogRepository;
    private final ModuleProgressRepository moduleProgressRepository;

    public ProgressService(SyllableProgressRepository syllableProgressRepository,
                           WordMasteryRepository wordMasteryRepository,
                           VocabularyItemRepository vocabularyItemRepository,
                           SentenceProgressRepository sentenceProgressRepository,
                           SessionLogRepository sessionLogRepository,
                           ModuleProgressRepository moduleProgressRepository) {
        this.syllableProgressRepository = syllableProgressRepository;
        this.wordMasteryRepository = wordMasteryRepository;
        this.vocabularyItemRepository = vocabularyItemRepository;
        this.sentenceProgressRepository = sentenceProgressRepository;
        this.sessionLogRepository = sessionLogRepository;
        this.moduleProgressRepository = moduleProgressRepository;
    }

    @Transactional(readOnly = true)
    public DashboardResponse getDashboardMetrics(UUID userId) {
        log.info("Aggregating parent dashboard metrics for userId: {}", userId);

        // Single bulk read of the learner's mastery rows. Looking each word up
        // individually made this endpoint issue ~46 sequential queries, which
        // took several seconds against the remote database.
        Map<UUID, WordMastery> masteryByItem = masteryByItem(userId);

        // 1. Module Accuracies Trend
        List<ModuleAccuracy> accuracyTrend = computeAccuracyTrend(userId, masteryByItem);

        // 2. Mastered & Needs-Review counts
        int masteredCount = (int) wordMasteryRepository.countByUserIdAndStatus(userId, "green");
        int needsReviewCount = (int) wordMasteryRepository.countByUserIdAndStatus(userId, "red");

        // 3. Average session duration
        List<SessionLog> sessionLogs = sessionLogRepository.findByUserId(userId);
        double avgDuration = sessionLogs.stream()
                .mapToDouble(SessionLog::getDurationMinutes)
                .average()
                .orElse(0.0);

        // 4. Overall Pamana Trail Completion
        List<ModuleProgress> modProgress = moduleProgressRepository.findByUserId(userId);
        long completedModules = modProgress.stream().filter(ModuleProgress::getIsComplete).count();
        double trailCompletion = (completedModules / 4.0) * 100.0;

        // 5. Word Mastery list sorted alphabetically
        List<WordMasteryStatus> wordMasteryList = getWordMasteryList(userId, masteryByItem);

        // 6. Recent Session History (sorted by startedAt descending, up to 5 entries)
        List<SessionLog> sessionHistory = sessionLogs.stream()
                .sorted(Comparator.comparing(SessionLog::getStartedAt).reversed())
                .limit(5)
                .collect(Collectors.toList());

        return new DashboardResponse(
                accuracyTrend,
                masteredCount,
                needsReviewCount,
                BigDecimal.valueOf(avgDuration).setScale(2, RoundingMode.HALF_UP).doubleValue(),
                BigDecimal.valueOf(trailCompletion).setScale(2, RoundingMode.HALF_UP).doubleValue(),
                wordMasteryList,
                sessionHistory
        );
    }

    private List<ModuleAccuracy> computeAccuracyTrend(UUID userId, Map<UUID, WordMastery> masteryByItem) {
        // Module 1 (Syllables) average accuracy
        List<SyllableProgress> sylAttempts = syllableProgressRepository.findByUserId(userId);
        double sylAcc = sylAttempts.stream()
                .mapToDouble(p -> p.getAccuracy().doubleValue())
                .average()
                .orElse(0.0);

        // Module 2 (Self & Body Vocab) average accuracy
        List<VocabularyItem> m2Items = vocabularyItemRepository.findByDomain("self_body");
        double m2Acc = getDomainAverageAccuracy(m2Items, masteryByItem);

        // Module 3 (Family & Home Vocab) average accuracy
        List<VocabularyItem> m3Items = vocabularyItemRepository.findByDomain("family_home");
        double m3Acc = getDomainAverageAccuracy(m3Items, masteryByItem);

        // Module 4 (Sentences) average accuracy
        List<SentenceProgress> sentAttempts = sentenceProgressRepository.findByUserId(userId);
        double sentAcc = sentAttempts.stream()
                .mapToDouble(p -> p.getAccuracy().doubleValue())
                .average()
                .orElse(0.0);

        return Arrays.asList(
                new ModuleAccuracy(1, "Module 1: Syllables", BigDecimal.valueOf(sylAcc).setScale(2, RoundingMode.HALF_UP).doubleValue()),
                new ModuleAccuracy(2, "Module 2: Garden (Body)", BigDecimal.valueOf(m2Acc).setScale(2, RoundingMode.HALF_UP).doubleValue()),
                new ModuleAccuracy(3, "Module 3: Kitchen (Home)", BigDecimal.valueOf(m3Acc).setScale(2, RoundingMode.HALF_UP).doubleValue()),
                new ModuleAccuracy(4, "Module 4: Sala (Sentences)", BigDecimal.valueOf(sentAcc).setScale(2, RoundingMode.HALF_UP).doubleValue())
        );
    }

    private double getDomainAverageAccuracy(List<VocabularyItem> items, Map<UUID, WordMastery> masteryByItem) {
        if (items.isEmpty()) {
            return 0.0;
        }
        double sum = 0.0;
        int counted = 0;
        for (VocabularyItem item : items) {
            WordMastery mastery = masteryByItem.get(item.getId());
            if (mastery != null) {
                sum += mastery.getOverallAccuracy().doubleValue();
                counted++;
            }
        }
        return counted == 0 ? 0.0 : sum / counted;
    }

    private Map<UUID, WordMastery> masteryByItem(UUID userId) {
        Map<UUID, WordMastery> masteryByItem = new HashMap<>();
        for (WordMastery mastery : wordMasteryRepository.findByUserId(userId)) {
            masteryByItem.put(mastery.getVocabItemId(), mastery);
        }
        return masteryByItem;
    }

    @Transactional(readOnly = true)
    public List<WordMasteryStatus> getWordMasteryList(UUID userId) {
        return getWordMasteryList(userId, masteryByItem(userId));
    }

    private List<WordMasteryStatus> getWordMasteryList(UUID userId, Map<UUID, WordMastery> masteryByItem) {
        List<VocabularyItem> allItems = vocabularyItemRepository.findAll();
        List<WordMasteryStatus> list = new ArrayList<>();

        for (VocabularyItem item : allItems) {
            WordMastery m = masteryByItem.get(item.getId());
            if (m != null) {
                list.add(new WordMasteryStatus(
                        item.getId(),
                        item.getWord(),
                        item.getDomain(),
                        m.getOverallAccuracy().doubleValue(),
                        m.getStatus()
                ));
            } else {
                // Return grey indicator if the vocabulary word has not yet been introduced
                list.add(new WordMasteryStatus(
                        item.getId(),
                        item.getWord(),
                        item.getDomain(),
                        0.0,
                        "grey"
                ));
            }
        }

        // Sort by status priority (red first, then yellow, green, grey) and then alphabetically
        Map<String, Integer> statusPriority = Map.of(
            "red", 1,
            "yellow", 2,
            "green", 3,
            "grey", 4
        );

        list.sort(Comparator.comparing((WordMasteryStatus w) -> statusPriority.getOrDefault(w.getStatus(), 99))
                .thenComparing(WordMasteryStatus::getWord));
        return list;
    }
}
