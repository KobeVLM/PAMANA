package com.pamana.progress;

import com.pamana.progress.dto.ReplayEventRequest;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.UUID;

/**
 * Append-only log of in-game replay button taps.
 *
 * <p>The request is fire-and-forget from the client: a network hiccup must
 * never delay audio playback. Every tap is still recorded when the request
 * reaches the server.
 */
@RestController
@RequestMapping("/api/replay-events")
public class ReplayEventController {

    private final ReplayEventService replayEventService;

    public ReplayEventController(ReplayEventService replayEventService) {
        this.replayEventService = replayEventService;
    }

    @PostMapping
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<Void> record(@Valid @RequestBody ReplayEventRequest request, Principal principal) {
        UUID userId = UUID.fromString(principal.getName());

        replayEventService.record(
                userId,
                request.getRunId(),
                request.getActivity(),
                request.getItemType(),
                request.getItemKey(),
                request.getStep(),
                request.getModuleNumber(),
                request.getSource());

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
