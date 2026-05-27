package com.pamana.dto;

import com.pamana.model.Role;
import java.util.UUID;

public class AuthResponse {

    private String token;
    private Role role;
    private UUID userId;

    public AuthResponse() {
    }

    public AuthResponse(String token, Role role, UUID userId) {
        this.token = token;
        this.role = role;
        this.userId = userId;
    }

    // Getters and Setters
    public String getToken() {
        return token;
    }

    public void setToken(String token) {
        this.token = token;
    }

    public Role getRole() {
        return role;
    }

    public void setRole(Role role) {
        this.role = role;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }
}
