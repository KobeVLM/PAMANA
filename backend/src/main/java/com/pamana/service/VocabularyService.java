package com.pamana.service;

import com.pamana.dto.DialogueResponse;
import com.pamana.dto.MatchOptionsResponse;
import com.pamana.dto.VocabularyWordResponse;
import com.pamana.dto.WordMasteryResponse;
import com.pamana.model.ModuleProgress;
import com.pamana.model.VocabularyItem;
import com.pamana.model.WordMastery;
import com.pamana.repository.ModuleProgressRepository;
import com.pamana.repository.VocabularyItemRepository;
import com.pamana.repository.WordMasteryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class VocabularyService extends BaseGameService {

    private static final Logger log = LoggerFactory.getLogger(VocabularyService.class);

    private final VocabularyItemRepository vocabularyItemRepository;
    private final WordMasteryRepository wordMasteryRepository;
    private final HamonService hamonService;

    // Hardcoded simple Tagalog dialogue templates aligned to Grade 2 MATATAG competencies
    private static final Map<String, String> DIALOGUE_TEMPLATES = new HashMap<>();
    static {
        // Module 2: Self & Body (10 words)
        DIALOGUE_TEMPLATES.put("mata", "Ang aking ____ ay malinaw makakita.");
        DIALOGUE_TEMPLATES.put("kamay", "Gamitin ang iyong ____ para kumain.");
        DIALOGUE_TEMPLATES.put("ilong", "Amuyin ang bulaklak gamit ang ____.");
        DIALOGUE_TEMPLATES.put("bibig", "Ginagamit ko ang aking ____ sa pagsasalita.");
        DIALOGUE_TEMPLATES.put("tenga", "Pakinggan ang ibon gamit ang ____.");
        DIALOGUE_TEMPLATES.put("ulo", "Isuot ang sumbrero sa iyong ____.");
        DIALOGUE_TEMPLATES.put("paa", "Lumalakad ako gamit ang aking ____.");
        DIALOGUE_TEMPLATES.put("likod", "Tuwid dapat ang iyong ____ kapag nakaupo.");
        DIALOGUE_TEMPLATES.put("tiyan", "Busog ang aking ____ pagkatapos kumain.");
        DIALOGUE_TEMPLATES.put("noo", "Malamig ang tapat ng aking ____ kapag nilalagnat.");

        // Module 3: Family & Home (15 words)
        DIALOGUE_TEMPLATES.put("Nanay", "Tinulungan ko si ____ sa paglilinis ng bahay.");
        DIALOGUE_TEMPLATES.put("Tatay", "Nagluto si ____ ng masarap na ulam.");
        DIALOGUE_TEMPLATES.put("Lola", "Masaya si ____ kapag ako ay bumibisita.");
        DIALOGUE_TEMPLATES.put("Lolo", "Nagkuwento si ____ tungkol sa lumang panahon.");
        DIALOGUE_TEMPLATES.put("Kuya", "Naglalaro kami ni ____ ng bola sa labas.");
        DIALOGUE_TEMPLATES.put("Ate", "Tinutulungan ako ni ____ magbasa ng aklat.");
        DIALOGUE_TEMPLATES.put("bahay", "Malinis at maayos ang aming ____ ngayon.");
        DIALOGUE_TEMPLATES.put("kain", "Tayo na sa kusina at ____ ng tanghalian.");
        DIALOGUE_TEMPLATES.put("tulog", "Maaga akong magigising pagkatapos ng mahabang ____.");
        DIALOGUE_TEMPLATES.put("damit", "Kulay pula ang aking bagong ____ para sa reunion.");
        DIALOGUE_TEMPLATES.put("sapatos", "Isuot mo ang iyong ____ bago lumabas.");
        DIALOGUE_TEMPLATES.put("silya", "Umupo ka sa ____ na ito malapit kay Lola.");
        DIALOGUE_TEMPLATES.put("mesa", "Ihain ang masarap na pagkain sa ibabaw ng ____.");
        DIALOGUE_TEMPLATES.put("pintuan", "Pakisara ng ____ pagpasok mo.");
        DIALOGUE_TEMPLATES.put("baso", "Uminom ng tubig sa malinis na ____.");
    }

    public VocabularyService(VocabularyItemRepository vocabularyItemRepository,
                             WordMasteryRepository wordMasteryRepository,
                             HamonService hamonService) {
        this.vocabularyItemRepository = vocabularyItemRepository;
        this.wordMasteryRepository = wordMasteryRepository;
        this.hamonService = hamonService;
    }

    @Transactional(readOnly = true)
    public String getActiveDomain(UUID userId) {
        // Evaluate active module via locks
        Optional<ModuleProgress> mod2 = moduleProgressRepository.findByUserIdAndModuleNumber(userId, 2);
        Optional<ModuleProgress> mod3 = moduleProgressRepository.findByUserIdAndModuleNumber(userId, 3);

        if (mod3.isPresent() && mod3.get().getIsUnlocked() && !mod3.get().getIsComplete()) {
            return "family_home";
        }
        // Default to self_body if Module 2 is active
        return "self_body";
    }

    @Transactional
    public VocabularyWordResponse getNextWord(UUID userId) {
        String activeDomain = getActiveDomain(userId);
        log.info("Fetching next unmastered word for user: {}, activeDomain: {}", userId, activeDomain);

        List<VocabularyItem> domainItems = vocabularyItemRepository.findByDomainOrderByOrdinalAsc(activeDomain);

        for (VocabularyItem item : domainItems) {
            Optional<WordMastery> masteryOpt = wordMasteryRepository.findByUserIdAndVocabItemId(userId, item.getId());
            if (masteryOpt.isEmpty() || !"green".equalsIgnoreCase(masteryOpt.get().getStatus())) {
                log.info("Found next unmastered word: '{}' (ordinal={})", item.getWord(), item.getOrdinal());
                return new VocabularyWordResponse(
                        item.getId(),
                        item.getWord(),
                        item.getDomain(),
                        item.getAudioUrl(),
                        item.getImageUrl(),
                        item.getOrdinal()
                );
            }
        }

        log.info("All vocabulary words in domain '{}' are mastered for user: {}", activeDomain, userId);
        return null; // Return null to indicate domain completion
    }

    @Transactional(readOnly = true)
    public MatchOptionsResponse getMatchOptions(UUID wordId, String step) {
        log.info("Compiling match options for wordId: {}, step: {}", wordId, step);

        VocabularyItem target = vocabularyItemRepository.findById(wordId)
                .orElseThrow(() -> new IllegalArgumentException("Vocabulary item not found with ID: " + wordId));

        List<VocabularyItem> sameDomainItems = vocabularyItemRepository.findByDomain(target.getDomain());
        List<VocabularyItem> distractors = sameDomainItems.stream()
                .filter(item -> !item.getId().equals(wordId))
                .collect(Collectors.toList());

        // Shuffle and take 3 distractors
        Collections.shuffle(distractors);
        List<VocabularyItem> selectedDistractors = distractors.subList(0, Math.min(3, distractors.size()));

        // Compile total choices (target + distractors)
        List<MatchOptionsResponse.OptionItem> options = new ArrayList<>();
        options.add(new MatchOptionsResponse.OptionItem(target.getId(), target.getWord(), target.getImageUrl()));
        for (VocabularyItem dist : selectedDistractors) {
            options.add(new MatchOptionsResponse.OptionItem(dist.getId(), dist.getWord(), dist.getImageUrl()));
        }

        // Shuffle choices for frontend OptionGrid
        Collections.shuffle(options);

        return new MatchOptionsResponse(
                target.getId(),
                target.getWord(),
                target.getImageUrl(),
                target.getAudioUrl(),
                options
        );
    }

    @Transactional(readOnly = true)
    public DialogueResponse getGamitinDialogue(UUID wordId) {
        log.info("Compiling dialogue response for wordId: {}", wordId);

        VocabularyItem target = vocabularyItemRepository.findById(wordId)
                .orElseThrow(() -> new IllegalArgumentException("Vocabulary item not found with ID: " + wordId));

        String template = DIALOGUE_TEMPLATES.getOrDefault(target.getWord(), "Ito ay ____.");

        // Compile same-domain distractors (only written labels are needed for DialogueCompletion)
        List<VocabularyItem> sameDomainItems = vocabularyItemRepository.findByDomain(target.getDomain());
        List<String> distractors = sameDomainItems.stream()
                .filter(item -> !item.getId().equals(wordId))
                .map(VocabularyItem::getWord)
                .collect(Collectors.toList());

        Collections.shuffle(distractors);
        List<String> options = new ArrayList<>();
        options.add(target.getWord());
        options.addAll(distractors.subList(0, Math.min(2, distractors.size()))); // 3 options total (target + 2 distractors)

        Collections.shuffle(options);

        return new DialogueResponse(
                target.getId(),
                template,
                target.getWord(),
                options,
                target.getAudioUrl()
        );
    }

    @Transactional
    public WordMasteryResponse recordStepAccuracy(UUID userId, UUID wordId, String step, boolean isCorrect) {
        log.info("Recording step progress: userId={}, wordId={}, step={}, correct={}", userId, wordId, step, isCorrect);

        WordMastery mastery = wordMasteryRepository.findByUserIdAndVocabItemId(userId, wordId)
                .orElseGet(() -> {
                    WordMastery newMastery = new WordMastery(userId, wordId);
                    return wordMasteryRepository.save(newMastery);
                });

        double stepScore = isCorrect ? 100.0 : 0.0;

        if ("pakinggan".equalsIgnoreCase(step)) {
            mastery.setPakingganCompleted(true);
        } else if ("kilalanin".equalsIgnoreCase(step)) {
            mastery.setKilalaninAccuracy(BigDecimal.valueOf(stepScore).setScale(2, RoundingMode.HALF_UP));
        } else if ("basahin".equalsIgnoreCase(step)) {
            mastery.setBasahinAccuracy(BigDecimal.valueOf(stepScore).setScale(2, RoundingMode.HALF_UP));
        } else if ("gamitin".equalsIgnoreCase(step)) {
            mastery.setGamitinAccuracy(BigDecimal.valueOf(stepScore).setScale(2, RoundingMode.HALF_UP));
        }

        // Calculate rolling overall accuracy across the 3 matching/use steps
        double overall = (mastery.getKilalaninAccuracy().doubleValue() +
                mastery.getBasahinAccuracy().doubleValue() +
                mastery.getGamitinAccuracy().doubleValue()) / 3.0;
        mastery.setOverallAccuracy(BigDecimal.valueOf(overall).setScale(2, RoundingMode.HALF_UP));

        // Evaluate Status
        // Green: overall_accuracy >= 75%; Yellow: 50-74%; Red: <50% OR hamon_fail_count >= 3
        if (mastery.getHamonFailCount() >= 3 || overall < 50.0) {
            mastery.setStatus("red");
        } else if (overall >= 75.0) {
            mastery.setStatus("green");
        } else {
            mastery.setStatus("yellow");
        }

        wordMasteryRepository.save(mastery);

        // Check if the current domain is now fully complete (meaning all words in it are green)
        evaluateDomainCompletion(userId);

        // Evaluate Hamon ng Pamana milestones (mastered words count mod 5 == 0)
        boolean hamonTriggered = hamonService.shouldTriggerHamon(userId);

        return new WordMasteryResponse(
                wordId,
                mastery.getOverallAccuracy().doubleValue(),
                mastery.getStatus(),
                "green".equalsIgnoreCase(mastery.getStatus()),
                hamonTriggered
        );
    }

    private void evaluateDomainCompletion(UUID userId) {
        String activeDomain = getActiveDomain(userId);
        List<VocabularyItem> domainItems = vocabularyItemRepository.findByDomain(activeDomain);

        boolean allGreen = true;
        double sumAccuracy = 0.0;

        for (VocabularyItem item : domainItems) {
            Optional<WordMastery> masteryOpt = wordMasteryRepository.findByUserIdAndVocabItemId(userId, item.getId());
            if (masteryOpt.isEmpty() || !"green".equalsIgnoreCase(masteryOpt.get().getStatus())) {
                allGreen = false;
                break;
            }
            sumAccuracy += masteryOpt.get().getOverallAccuracy().doubleValue();
        }

        if (allGreen && !domainItems.isEmpty()) {
            double averageAccuracy = sumAccuracy / domainItems.size();
            if ("self_body".equalsIgnoreCase(activeDomain)) {
                log.info("All 10 Self & Body words are green! Unlocking Module 3. Avg accuracy: {}%", averageAccuracy);
                moduleLockService.evaluateAndUnlock(userId, 2, averageAccuracy);
            } else if ("family_home".equalsIgnoreCase(activeDomain)) {
                log.info("All 15 Family & Home words are green! Unlocking Module 4. Avg accuracy: {}%", averageAccuracy);
                moduleLockService.evaluateAndUnlock(userId, 3, averageAccuracy);
            }
        }
    }
}
