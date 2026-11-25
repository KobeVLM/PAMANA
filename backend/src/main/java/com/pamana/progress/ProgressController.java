package com.pamana.progress;

import com.pamana.parent.dto.DashboardResponse;
import com.pamana.progress.dto.AnswerProgressResponse;
import com.pamana.security.LearnerAccessService;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    private static final Logger log = LoggerFactory.getLogger(ProgressController.class);

    private final ProgressService progressService;
    private final AnswerEventService answerEventService;
    private final LearnerAccessService learnerAccessService;

    public ProgressController(ProgressService progressService, AnswerEventService answerEventService,
            LearnerAccessService learnerAccessService) {
        this.progressService = progressService;
        this.answerEventService = answerEventService;
        this.learnerAccessService = learnerAccessService;
    }

    @GetMapping("/{userId}/dashboard")
    @PreAuthorize("hasAnyRole('PARENT', 'LEARNER', 'TEACHER')")
    public ResponseEntity<DashboardResponse> getDashboard(@PathVariable UUID userId, Authentication authentication) {
        learnerAccessService.assertCanAccess(authentication, userId);
        log.info("REST API: Fetch progress dashboard metrics for student ID: {}", userId);

        DashboardResponse response = progressService.getDashboardMetrics(userId);
        return ResponseEntity.ok(response);
    }

    /**
     * Progress for one play-through, recomputed from the answer log so the
     * on-screen bar can render exactly what was saved.
     */
    @GetMapping("/{userId}/answer-progress")
    @PreAuthorize("hasAnyRole('PARENT', 'LEARNER')")
    public ResponseEntity<AnswerProgressResponse> getAnswerProgress(
            @PathVariable UUID userId,
            @RequestParam UUID runId,
            @RequestParam(required = false) Integer totalItems,
            Authentication authentication) {
        learnerAccessService.assertCanAccess(authentication, userId);
        return ResponseEntity.ok(answerEventService.progress(userId, runId, totalItems));
    }
}
