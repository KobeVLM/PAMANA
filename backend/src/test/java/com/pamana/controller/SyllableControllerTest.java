package com.pamana.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pamana.dto.LoginRequest;
import com.pamana.dto.RegisterRequest;
import com.pamana.dto.SyllableProgressRequest;
import com.pamana.model.Role;
import com.pamana.repository.ModuleProgressRepository;
import com.pamana.repository.SyllableProgressRepository;
import com.pamana.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class SyllableControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private SyllableProgressRepository syllableProgressRepository;

        @Autowired
        private ModuleProgressRepository moduleProgressRepository;

        @Autowired
        private ObjectMapper objectMapper;

        private String token;
        private UUID userId;

        @BeforeEach
        public void setup() throws Exception {
                syllableProgressRepository.deleteAll();
                moduleProgressRepository.deleteAll();
                userRepository.deleteAll();

                // Register a Learner
                RegisterRequest registerReq = new RegisterRequest(
                                "Nene Garcia",
                                "nene.garcia@example.com",
                                "nenePassword123",
                                Role.LEARNER);

                mockMvc.perform(post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(registerReq)))
                                .andExpect(status().isCreated());

                // Login
                LoginRequest loginReq = new LoginRequest("nene.garcia@example.com", "nenePassword123");
                MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginReq)))
                                .andExpect(status().isOk())
                                .andReturn();

                String responseContent = loginResult.getResponse().getContentAsString();
                token = objectMapper.readTree(responseContent).get("token").asText();
                userId = UUID.fromString(objectMapper.readTree(responseContent).get("user").get("id").asText());
        }

        @Test
        public void testSyllableAttemptRecordAndStatusQuery() throws Exception {
                // 1. Record an attempt for 'pagsama' sub-level, set 1
                SyllableProgressRequest attempt1 = new SyllableProgressRequest("pagsama", 1, "BA", true);

                mockMvc.perform(post("/api/syllables/progress")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(attempt1)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.attempts", is(1)))
                                .andExpect(jsonPath("$.correctCount", is(1)))
                                .andExpect(jsonPath("$.accuracy", is(100.0)))
                                .andExpect(jsonPath("$.module2Unlocked", is(false)));

                // 2. Fetch the overall status
                mockMvc.perform(get("/api/syllables/status")
                                .header("Authorization", "Bearer " + token)
                                .param("userId", userId.toString()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.pagsamaAccuracy", is(100.0)))
                                .andExpect(jsonPath("$.pakingganAccuracy", is(0.0)))
                                .andExpect(jsonPath("$.module2Unlocked", is(false)))
                                .andExpect(jsonPath("$.complete", is(false)));
        }

        @Test
        public void testModuleCompletionUnlocksModule2() throws Exception {
                // Record correct attempts for all 4 required sub-levels to trigger Module 2
                // unlocking!
                String[] subLevels = { "pagsama", "pakinggan", "kilalanin", "rhyming" };

                for (String sub : subLevels) {
                        for (int i = 1; i <= 5; i++) {
                                SyllableProgressRequest req = new SyllableProgressRequest(sub, i, "A", true);
                                mockMvc.perform(post("/api/syllables/progress")
                                                .header("Authorization", "Bearer " + token)
                                                .contentType(MediaType.APPLICATION_JSON)
                                                .content(objectMapper.writeValueAsString(req)))
                                                .andExpect(status().isCreated());
                        }
                }

                // Fetch status - should show complete and Module 2 unlocked!
                mockMvc.perform(get("/api/syllables/status")
                                .header("Authorization", "Bearer " + token)
                                .param("userId", userId.toString()))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.module1Accuracy", is(100.0)))
                                .andExpect(jsonPath("$.complete", is(true)))
                                .andExpect(jsonPath("$.module2Unlocked", is(true)));
        }
}
