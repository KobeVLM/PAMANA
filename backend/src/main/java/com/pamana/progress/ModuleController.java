package com.pamana.progress;

import com.pamana.progress.ModuleController;
import com.pamana.progress.ModuleLockService;
import com.pamana.progress.ModuleAttemptHistoryRepository;
import com.pamana.progress.ModuleProgressRepository;
import com.pamana.progress.ModuleAttemptHistory;
import com.pamana.progress.ModuleProgress;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;

import com.pamana.security.LearnerAccessService;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/modules")
public class ModuleController {

    private static final Logger log = LoggerFactory.getLogger(ModuleController.class);

    private final ModuleProgressRepository moduleProgressRepository;
    private final ModuleAttemptHistoryRepository moduleAttemptHistoryRepository;
    private final com.pamana.progress.ModuleLockService moduleLockService;
    private final LearnerAccessService learnerAccessService;

    public ModuleController(ModuleProgressRepository moduleProgressRepository,
                            ModuleAttemptHistoryRepository moduleAttemptHistoryRepository,
                            com.pamana.progress.ModuleLockService moduleLockService,
                            LearnerAccessService learnerAccessService) {
        this.moduleProgressRepository = moduleProgressRepository;
        this.moduleAttemptHistoryRepository = moduleAttemptHistoryRepository;
        this.moduleLockService = moduleLockService;
        this.learnerAccessService = learnerAccessService;
    }

    @GetMapping("/progress/{userId}")
    @PreAuthorize("hasAnyRole('PARENT', 'LEARNER', 'TEACHER')")
    public ResponseEntity<List<ModuleProgress>> getModuleProgress(@PathVariable UUID userId, Authentication authentication) {
        learnerAccessService.assertCanAccess(authentication, userId);
        log.info("REST API: Fetch module progress for user ID: {}", userId);
        List<ModuleProgress> progress = moduleProgressRepository.findByUserId(userId);
        return ResponseEntity.ok(progress);
    }

    @GetMapping("/history/{userId}")
    @PreAuthorize("hasAnyRole('PARENT', 'LEARNER', 'TEACHER')")
    public ResponseEntity<List<ModuleAttemptHistory>> getModuleHistory(@PathVariable UUID userId, Authentication authentication) {
        learnerAccessService.assertCanAccess(authentication, userId);
        log.info("REST API: Fetch module attempt history for user ID: {}", userId);
        List<ModuleAttemptHistory> history = moduleAttemptHistoryRepository.findByUserIdOrderByCompletedAtAsc(userId);
        return ResponseEntity.ok(history);
    }

    @DeleteMapping("/reset/{userId}/{moduleNumber}")
    @PreAuthorize("hasAnyRole('PARENT', 'LEARNER', 'TEACHER')")
    public ResponseEntity<Void> resetModuleProgress(@PathVariable UUID userId, @PathVariable int moduleNumber, Authentication authentication) {
        learnerAccessService.assertCanAccess(authentication, userId);
        log.info("REST API: Reset module progress for user ID: {}, module: {}", userId, moduleNumber);
        moduleLockService.resetModuleGameData(userId, moduleNumber);
        return ResponseEntity.ok().build();
    }

    @PostMapping("/unlock/{userId}/{moduleNumber}")
    @PreAuthorize("hasAnyRole('PARENT', 'LEARNER', 'TEACHER')")
    public ResponseEntity<List<ModuleProgress>> unlockModuleForUser(
            @PathVariable UUID userId,
            @PathVariable int moduleNumber,
            Authentication authentication) {
        learnerAccessService.assertCanAccess(authentication, userId);
        log.info("REST API: Cheat unlock module {} for user ID: {}", moduleNumber, userId);
        List<ModuleProgress> progress = moduleLockService.unlockModule(userId, moduleNumber);
        return ResponseEntity.ok(progress);
    }

    @PostMapping("/unlock/{moduleNumber}")
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<List<ModuleProgress>> unlockModule(
            @PathVariable int moduleNumber,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        log.info("REST API: Cheat unlock module {} for current user: {}", moduleNumber, userId);
        List<ModuleProgress> progress = moduleLockService.unlockModule(userId, moduleNumber);
        return ResponseEntity.ok(progress);
    }

    @PostMapping("/unlock-all/{userId}")
    @PreAuthorize("hasAnyRole('PARENT', 'LEARNER', 'TEACHER')")
    public ResponseEntity<List<ModuleProgress>> unlockAllModulesForUser(
            @PathVariable UUID userId,
            @RequestParam(required = false, defaultValue = "false") boolean markComplete,
            Authentication authentication) {
        learnerAccessService.assertCanAccess(authentication, userId);
        log.info("REST API: Cheat unlock ALL modules for user ID: {}, markComplete={}", userId, markComplete);
        List<ModuleProgress> progress = moduleLockService.unlockAllModules(userId, markComplete);
        return ResponseEntity.ok(progress);
    }

    @PostMapping("/unlock-all")
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<List<ModuleProgress>> unlockAllModules(
            @RequestParam(required = false, defaultValue = "false") boolean markComplete,
            Authentication authentication) {
        UUID userId = UUID.fromString(authentication.getName());
        log.info("REST API: Cheat unlock ALL modules for current user: {}, markComplete={}", userId, markComplete);
        List<ModuleProgress> progress = moduleLockService.unlockAllModules(userId, markComplete);
        return ResponseEntity.ok(progress);
    }
}
