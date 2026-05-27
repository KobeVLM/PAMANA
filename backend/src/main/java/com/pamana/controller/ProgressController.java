package com.pamana.controller;

import com.pamana.dto.DashboardResponse;
import com.pamana.service.ProgressService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

@RestController
@RequestMapping("/api/progress")
public class ProgressController {

    private static final Logger log = LoggerFactory.getLogger(ProgressController.class);

    private final ProgressService progressService;

    public ProgressController(ProgressService progressService) {
        this.progressService = progressService;
    }

    @GetMapping("/{userId}/dashboard")
    @PreAuthorize("hasAnyRole('PARENT', 'LEARNER', 'TEACHER')")
    public ResponseEntity<DashboardResponse> getDashboard(@PathVariable UUID userId) {
        log.info("REST API: Fetch progress dashboard metrics for student ID: {}", userId);

        DashboardResponse response = progressService.getDashboardMetrics(userId);
        return ResponseEntity.ok(response);
    }
}
