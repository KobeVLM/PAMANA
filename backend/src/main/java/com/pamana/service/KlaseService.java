package com.pamana.service;

import com.pamana.dto.LeaderboardEntry;
import com.pamana.dto.LearnerDetail;
import com.pamana.dto.WordMasteryStatus;
import com.pamana.model.HamonSession;
import com.pamana.model.Klase;
import com.pamana.model.ModuleProgress;
import com.pamana.model.User;
import com.pamana.repository.HamonSessionRepository;
import com.pamana.repository.KlaseRepository;
import com.pamana.repository.ModuleProgressRepository;
import com.pamana.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.context.annotation.Lazy;
import org.springframework.http.HttpStatus;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Random;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class KlaseService {

    private static final Logger log = LoggerFactory.getLogger(KlaseService.class);

    private final KlaseRepository klaseRepository;
    private final UserRepository userRepository;
    private final ModuleProgressRepository moduleProgressRepository;
    private final SimpMessagingTemplate simpMessagingTemplate;
    private final ProgressService progressService;
    private final HamonSessionRepository hamonSessionRepository;

    public KlaseService(KlaseRepository klaseRepository,
                        UserRepository userRepository,
                        ModuleProgressRepository moduleProgressRepository,
                        @Lazy SimpMessagingTemplate simpMessagingTemplate,
                        @Lazy ProgressService progressService,
                        HamonSessionRepository hamonSessionRepository) {
        this.klaseRepository = klaseRepository;
        this.userRepository = userRepository;
        this.moduleProgressRepository = moduleProgressRepository;
        this.simpMessagingTemplate = simpMessagingTemplate;
        this.progressService = progressService;
        this.hamonSessionRepository = hamonSessionRepository;
    }

    @Transactional
    public Klase createKlase(UUID teacherId, String name) {
        log.info("Teacher {} creating klase: {}", teacherId, name);
        String joinCode = generateUniqueJoinCode();
        Klase klase = new Klase(name, teacherId, joinCode);
        return klaseRepository.save(klase);
    }

    @Transactional(readOnly = true)
    public Klase getTeacherKlase(UUID teacherId) {
        return klaseRepository.findByTeacherId(teacherId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Walang klase ang guro na ito."));
    }

    @Transactional(readOnly = true)
    public List<LearnerDetail> getTeacherView(UUID klaseId, UUID teacherId) {
        Klase klase = klaseRepository.findById(klaseId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Hindi mahanap ang klase."));

        if (!klase.getTeacherId().equals(teacherId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Hindi ikaw ang guro ng klaseng ito.");
        }

        List<User> students = userRepository.findAll().stream()
                .filter(u -> klaseId.equals(u.getKlaseId()))
                .collect(Collectors.toList());

        List<LearnerDetail> details = new ArrayList<>();
        for (User student : students) {
            LearnerDetail detail = new LearnerDetail();
            detail.setLearnerId(student.getId());
            detail.setLearnerName(student.getName());

            List<ModuleProgress> progresses = moduleProgressRepository.findByUserId(student.getId());
            long modulesCompleted = progresses.stream()
                    .filter(ModuleProgress::getIsComplete)
                    .count();
            detail.setModulesCompleted((int) modulesCompleted);

            List<HamonSession> hamonSessions = hamonSessionRepository.findByUserId(student.getId());
            double hamonPassRate = hamonSessions.stream()
                    .filter(HamonSession::getIsComplete)
                    .mapToDouble(s -> s.getPassRate().doubleValue())
                    .average()
                    .orElse(0.0);
            detail.setHamonPassRate(hamonPassRate);

            List<WordMasteryStatus> masteryList = progressService.getWordMasteryList(student.getId());
            detail.setWordMasteryList(masteryList);

            int atRiskCount = (int) masteryList.stream()
                    .filter(w -> "red".equalsIgnoreCase(w.getStatus()))
                    .count();
            detail.setAtRiskWordCount(atRiskCount);

            details.add(detail);
        }

        return details;
    }

    private String generateUniqueJoinCode() {
        String characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
        Random random = new Random();
        String code;
        do {
            StringBuilder sb = new StringBuilder(6);
            for (int i = 0; i < 6; i++) {
                sb.append(characters.charAt(random.nextInt(characters.length())));
            }
            code = sb.toString();
        } while (klaseRepository.existsByJoinCode(code));
        return code;
    }

    @Transactional
    public void joinKlase(UUID userId, String joinCode) {
        log.info("Student {} attempting to join classroom with join code: {}", userId, joinCode);

        Klase klase = klaseRepository.findByJoinCode(joinCode)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hindi wasto ang classroom join code."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        user.setKlaseId(klase.getId());
        userRepository.save(user);

        log.info("Successfully joined student {} to classroom {}", userId, klase.getName());

        broadcastLeaderboardUpdate(klase.getId());
    }

    @Transactional(readOnly = true)
    public List<LeaderboardEntry> getLeaderboard(UUID klaseId) {
        log.info("Compiling classroom leaderboard for klaseId: {}", klaseId);

        List<User> students = userRepository.findAll().stream()
                .filter(u -> klaseId.equals(u.getKlaseId()))
                .collect(Collectors.toList());

        List<LeaderboardEntry> entries = new ArrayList<>();

        for (User student : students) {
            List<ModuleProgress> progresses = moduleProgressRepository.findByUserId(student.getId());
            long modulesCompleted = progresses.stream()
                    .filter(ModuleProgress::getIsComplete)
                    .count();

            String currentModule = "Module 1: Syllables";
            int activeNum = 1;
            for (ModuleProgress p : progresses) {
                if (p.getIsUnlocked() && !p.getIsComplete()) {
                    activeNum = p.getModuleNumber();
                    break;
                }
            }

            if (activeNum == 2) currentModule = "Module 2: Garden";
            else if (activeNum == 3) currentModule = "Module 3: Kitchen";
            else if (activeNum == 4) currentModule = "Module 4: Sala";

            entries.add(new LeaderboardEntry(
                    0,
                    student.getId(),
                    student.getName(),
                    currentModule,
                    (int) modulesCompleted
            ));
        }

        entries.sort(Comparator.comparing(LeaderboardEntry::getModulesCompleted).reversed()
                .thenComparing(LeaderboardEntry::getLearnerName));

        for (int i = 0; i < entries.size(); i++) {
            entries.get(i).setRank(i + 1);
        }

        return entries;
    }

    public void broadcastLeaderboardUpdate(UUID klaseId) {
        if (klaseId == null) {
            return;
        }
        try {
            log.info("Broadcasting live leaderboard update for klaseId: {}", klaseId);
            List<LeaderboardEntry> leaderboard = getLeaderboard(klaseId);
            simpMessagingTemplate.convertAndSend("/topic/leaderboard/" + klaseId, leaderboard);
        } catch (Exception e) {
            log.error("Failed to broadcast leaderboard update to STOMP Broker: {}", e.getMessage());
        }
    }
}
