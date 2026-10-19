package com.pamana.parent;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.UUID;

@Service
public class SessionLogService {

    private static final Logger log = LoggerFactory.getLogger(SessionLogService.class);

    private final SessionLogRepository sessionLogRepository;

    public SessionLogService(SessionLogRepository sessionLogRepository) {
        this.sessionLogRepository = sessionLogRepository;
    }

    @Transactional
    public UUID startSession(UUID userId, Integer moduleAccessed) {
        SessionLog session = new SessionLog(userId, moduleAccessed);
        SessionLog saved = sessionLogRepository.save(session);
        log.info("Started session {} for user {}", saved.getId(), userId);
        return saved.getId();
    }

    @Transactional
    public void endSession(UUID userId, UUID sessionId) {
        SessionLog session = sessionLogRepository.findById(sessionId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hindi nahanap ang session."));

        if (!userId.equals(session.getUserId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Hindi ka awtorisado sa session na ito.");
        }

        if (session.getEndedAt() != null) {
            return; // already closed - keep this idempotent
        }

        LocalDateTime endedAt = LocalDateTime.now();
        session.setEndedAt(endedAt);
        long minutes = Duration.between(session.getStartedAt(), endedAt).toMinutes();
        session.setDurationMinutes((int) Math.max(minutes, 0));
        sessionLogRepository.save(session);
        log.info("Ended session {} for user {} after {} minute(s)", sessionId, userId, session.getDurationMinutes());
    }
}
