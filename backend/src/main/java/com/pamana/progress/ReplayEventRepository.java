package com.pamana.progress;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ReplayEventRepository extends JpaRepository<ReplayEvent, UUID> {

    /** All replays of one screen mount, oldest first. */
    List<ReplayEvent> findByRunIdAndUserIdOrderByReplayedAtAsc(UUID runId, UUID userId);

    long countByUserIdAndSource(UUID userId, String source);
}
