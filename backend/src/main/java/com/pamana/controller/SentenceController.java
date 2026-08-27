package com.pamana.controller;

import com.pamana.dto.SentenceProgressRequest;
import com.pamana.dto.SentenceResultResponse;
import com.pamana.dto.SentenceTaskResponse;
import com.pamana.service.SentenceService;
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

    public SentenceController(SentenceService sentenceService) {
        this.sentenceService = sentenceService;
    }

    @GetMapping("/task")
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<SentenceTaskResponse> getSentenceTask(
            @RequestParam int tier,
            Principal principal) {
        UUID userId = UUID.fromString(principal.getName());
        log.info("REST API: Fetch active sentence task for user: {}, tier: {}", userId, tier);

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

        SentenceResultResponse response = sentenceService.evaluateSentenceAnswer(
                userId,
                request.getTaskId(),
                request.getSubmittedOrder()
        );
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
