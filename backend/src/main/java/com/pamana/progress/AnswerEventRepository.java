package com.pamana.progress;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface AnswerEventRepository extends JpaRepository<AnswerEvent, UUID> {

    /**
     * Every answer of one run for one learner, oldest first. Runs are small
     * (tens of rows), so progress is computed in memory from this list rather
     * than with a second round of grouped queries.
     */
    List<AnswerEvent> findByRunIdAndUserIdOrderByAnsweredAtAsc(UUID runId, UUID userId);

    long countByRunIdAndItemKeyAndUserId(UUID runId, String itemKey, UUID userId);

    /**
     * Most recent answers for one learner and activity. Backs the adaptive
     * tier resolver and uses the existing (user_id, answered_at DESC) index.
     */
    List<AnswerEvent> findTop10ByUserIdAndItemTypeOrderByAnsweredAtDesc(UUID userId, String itemType);
}
