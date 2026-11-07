package com.pamana.auth.dto;

import com.pamana.auth.Role;

import java.time.LocalDateTime;
import java.util.UUID;

public class UserResponse {

    private UUID id;
    private String name;
    private String username;
    private String email;
    private Role role;
    private String gender;
    private LocalDateTime createdAt;

    public UserResponse() {
    }

    public UserResponse(UUID id, String name, String username, String email, Role role, String gender, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.username = username;
        this.email = email;
        this.role = role;
        this.gender = gender != null ? gender : "Lalaki";
        this.createdAt = createdAt;
    }

    // Backwards-compatible constructor for existing callers
    public UserResponse(UUID id, String name, String email, Role role, LocalDateTime createdAt) {
        this(
                id,
                name,
                (email != null && !email.isBlank()) ? email.split("@")[0] : (name != null ? name.toLowerCase().replaceAll("\\s+", "") : "user"),
                email,
                role,
                "Lalaki",
                createdAt
        );
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getUsername() {
        return username;
    }

    public void setUsername(String username) {
        this.username = username;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
