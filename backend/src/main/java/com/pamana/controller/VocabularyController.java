package com.pamana.controller;

import com.pamana.dto.*;
import com.pamana.model.HamonSession;
import com.pamana.model.VocabularyItem;
import com.pamana.repository.VocabularyItemRepository;
import com.pamana.service.HamonService;
import com.pamana.service.VocabularyService;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api")
public class VocabularyController {

    private static final Logger log = LoggerFactory.getLogger(VocabularyController.class);

    private final VocabularyService vocabularyService;
    private final HamonService hamonService;
    private final VocabularyItemRepository vocabularyItemRepository;

    public VocabularyController(VocabularyService vocabularyService,
                                HamonService hamonService,
                                VocabularyItemRepository vocabularyItemRepository) {
        this.vocabularyService = vocabularyService;
        this.hamonService = hamonService;
        this.vocabularyItemRepository = vocabularyItemRepository;
    }

    @GetMapping("/vocabulary/next")
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<VocabularyWordResponse> getNextWord(Principal principal) {
        UUID userId = UUID.fromString(principal.getName());
        log.info("REST API: Fetch next vocabulary word for user: {}", userId);

        VocabularyWordResponse response = vocabularyService.getNextWord(userId);
        if (response == null) {
            // Returns HTTP 204 No Content to indicate that the active domain vocabulary is fully mastered
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }

    @GetMapping("/vocabulary/match/{wordId}")
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<MatchOptionsResponse> getMatchOptions(
            @PathVariable UUID wordId,
            @RequestParam String step) {
        log.info("REST API: Fetch match options for word: {}, step: {}", wordId, step);

        MatchOptionsResponse response = vocabularyService.getMatchOptions(wordId, step);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/vocabulary/gamitin/{wordId}")
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<DialogueResponse> getGamitinDialogue(@PathVariable UUID wordId) {
        log.info("REST API: Fetch Gamitin dialogue completion details for word: {}", wordId);

        DialogueResponse response = vocabularyService.getGamitinDialogue(wordId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/vocabulary/progress")
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<WordMasteryResponse> recordProgress(
            @Valid @RequestBody VocabularyProgressRequest request,
            Principal principal) {
        UUID userId = UUID.fromString(principal.getName());
        log.info("REST API: Submit vocabulary progress for user: {}, wordId: {}, step: {}", userId, request.getWordId(), request.getStep());

        WordMasteryResponse response = vocabularyService.recordStepAccuracy(
                userId,
                request.getWordId(),
                request.getStep(),
                request.isCorrect()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/hamon/session/active")
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<HamonSessionResponse> getActiveHamonSession(Principal principal) {
        UUID userId = UUID.fromString(principal.getName());
        log.info("REST API: Fetch active Hamon challenge session for user: {}", userId);

        HamonSession session = hamonService.generateHamonSession(userId);

        List<VocabularyWordResponse> words = new ArrayList<>();
        for (UUID wordId : session.getWordIds()) {
            VocabularyItem item = vocabularyItemRepository.findById(wordId)
                    .orElseThrow(() -> new IllegalArgumentException("Vocabulary item not found with ID: " + wordId));
            words.add(new VocabularyWordResponse(
                    item.getId(),
                    item.getWord(),
                    item.getDomain(),
                    item.getAudioUrl(),
                    item.getImageUrl(),
                    item.getOrdinal()
            ));
        }

        HamonSessionResponse response = new HamonSessionResponse(
                session.getId(),
                session.getUserId(),
                words
        );

        return ResponseEntity.ok(response);
    }

    @PostMapping("/hamon/results/{sessionId}")
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<HamonResultResponse> submitHamonResults(
            @PathVariable UUID sessionId,
            @RequestBody Map<UUID, Double> results) {
        log.info("REST API: Submit batch results for Hamon session: {}", sessionId);

        HamonResultResponse response = hamonService.recordHamonResult(sessionId, results);
        return ResponseEntity.ok(response);
    }
}
