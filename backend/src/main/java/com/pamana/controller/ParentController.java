package com.pamana.controller;

import com.pamana.dto.LinkLearnerRequest;
import com.pamana.model.Role;
import com.pamana.model.User;
import com.pamana.repository.UserRepository;
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
        log.info("REST API Request: Link learner email {} to parent {}", request.getLearnerEmail(), parentId);

        User learner = userRepository.findByEmail(request.getLearnerEmail())
                .orElse(null);

        if (learner == null || learner.getRole() != Role.LEARNER) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of("error", "Invalid learner email."));
        }

        learner.setParentId(parentId);
        userRepository.save(learner);

        return ResponseEntity.ok(Map.of("message", "Learner successfully linked", "learnerId", learner.getId()));
    }

    @GetMapping("/linked-learner")
    @PreAuthorize("hasRole('PARENT')")
    public ResponseEntity<?> getLinkedLearner(Principal principal) {
        UUID parentId = UUID.fromString(principal.getName());
        log.info("REST API Request: Get linked learner for parent {}", parentId);

        List<User> linkedLearners = userRepository.findByParentId(parentId);
        if (linkedLearners.isEmpty()) {
            return ResponseEntity.ok(Map.of("hasLinkedLearner", false));
        }

        User learner = linkedLearners.get(0);
        return ResponseEntity.ok(Map.of(
                "hasLinkedLearner", true,
                "learnerId", learner.getId(),
                "learnerName", learner.getName()
        ));
    }
}
