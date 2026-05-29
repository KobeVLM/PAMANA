package com.pamana.repository;

import com.pamana.model.ModuleAttemptHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface ModuleAttemptHistoryRepository extends JpaRepository<ModuleAttemptHistory, UUID> {
    List<ModuleAttemptHistory> findByUserIdOrderByCompletedAtAsc(UUID userId);
    
    @Query("SELECT COALESCE(MAX(m.attemptNumber), 0) FROM ModuleAttemptHistory m WHERE m.userId = :userId AND m.moduleNumber = :moduleNumber")
    Integer findMaxAttemptNumberByUserIdAndModuleNumber(@Param("userId") UUID userId, @Param("moduleNumber") Integer moduleNumber);
}
