package com.pamana.auth;

import com.pamana.auth.dto.AuthResponse;
import com.pamana.auth.dto.LoginRequest;
import com.pamana.auth.dto.RegisterRequest;
import com.pamana.auth.dto.UpdateProfileRequest;
import com.pamana.auth.dto.UserResponse;
import com.pamana.progress.ModuleProgressRepository;
import com.pamana.progress.ModuleProgress;
import com.pamana.security.JwtTokenProvider;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;
import org.springframework.web.server.ResponseStatusException;

import java.util.UUID;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository userRepository;
    private final ModuleProgressRepository moduleProgressRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;

    public AuthService(
            UserRepository userRepository,
            ModuleProgressRepository moduleProgressRepository,
            PasswordEncoder passwordEncoder,
            JwtTokenProvider jwtTokenProvider) {
        this.userRepository = userRepository;
        this.moduleProgressRepository = moduleProgressRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    @Transactional
    public UserResponse createAccount(RegisterRequest request) {
        String username = request.getUsername();
        if (!StringUtils.hasText(username)) {
            if (StringUtils.hasText(request.getEmail()) && request.getEmail().contains("@")) {
                username = request.getEmail().split("@")[0].replaceAll("[^a-zA-Z0-9_]", "_");
            } else if (StringUtils.hasText(request.getName())) {
                username = request.getName().toLowerCase().replaceAll("[^a-zA-Z0-9_]", "_");
            } else {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Kailangan ang username.");
            }
        }
        username = username.trim();

        log.info("Attempting to create account for username: {}", username);

        if (userRepository.existsByUsernameIgnoreCase(username)) {
            log.warn("Account registration failed - username already exists: {}", username);
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Ang username na ito ay may rehistradong account na.");
        }

        String email = null;
        if (StringUtils.hasText(request.getEmail())) {
            email = request.getEmail().trim();
            if (userRepository.existsByEmail(email)) {
                log.warn("Account registration failed - email already exists: {}", email);
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Ang email na ito ay may rehistradong account na.");
            }
        }

        String name = StringUtils.hasText(request.getName()) ? request.getName().trim() : "Adventurer";
        String gender = StringUtils.hasText(request.getGender()) ? request.getGender().trim() : "Lalaki";

        // 1. Hash the password
        String hashedPassword = passwordEncoder.encode(request.getPassword());

        // 2. Create User entity
        User user = new User(
                name,
                username,
                email,
                hashedPassword,
                request.getRole(),
                gender
        );

        // 3. Save User to DB
        User savedUser = userRepository.save(user);
        log.info("Successfully created user account with ID: {}", savedUser.getId());

        // 4. Initialize progress tracks for all 4 educational modules
        initializeModuleProgress(savedUser.getId());

        return mapToUserResponse(savedUser);
    }

    @Transactional(readOnly = true)
    public AuthResponse authenticate(LoginRequest request) {
        String loginIdentifier = request.getUsername() != null ? request.getUsername().trim() : "";
        log.info("Attempting login verification for identifier: {}", loginIdentifier);

        User user = userRepository.findByUsernameIgnoreCase(loginIdentifier)
                .or(() -> userRepository.findByEmail(loginIdentifier))
                .orElseThrow(() -> {
                    log.warn("Login failed - identifier not found: {}", loginIdentifier);
                    return new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Maling username o password.");
                });

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            log.warn("Login failed - password mismatch for identifier: {}", loginIdentifier);
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Maling username o password.");
        }

        // Generate custom state-less authentication token
        String jwt = jwtTokenProvider.generateToken(
                user.getId(),
                user.getUsername(),
                user.getEmail(),
                user.getRole().name()
        );

        log.info("Login successful for user ID: {}, generating bearer token", user.getId());
        return new AuthResponse(jwt, mapToUserResponse(user));
    }

    @Transactional
    public UserResponse updateProfile(UUID userId, UpdateProfileRequest request) {
        log.info("Attempting to update profile for user ID: {}", userId);

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found"));

        if (StringUtils.hasText(request.getName())) {
            user.setName(request.getName().trim());
        }
        if (StringUtils.hasText(request.getGender())) {
            user.setGender(request.getGender().trim());
        }

        User savedUser = userRepository.save(user);
        log.info("Successfully updated profile for user ID: {}", savedUser.getId());
        return mapToUserResponse(savedUser);
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
                user.getUsername(),
                user.getEmail(),
                user.getRole(),
                user.getGender(),
                user.getCreatedAt()
        );
    }
}
