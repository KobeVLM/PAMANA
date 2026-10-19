package com.pamana.parent;

import com.pamana.auth.UserRepository;
import com.pamana.auth.User;
import com.pamana.auth.Role;
import com.pamana.parent.dto.LinkLearnerRequest;

import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/parent")
public class ParentController {

    private static final Logger log = LoggerFactory.getLogger(ParentController.class);
    private final UserRepository userRepository;

    public ParentController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @PostMapping("/link-learner")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<?> linkLearner(@Valid @RequestBody LinkLearnerRequest request, Principal principal) {
        UUID parentId = UUID.fromString(principal.getName());
        String identifier = request.getIdentifier();
        log.info("REST API Request: Link learner identifier '{}' to parent {}", identifier, parentId);

        if (identifier == null || identifier.isBlank()) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Email o Student Code ay kinakailangan."));
        }

        User learner = null;
        try {
            UUID studentId = UUID.fromString(identifier);
            learner = userRepository.findById(studentId).orElse(null);
        } catch (IllegalArgumentException ignored) {
            // Not a UUID format, lookup by email
        }

        if (learner == null) {
            learner = userRepository.findByEmail(identifier).orElse(null);
        }

        if (learner == null || learner.getRole() != Role.LEARNER) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Hindi nahanap ang mag-aaral. Pakitiyak na tama ang email o Student Code."));
        }

        learner.setParentId(parentId);
        userRepository.save(learner);

        return ResponseEntity.ok(Map.of(
                "message", "Matagumpay na nai-link ang mag-aaral!",
                "learnerId", learner.getId(),
                "learnerName", learner.getName(),
                "learnerEmail", learner.getEmail()
        ));
    }

    @GetMapping("/linked-learner")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<?> getLinkedLearner(Principal principal) {
        UUID parentId = UUID.fromString(principal.getName());
        log.info("REST API Request: Get linked learner for parent {}", parentId);

        List<User> linkedLearners = userRepository.findByParentId(parentId);
        if (linkedLearners.isEmpty()) {
            return ResponseEntity.ok(Map.of("hasLinkedLearner", false, "learners", List.of()));
        }

        List<Map<String, Object>> learnersList = linkedLearners.stream()
                .filter(u -> u.getRole() == Role.LEARNER)
                .map(u -> Map.<String, Object>of(
                        "id", u.getId(),
                        "name", u.getName(),
                        "email", u.getEmail()
                ))
                .toList();

        if (learnersList.isEmpty()) {
            return ResponseEntity.ok(Map.of("hasLinkedLearner", false, "learners", List.of()));
        }

        Map<String, Object> first = learnersList.get(0);
        return ResponseEntity.ok(Map.of(
                "hasLinkedLearner", true,
                "learnerId", first.get("id"),
                "learnerName", first.get("name"),
                "learnerEmail", first.get("email"),
                "learners", learnersList
        ));
    }

    @GetMapping("/linked-learners")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<?> getLinkedLearners(Principal principal) {
        UUID parentId = UUID.fromString(principal.getName());
        log.info("REST API Request: Get all linked learners for parent {}", parentId);

        List<User> linkedLearners = userRepository.findByParentId(parentId);
        List<Map<String, Object>> learnersList = linkedLearners.stream()
                .filter(u -> u.getRole() == Role.LEARNER)
                .map(u -> Map.<String, Object>of(
                        "id", u.getId(),
                        "name", u.getName(),
                        "email", u.getEmail()
                ))
                .toList();

        return ResponseEntity.ok(learnersList);
    }

    @DeleteMapping("/unlink-learner/{learnerId}")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<?> unlinkLearner(@PathVariable UUID learnerId, Principal principal) {
        UUID parentId = UUID.fromString(principal.getName());
        log.info("REST API Request: Unlink learner {} from parent {}", learnerId, parentId);

        User learner = userRepository.findById(learnerId).orElse(null);
        if (learner == null || !parentId.equals(learner.getParentId())) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(Map.of("error", "Hindi nahanap ang mag-aaral na nakaugnay sa account na ito."));
        }

        learner.setParentId(null);
        userRepository.save(learner);

        return ResponseEntity.ok(Map.of("message", "Naalis na ang ugnayan sa mag-aaral."));
    }
}
