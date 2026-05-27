package com.pamana.service;

import com.pamana.dto.AuthResponse;
import com.pamana.dto.LoginRequest;
import com.pamana.dto.RegisterRequest;
import com.pamana.dto.UserResponse;
import com.pamana.model.Klase;
import com.pamana.model.ModuleProgress;
import com.pamana.model.User;
import com.pamana.repository.KlaseRepository;
import com.pamana.repository.ModuleProgressRepository;
import com.pamana.repository.UserRepository;
import com.pamana.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.Optional;
import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final KlaseRepository klaseRepository;
    private final ModuleProgressRepository moduleProgressRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(
            UserRepository userRepository,
            KlaseRepository klaseRepository,
            ModuleProgressRepository moduleProgressRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.klaseRepository = klaseRepository;
        this.moduleProgressRepository = moduleProgressRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public UserResponse createAccount(RegisterRequest request) {
        log.info("Attempting to create account for email: {}", request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            log.warn("Account registration failed - email already exists: {}", request.getEmail());
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ang email na ito ay may rehistradong account na.");
        }

        // 1. Hash the password
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        // 2. Create User entity
        User user = new User(
                request.getName(),
                request.getEmail(),
                hashedPassword,
                request.getRole()
        );

        // 3. Process optional classroom join code (if user is a LEARNER)
        if (StringUtils.hasText(request.getJoinCode())) {
            Optional<Klase> klaseOpt = klaseRepository.findByJoinCode(request.getJoinCode());
            if (klaseOpt.isEmpty()) {
                log.warn("Account registration failed - invalid join code: {}", request.getJoinCode());
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Hindi wasto ang classroom join code.");
            }
            user.setKlaseId(klaseOpt.get().getId());
        }

        // 4. Save User to DB
        User savedUser = userRepository.save(user);
        log.info("Successfully created user account with ID: {}", savedUser.getId());

        // 5. Initialize progress tracks for all 4 educational modules
        initializeModuleProgress(savedUser.getId());

        return mapToUserResponse(savedUser);
    }

    @Transactional(readOnly = true)
    public AuthResponse authenticate(LoginRequest request) {
        log.info("Attempting login verification for email: {}", request.getEmail());

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> {
                    log.warn("Login failed - email not found: {}", request.getEmail());
                    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Maling email o password.");
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            log.warn("Login failed - password mismatch for email: {}", request.getEmail());
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Maling email o password.");
        }

        // Generate custom state-less authentication token
        String jwt = jwtTokenProvider.generateToken(
                user.getId(),
                user.getEmail(),
                user.getRole().name()
        );

        log.info("Login successful for user ID: {}, generating bearer token", user.getId());
        return new AuthResponse(jwt, mapToUserResponse(user));
    }

    private void initializeModuleProgress(UUID userId) {
        log.info("Initializing module progress locks for user: {}", userId);
        
        // Module 1 is unlocked by default, Modules 2-4 are locked on registration
        ModuleProgress m1 = new ModuleProgress(userId, 1, true, false);
        ModuleProgress m2 = new ModuleProgress(userId, 2, false, false);
        ModuleProgress m3 = new ModuleProgress(userId, 3, false, false);
        ModuleProgress m4 = new ModuleProgress(userId, 4, false, false);

        moduleProgressRepository.save(m1);
        moduleProgressRepository.save(m2);
        moduleProgressRepository.save(m3);
        moduleProgressRepository.save(m4);
    }

    private UserResponse mapToUserResponse(User user) {
        return new UserResponse(
                user.getId(),
                user.getName(),
                user.getEmail(),
                user.getRole(),
                user.getKlaseId(),
                user.getCreatedAt()
        );
    }
}
