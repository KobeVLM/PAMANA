package com.pamana.sentence;

import com.pamana.progress.ModuleLockService;
import com.pamana.sentence.dto.SentenceProgressRequest;
import com.pamana.sentence.dto.SentenceResultResponse;
import com.pamana.sentence.dto.SentenceTaskResponse;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.UUID;

@RestController
@RequestMapping("/api/sentences")
public class SentenceController {

    private static final Logger log = LoggerFactory.getLogger(SentenceController.class);

    private final SentenceService sentenceService;
    private final ModuleLockService moduleLockService;

    public SentenceController(SentenceService sentenceService, ModuleLockService moduleLockService) {
        this.sentenceService = sentenceService;
        this.moduleLockService = moduleLockService;
    }

    @GetMapping("/task")
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<SentenceTaskResponse> getSentenceTask(
            @RequestParam int tier,
            Principal principal) {
        UUID userId = UUID.fromString(principal.getName());
        log.info("REST API: Fetch active sentence task for user: {}, tier: {}", userId, tier);

        if (!moduleLockService.isModuleUnlocked(userId, 4)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        SentenceTaskResponse response = sentenceService.getSentenceTask(userId, tier);
        if (response == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/progress")
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<SentenceResultResponse> recordProgress(
            @Valid @RequestBody SentenceProgressRequest request,
            Principal principal) {
        UUID userId = UUID.fromString(principal.getName());
        log.info("REST API: Submit sentence arrangement attempt for user: {}, taskId: {}", userId, request.getTaskId());

        if (!moduleLockService.isModuleUnlocked(userId, 4)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();
        }

        SentenceResultResponse response = sentenceService.evaluateSentenceAnswer(
                userId,
                request.getTaskId(),
                request.getSubmittedOrder()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
