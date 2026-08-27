package com.pamana.parent;

import com.pamana.parent.SessionLogRepository;
import com.pamana.parent.SessionLog;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface SessionLogRepository extends JpaRepository<SessionLog, UUID> {
    List<SessionLog> findByUserId(UUID userId);
}
