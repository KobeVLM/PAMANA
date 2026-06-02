package com.pamana.vocabulary;

import com.pamana.vocabulary.WordMasteryRepository;
import com.pamana.vocabulary.WordMastery;

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

    @org.springframework.data.jpa.repository.Modifying
    @org.springframework.data.jpa.repository.Query("DELETE FROM WordMastery wm WHERE wm.userId = :userId AND wm.vocabItemId IN (SELECT v.id FROM VocabularyItem v WHERE v.domain = :domain)")
    void deleteByUserIdAndDomain(@org.springframework.data.repository.query.Param("userId") UUID userId, @org.springframework.data.repository.query.Param("domain") String domain);
}
