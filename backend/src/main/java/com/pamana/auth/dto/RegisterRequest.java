package com.pamana.auth.dto;

import com.pamana.auth.Role;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class RegisterRequest {

    @NotBlank(message = "Username is required")
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    @Pattern(regexp = "^[a-zA-Z0-9_]{3,50}$", message = "Username must be 3-50 alphanumeric characters or underscores")
    private String username;

    @Size(max = 100, message = "Pangalan must be less than 100 characters")
    private String name;

    @Email(message = "Email format must be valid")
    @Size(max = 255)
    private String email;

    @NotBlank(message = "Password is required")
    @Size(min = 6, max = 100, message = "Password must be between 6 and 100 characters")
    private String password;

    @NotNull(message = "Role is required")
    private Role role;

    @Size(max = 20)
    private String gender = "Lalaki";

    public RegisterRequest() {
    }

    public RegisterRequest(String username, String name, String email, String password, Role role, String gender) {
        this.username = username;
        this.name = (name != null && !name.isBlank()) ? name : "Adventurer";
        this.email = email;
        this.password = password;
        this.role = role;
        this.gender = (gender != null && !gender.isBlank()) ? gender : "Lalaki";
    }

    public RegisterRequest(String username, String name, String email, String password, Role role) {
        this(username, name, email, password, role, "Lalaki");
    }

    // Backwards-compatible 4-argument constructor
    public RegisterRequest(String name, String email, String password, Role role) {
        if (email != null && email.contains("@")) {
            this.username = email.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "_");
            this.name = (name != null && !name.isBlank()) ? name : "Adventurer";
            this.email = email;
        } else if (email != null && !email.isBlank()) {
            this.username = email;
            this.name = (name != null && !name.isBlank()) ? name : "Adventurer";
            this.email = null;
        } else {
            this.username = (name != null && !name.isBlank()) ? name.replaceAll("[^a-zA-Z0-9_]", "_") : "user";
            this.name = (name != null && !name.isBlank()) ? name : "Adventurer";
            this.email = null;
        }
        this.password = password;
        this.role = role;
        this.gender = "Lalaki";
    }

    // Getters and Setters
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

    public String getPassword() {
        return password;
    }

    public void setPassword(String password) {
        this.password = password;
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
}
