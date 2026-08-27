package com.pamana.repository;

import com.pamana.model.VocabularyItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface VocabularyItemRepository extends JpaRepository<VocabularyItem, UUID> {
    List<VocabularyItem> findByDomain(String domain);
    List<VocabularyItem> findByDomainOrderByOrdinalAsc(String domain);
    Optional<VocabularyItem> findByWord(String word);
    Optional<VocabularyItem> findByDomainAndOrdinal(String domain, Integer ordinal);
}
