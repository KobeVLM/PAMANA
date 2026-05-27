package com.pamana.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pamana.dto.LoginRequest;
import com.pamana.dto.RegisterRequest;
import com.pamana.model.Role;
import com.pamana.repository.UserRepository;
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
        // 1. Register a new user
        RegisterRequest registerReq = new RegisterRequest(
                "Juan Cruz",
                "juan.cruz@example.com",
                "securePassword123",
                Role.LEARNER
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.name", is("Juan Cruz")))
                .andExpect(jsonPath("$.email", is("juan.cruz@example.com")))
                .andExpect(jsonPath("$.role", is("LEARNER")));

        // 2. Register the same user again (should fail with 409 Conflict)
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isConflict());

        // 3. Login with correct credentials
        LoginRequest loginReq = new LoginRequest("juan.cruz@example.com", "securePassword123");
        
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token", notNullValue()))
                .andExpect(jsonPath("$.role", is("LEARNER")))
                .andExpect(jsonPath("$.userId", notNullValue()))
                .andReturn();

        // Extract token
        String responseContent = loginResult.getResponse().getContentAsString();
        String token = objectMapper.readTree(responseContent).get("token").asText();

        // 4. Verify that access to a dummy secured endpoint is blocked without token
        mockMvc.perform(get("/api/syllables/status")
                .param("userId", "00000000-0000-0000-0000-000000000000"))
                .andExpect(status().isForbidden());

        // 5. Verify that access to dummy secured endpoint is allowed with valid token header
        // Since we don't have SyllableController fully wired, it will return 404 Not Found instead of 403 Forbidden!
        // This proves the security filter chain let the request pass to the dispatcher servlet!
        mockMvc.perform(get("/api/syllables/status")
                .header("Authorization", "Bearer " + token)
                .param("userId", "00000000-0000-0000-0000-000000000000"))
                .andExpect(status().isNotFound());
    }

    @Test
    public void testLoginWithInvalidCredentials() throws Exception {
        LoginRequest invalidLogin = new LoginRequest("nonexistent@example.com", "wrongpassword");

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidLogin)))
                .andExpect(status().isUnauthorized());
    }
}
