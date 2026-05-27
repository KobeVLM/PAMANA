package com.pamana.dto;

import com.pamana.model.Role;
import java.time.LocalDateTime;
import java.util.UUID;

public class UserResponse {

    private UUID id;
    private String name;
    private String email;
    private Role role;
    private UUID klaseId;
    private LocalDateTime createdAt;

    public UserResponse() {
    }

    public UserResponse(UUID id, String name, String email, Role role, UUID klaseId, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.email = email;
        this.role = role;
        this.klaseId = klaseId;
        this.createdAt = createdAt;
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

    public UUID getKlaseId() {
        return klaseId;
    }

    public void setKlaseId(UUID klaseId) {
        this.klaseId = klaseId;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
