package com.pamana.controller;

import com.pamana.dto.CreateKlaseRequest;
import com.pamana.dto.KlaseResponse;
import com.pamana.dto.LeaderboardEntry;
import com.pamana.dto.LearnerDetail;
import com.pamana.model.Klase;
import com.pamana.service.KlaseService;
import jakarta.validation.Valid;
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

    @PostMapping
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<KlaseResponse> createKlase(
            @Valid @RequestBody CreateKlaseRequest request,
            Principal principal) {
        UUID teacherId = UUID.fromString(principal.getName());
        log.info("REST API: Teacher {} creating classroom: {}", teacherId, request.getName());

        Klase klase = klaseService.createKlase(teacherId, request.getName());
        KlaseResponse response = new KlaseResponse(klase.getId(), klase.getName(), klase.getJoinCode(), klase.getTeacherId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/teacher")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<KlaseResponse> getTeacherKlase(Principal principal) {
        UUID teacherId = UUID.fromString(principal.getName());
        log.info("REST API: Fetching klase for teacher: {}", teacherId);

        Klase klase = klaseService.getTeacherKlase(teacherId);
        KlaseResponse response = new KlaseResponse(klase.getId(), klase.getName(), klase.getJoinCode(), klase.getTeacherId());
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{klaseId}/teacher-view")
    @PreAuthorize("hasRole('TEACHER')")
    public ResponseEntity<List<LearnerDetail>> getTeacherView(
            @PathVariable UUID klaseId,
            Principal principal) {
        UUID teacherId = UUID.fromString(principal.getName());
        log.info("REST API: Fetching detailed teacher view for classroom: {}", klaseId);

        List<LearnerDetail> response = klaseService.getTeacherView(klaseId, teacherId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/join")
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<java.util.Map<String, String>> joinKlase(
            @RequestParam String joinCode,
            Principal principal) {
        UUID userId = UUID.fromString(principal.getName());
        log.info("REST API: Student {} requesting to join classroom with join code: {}", userId, joinCode);

        UUID klaseId = klaseService.joinKlase(userId, joinCode);
        return ResponseEntity.ok(java.util.Map.of("klaseId", klaseId.toString()));
    }

    @GetMapping("/{klaseId}/leaderboard")
    @PreAuthorize("hasAnyRole('LEARNER', 'PARENT', 'TEACHER')")
    public ResponseEntity<List<LeaderboardEntry>> getLeaderboard(@PathVariable UUID klaseId) {
        log.info("REST API: Fetch ranked leaderboard for classroom: {}", klaseId);

        List<LeaderboardEntry> response = klaseService.getLeaderboard(klaseId);
        return ResponseEntity.ok(response);
    }
}
