package com.pamana.syllable;

import com.pamana.syllable.SyllableProgressRepository;
import com.pamana.syllable.SyllableProgress;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SyllableProgressRepository extends JpaRepository<SyllableProgress, UUID> {
    List<SyllableProgress> findByUserId(UUID userId);
    List<SyllableProgress> findByUserIdAndSubLevel(UUID userId, String subLevel);
    Optional<SyllableProgress> findByUserIdAndSubLevelAndSetId(UUID userId, String subLevel, Integer setId);
    void deleteByUserId(UUID userId);
}
