package com.pamana.repository;

import com.pamana.model.SentenceProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SentenceProgressRepository extends JpaRepository<SentenceProgress, UUID> {
    Optional<SentenceProgress> findByUserIdAndTierAndTaskId(UUID userId, Integer tier, UUID taskId);
    List<SentenceProgress> findByUserIdAndTier(UUID userId, Integer tier);
    List<SentenceProgress> findByUserId(UUID userId);
}
