package com.pamana.repository;

import com.pamana.model.HamonSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface HamonSessionRepository extends JpaRepository<HamonSession, UUID> {
    Optional<HamonSession> findByUserIdAndIsCompleteFalse(UUID userId);
    List<HamonSession> findByUserId(UUID userId);
}
