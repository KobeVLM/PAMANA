package com.pamana.auth;

import com.pamana.auth.Role;
import com.pamana.auth.dto.LoginRequest;
import com.pamana.auth.dto.RegisterRequest;
import com.pamana.auth.dto.UpdateProfileRequest;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ObjectMapper objectMapper;

    @BeforeEach
    public void setup() {
        userRepository.deleteAll();
    }

    @Test
    public void testUserRegistrationAndLoginFlow() throws Exception {
        // 1. Register a new user with username and gender
        RegisterRequest registerReq = new RegisterRequest(
                "juancruz",
                "Juan Cruz",
                "juan.cruz@example.com",
                "securePassword123",
                Role.LEARNER,
                "Lalaki"
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.username", is("juancruz")))
                .andExpect(jsonPath("$.name", is("Juan Cruz")))
                .andExpect(jsonPath("$.email", is("juan.cruz@example.com")))
                .andExpect(jsonPath("$.role", is("LEARNER")))
                .andExpect(jsonPath("$.gender", is("Lalaki")));

        // 2. Register the same user again (should fail with 409 Conflict)
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isConflict());

        // 3. Login with username and password
        LoginRequest loginReq = new LoginRequest("juancruz", "securePassword123");

        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.id", notNullValue()))
                .andExpect(jsonPath("$.user.username", is("juancruz")))
                .andExpect(jsonPath("$.user.name", is("Juan Cruz")))
                .andExpect(jsonPath("$.user.role", is("LEARNER")))
                .andExpect(jsonPath("$.user.gender", is("Lalaki")))
                .andReturn();

        // Extract token
        String responseContent = loginResult.getResponse().getContentAsString();
        String token = objectMapper.readTree(responseContent).get("token").asText();

        // 4. Update profile using JWT bearer token
        UpdateProfileRequest updateReq = new UpdateProfileRequest("Juan Bagong Bayani", "Babae");

        mockMvc.perform(put("/api/auth/profile")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username", is("juancruz")))
                .andExpect(jsonPath("$.name", is("Juan Bagong Bayani")))
                .andExpect(jsonPath("$.gender", is("Babae")));

        // 5. Update profile without token should return 401 Unauthorized
        mockMvc.perform(put("/api/auth/profile")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isUnauthorized());

        // 6. Verify that access to a dummy secured endpoint is blocked without token
        mockMvc.perform(get("/api/syllables/status")
                .param("userId", "00000000-0000-0000-0000-000000000000"))
                .andExpect(status().isForbidden());

        // 7. Verify that access to dummy secured endpoint is allowed with valid token header
        mockMvc.perform(get("/api/syllables/status")
                .header("Authorization", "Bearer " + token)
                .param("userId", "00000000-0000-0000-0000-000000000000"))
                .andExpect(status().isOk());
    }

    @Test
    public void testDuplicateUsernameCaseInsensitive() throws Exception {
        RegisterRequest initialUser = new RegisterRequest(
                "KidAdventurer",
                "Adventurer One",
                "kid1@example.com",
                "securePassword123",
                Role.LEARNER,
                "Lalaki"
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(initialUser)))
                .andExpect(status().isCreated());

        RegisterRequest duplicateUser = new RegisterRequest(
                "kidadventurer",
                "Adventurer Two",
                "kid2@example.com",
                "securePassword123",
                Role.LEARNER,
                "Babae"
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(duplicateUser)))
                .andExpect(status().isConflict());
    }

    @Test
    public void testLoginWithEmailFallback() throws Exception {
        RegisterRequest registerReq = new RegisterRequest(
                "legacyuser",
                "Legacy User",
                "legacy@example.com",
                "password123",
                Role.LEARNER,
                "Lalaki"
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        // Login using email instead of username
        LoginRequest loginReq = new LoginRequest("legacy@example.com", "password123");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.user.username", is("legacyuser")));
    }

    @Test
    public void testLoginWithInvalidCredentials() throws Exception {
        LoginRequest invalidLogin = new LoginRequest("nonexistent", "wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidLogin)))
                .andExpect(status().isUnauthorized());
    }
}
