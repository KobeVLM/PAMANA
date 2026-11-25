package com.pamana.progress;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

/**
 * Append-only replay telemetry. One row per button tap, with no updates: the
 * count itself is the metric measured in the validation plan.
 */
@Service
public class ReplayEventService {

    private final ReplayEventRepository replayEventRepository;

    public ReplayEventService(ReplayEventRepository replayEventRepository) {
        this.replayEventRepository = replayEventRepository;
    }

    @Transactional
    public void record(UUID userId, UUID runId, String activity, String itemType,
            String itemKey, String step, Integer moduleNumber, String source) {
        UUID effectiveRunId = runId != null ? runId : UUID.randomUUID();
        replayEventRepository.save(new ReplayEvent(
                userId,
                effectiveRunId,
                activity,
                itemType,
                itemKey,
                step,
                moduleNumber,
                source));
    }
}
