package com.pamana.parent;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/sessions")
public class SessionController {

    private static final Logger log = LoggerFactory.getLogger(SessionController.class);

    private final SessionLogService sessionLogService;

    public SessionController(SessionLogService sessionLogService) {
        this.sessionLogService = sessionLogService;
    }

    @PostMapping("/start")
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<Map<String, String>> startSession(
            @RequestParam(required = false) Integer moduleAccessed,
            Principal principal) {
        UUID userId = UUID.fromString(principal.getName());
        UUID sessionId = sessionLogService.startSession(userId, moduleAccessed);
        return ResponseEntity.ok(Map.of("sessionId", sessionId.toString()));
    }

    @PostMapping("/{sessionId}/end")
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<Void> endSession(@PathVariable UUID sessionId, Principal principal) {
        UUID userId = UUID.fromString(principal.getName());
        log.info("REST API: End session {} for user {}", sessionId, userId);
        sessionLogService.endSession(userId, sessionId);
        return ResponseEntity.ok().build();
    }
}
