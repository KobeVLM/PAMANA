package com.pamana.progress;

import com.pamana.progress.dto.AnswerProgressResponse;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;

/**
 * Append-only answer telemetry and the honest, monotone progress derived from
 * it.
 *
 * <p>The progress percentage is <em>items answered correctly at least once</em>
 * divided by the number of items in the run. Counting distinct items (rather
 * than every answer event) is what keeps the bar from going backwards when a
 * child retries: a wrong attempt only increments {@code wrongAttempts}.
 */
@Service
public class AnswerEventService {

    public static final String ACTIVITY_MODULE = "module";
    public static final String ACTIVITY_PRACTICE = "practice";

    private final AnswerEventRepository answerEventRepository;

    public AnswerEventService(AnswerEventRepository answerEventRepository) {
        this.answerEventRepository = answerEventRepository;
    }

    /**
     * Appends one attempt. {@code runId} may be null for older clients; each
     * answer then becomes its own run, which still records the event but cannot
     * be grouped into a progress bar.
     *
     * @return the number of attempts this item has had in this run, 1-based.
     */
    @Transactional
    public int record(UUID userId, UUID runId, String activity, String itemType, String itemKey,
            String step, Integer moduleNumber, boolean correct) {
        UUID effectiveRunId = runId != null ? runId : UUID.randomUUID();
        int attemptNumber = (int) answerEventRepository
                .countByRunIdAndItemKeyAndUserId(effectiveRunId, itemKey, userId) + 1;

        answerEventRepository.save(new AnswerEvent(
                userId,
                effectiveRunId,
                activity,
                itemType,
                itemKey,
                step,
                moduleNumber,
                attemptNumber,
                correct));

        return attemptNumber;
    }

    @Transactional(readOnly = true)
    public AnswerProgressResponse progress(UUID userId, UUID runId, Integer totalItems) {
        List<AnswerEvent> events = answerEventRepository.findByRunIdAndUserIdOrderByAnsweredAtAsc(runId, userId);

        Set<String> answeredItems = new HashSet<>();
        Set<String> correctItems = new HashSet<>();
        int wrongAttempts = 0;

        for (AnswerEvent event : events) {
            answeredItems.add(event.getItemKey());
            if (Boolean.TRUE.equals(event.getCorrect())) {
                correctItems.add(event.getItemKey());
            } else {
                wrongAttempts++;
            }
        }

        int total = totalItems != null && totalItems > 0 ? totalItems : 0;
        Double progressPercent = null;
        if (total > 0) {
            double raw = (correctItems.size() * 100.0) / total;
            progressPercent = Math.min(100.0, Math.round(raw * 100.0) / 100.0);
        }

        return new AnswerProgressResponse(
                runId,
                correctItems.size(),
                answeredItems.size(),
                total,
                wrongAttempts,
                progressPercent);
    }
}
