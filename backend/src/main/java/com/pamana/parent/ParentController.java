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
import java.util.HashMap;
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
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Student ID is required."));
        }

        User learner = null;
        try {
            UUID studentId = UUID.fromString(identifier);
            learner = userRepository.findById(studentId).orElse(null);
        } catch (IllegalArgumentException e) {
            log.warn("Link learner failed - identifier is not a valid UUID: '{}'", identifier);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", "Invalid Student ID format. Please enter a valid Student ID."));
        }

        if (learner == null || learner.getRole() != Role.LEARNER) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Learner not found. Please check the Student ID and try again."));
        }

        learner.setParentId(parentId);
        userRepository.save(learner);

        Map<String, Object> response = new HashMap<>();
        response.put("message", "Learner linked successfully!");
        response.put("learnerId", learner.getId());
        response.put("learnerName", learner.getName());
        // HashMap (not Map.of) so a username-only learner serializes a null
        // email instead of throwing a NullPointerException.
        response.put("learnerEmail", learner.getEmail());

        return ResponseEntity.ok(response);
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
                .map(this::toLearnerSummary)
                .toList();

        if (learnersList.isEmpty()) {
            return ResponseEntity.ok(Map.of("hasLinkedLearner", false, "learners", List.of()));
        }

        Map<String, Object> first = learnersList.get(0);
        Map<String, Object> response = new HashMap<>();
        response.put("hasLinkedLearner", true);
        response.put("learnerId", first.get("id"));
        response.put("learnerName", first.get("name"));
        response.put("learnerEmail", first.get("email"));
        response.put("learners", learnersList);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/linked-learners")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<?> getLinkedLearners(Principal principal) {
        UUID parentId = UUID.fromString(principal.getName());
        log.info("REST API Request: Get all linked learners for parent {}", parentId);

        List<User> linkedLearners = userRepository.findByParentId(parentId);
        List<Map<String, Object>> learnersList = linkedLearners.stream()
                .filter(u -> u.getRole() == Role.LEARNER)
                .map(this::toLearnerSummary)
                .toList();

        return ResponseEntity.ok(learnersList);
    }

    /**
     * Builds a learner summary as a mutable map. HashMap is used instead of
     * Map.of because email is optional: username-only accounts store null, and
     * Map.of rejects null values with a NullPointerException (HTTP 500).
     */
    private Map<String, Object> toLearnerSummary(User user) {
        Map<String, Object> learner = new HashMap<>();
        learner.put("id", user.getId());
        learner.put("name", user.getName());
        learner.put("email", user.getEmail());
        return learner;
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
