package com.pamana.auth;

import jakarta.persistence.*;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @NotBlank
    @Size(max = 50)
    @Column(nullable = false, unique = true, length = 50)
    private String username;

    @Size(max = 100)
    @Column(nullable = false, length = 100)
    private String name = "Adventurer";

    @Email
    @Size(max = 255)
    @Column(nullable = true, unique = true, length = 255)
    private String email;

    @Size(max = 20)
    @Column(length = 20)
    private String gender = "Lalaki";

    @NotBlank
    @Size(max = 255)
    @Column(name = "password_hash", nullable = false, length = 255)
    private String passwordHash;

    @NotNull
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role;

    @Column(name = "parent_id")
    private UUID parentId;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = LocalDateTime.now();
        if (this.gender == null || this.gender.isBlank()) {
            this.gender = "Lalaki";
        }
        if (this.name == null || this.name.isBlank()) {
            this.name = "Adventurer";
        }
    }

    public User() {
    }

    public User(String name, String username, String email, String passwordHash, Role role, String gender) {
        this.name = (name != null && !name.isBlank()) ? name : "Adventurer";
        this.username = username;
        this.email = email;
        this.passwordHash = passwordHash;
        this.role = role;
        this.gender = (gender != null && !gender.isBlank()) ? gender : "Lalaki";
    }

    public User(String name, String username, String email, String passwordHash, Role role) {
        this(name, username, email, passwordHash, role, "Lalaki");
    }

    // Backwards-compatible constructor
    public User(String name, String email, String passwordHash, Role role) {
        this.name = (name != null && !name.isBlank()) ? name : "Adventurer";
        this.email = email;
        this.username = (email != null && !email.isBlank()) ? email.split("@")[0] : (name != null ? name.toLowerCase().replaceAll("\\s+", "") : "user");
        this.passwordHash = passwordHash;
        this.role = role;
        this.gender = "Lalaki";
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public void setPasswordHash(String passwordHash) {
        this.passwordHash = passwordHash;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public UUID getParentId() {
        return parentId;
    }

    public void setParentId(UUID parentId) {
        this.parentId = parentId;
    }
}
