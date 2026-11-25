package com.pamana.progress;

import com.pamana.adaptive.AdaptiveTier;
import com.pamana.adaptive.AdaptiveTierResolver;
import com.pamana.progress.dto.AnswerEventRequest;

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
 * Append-only answer log for practice screens.
 *
 * <p>Practice Mode deliberately does not write to the mastery tables: a child
 * can try as often as they like there without changing their lesson score.
 * This endpoint gives those screens the same honest telemetry as the module
 * screens while keeping that separation.
 */
@RestController
@RequestMapping("/api/answer-events")
public class AnswerEventController {

    private final AnswerEventService answerEventService;
    private final AdaptiveTierResolver adaptiveTierResolver;

    public AnswerEventController(AnswerEventService answerEventService,
            AdaptiveTierResolver adaptiveTierResolver) {
        this.answerEventService = answerEventService;
        this.adaptiveTierResolver = adaptiveTierResolver;
    }

    @PostMapping
    @PreAuthorize("hasRole('LEARNER')")
    public ResponseEntity<Void> record(@Valid @RequestBody AnswerEventRequest request, Principal principal) {
        UUID userId = UUID.fromString(principal.getName());

        // Practice screens do not send a tier: resolve it here from the same
        // answer history the question dispatcher used, so telemetry records the
        // tier that was actually served. Out-of-scope item types stay STANDARD.
        AdaptiveTier tier = adaptiveTierResolver.forItemType(userId, request.getItemType());
        answerEventService.record(
                userId,
                request.getRunId(),
                request.getActivity(),
                request.getItemType(),
                request.getItemKey(),
                request.getStep(),
                request.getModuleNumber(),
                request.isCorrect(),
                tier.value());

        return ResponseEntity.status(HttpStatus.CREATED).build();
    }
}
