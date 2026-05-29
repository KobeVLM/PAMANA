package com.pamana.controller;

import com.pamana.model.ModuleProgress;
import com.pamana.model.ModuleAttemptHistory;
import com.pamana.repository.ModuleProgressRepository;
import com.pamana.repository.ModuleAttemptHistoryRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/modules")
public class ModuleController {

    private static final Logger log = LoggerFactory.getLogger(ModuleController.class);

    private final ModuleProgressRepository moduleProgressRepository;
    private final ModuleAttemptHistoryRepository moduleAttemptHistoryRepository;

    public ModuleController(ModuleProgressRepository moduleProgressRepository,
                            ModuleAttemptHistoryRepository moduleAttemptHistoryRepository) {
        this.moduleProgressRepository = moduleProgressRepository;
        this.moduleAttemptHistoryRepository = moduleAttemptHistoryRepository;
    }

    @GetMapping("/progress/{userId}")
    @PreAuthorize("hasAnyRole('PARENT', 'LEARNER', 'TEACHER')")
    public ResponseEntity<List<ModuleProgress>> getModuleProgress(@PathVariable UUID userId) {
        log.info("REST API: Fetch module progress for user ID: {}", userId);
        List<ModuleProgress> progress = moduleProgressRepository.findByUserId(userId);
        return ResponseEntity.ok(progress);
    }

    @GetMapping("/history/{userId}")
    @PreAuthorize("hasAnyRole('PARENT', 'LEARNER', 'TEACHER')")
    public ResponseEntity<List<ModuleAttemptHistory>> getModuleHistory(@PathVariable UUID userId) {
        log.info("REST API: Fetch module attempt history for user ID: {}", userId);
        List<ModuleAttemptHistory> history = moduleAttemptHistoryRepository.findByUserIdOrderByCompletedAtAsc(userId);
        return ResponseEntity.ok(history);
    }
}
