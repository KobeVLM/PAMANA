package com.pamana.repository;

import com.pamana.model.WordMastery;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface WordMasteryRepository extends JpaRepository<WordMastery, UUID> {
    Optional<WordMastery> findByUserIdAndVocabItemId(UUID userId, UUID vocabItemId);
    List<WordMastery> findByUserId(UUID userId);
    List<WordMastery> findByUserIdAndStatus(UUID userId, String status);
    long countByUserIdAndStatus(UUID userId, String status);
}
