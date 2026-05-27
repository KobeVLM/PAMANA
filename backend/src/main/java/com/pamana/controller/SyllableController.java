package com.pamana.controller;

import com.pamana.dto.SyllableProgressRequest;
import com.pamana.dto.SyllableProgressResponse;
import com.pamana.dto.SyllableStatusResponse;
import com.pamana.service.SyllableService;
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
@RequestMapping("/api/syllables")
public class SyllableController {

    private static final Logger log = LoggerFactory.getLogger(SyllableController.class);
    private final SyllableService syllableService;

    public SyllableController(SyllableService syllableService) {
        this.syllableService = syllableService;
    }

    @PostMapping("/progress")
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<SyllableProgressResponse> recordProgress(
            @Valid @RequestBody SyllableProgressRequest request,
            Principal principal) {
        
        UUID userId = UUID.fromString(principal.getName());
        log.info("REST API Request: Record Syllable progress for user: {}, subLevel: {}", userId, request.getSubLevel());

        SyllableProgressResponse response = syllableService.evaluateAnswer(
                userId,
                request.getSubLevel(),
                request.getSetId(),
                request.getSelectedAnswer(),
                request.isCorrect()
        );

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/status")
    @PreAuthorize("hasAnyRole('LEARNER', 'PARENT', 'TEACHER')")
    public ResponseEntity<SyllableStatusResponse> getStatus(@RequestParam UUID userId) {
        log.info("REST API Request: Fetch Syllable sub-level status for user: {}", userId);
        SyllableStatusResponse response = syllableService.computeModuleStatus(userId);
        return ResponseEntity.ok(response);
    }
}
