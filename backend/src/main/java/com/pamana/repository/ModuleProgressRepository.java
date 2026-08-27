package com.pamana.repository;

import com.pamana.model.ModuleProgress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ModuleProgressRepository extends JpaRepository<ModuleProgress, UUID> {
    List<ModuleProgress> findByUserId(UUID userId);
    Optional<ModuleProgress> findByUserIdAndModuleNumber(UUID userId, Integer moduleNumber);
}
