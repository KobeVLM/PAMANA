package com.pamana.controller;

import com.pamana.dto.LeaderboardEntry;
import com.pamana.service.KlaseService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/api/klase")
public class KlaseController {

    private static final Logger log = LoggerFactory.getLogger(KlaseController.class);

    private final KlaseService klaseService;

    public KlaseController(KlaseService klaseService) {
        this.klaseService = klaseService;
    }

    @PostMapping("/join")
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<Void> joinKlase(
            @RequestParam String joinCode,
            Principal principal) {
        UUID userId = UUID.fromString(principal.getName());
        log.info("REST API: Student {} requesting to join classroom with join code: {}", userId, joinCode);

        klaseService.joinKlase(userId, joinCode);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{klaseId}/leaderboard")
    @PreAuthorize("hasAnyRole('LEARNER', 'PARENT', 'TEACHER')")
    public ResponseEntity<List<LeaderboardEntry>> getLeaderboard(@PathVariable UUID klaseId) {
        log.info("REST API: Fetch ranked leaderboard for classroom: {}", klaseId);

        List<LeaderboardEntry> response = klaseService.getLeaderboard(klaseId);
        return ResponseEntity.ok(response);
    }
}
