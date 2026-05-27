package com.pamana.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pamana.dto.LoginRequest;
import com.pamana.dto.RegisterRequest;
import com.pamana.dto.SentenceProgressRequest;
import com.pamana.model.Klase;
import com.pamana.model.ModuleProgress;
import com.pamana.model.Role;
import com.pamana.model.User;
import com.pamana.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class SentenceControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private KlaseRepository klaseRepository;

    @Autowired
    private ModuleProgressRepository moduleProgressRepository;

    @Autowired
    private SentenceProgressRepository sentenceProgressRepository;

    @Autowired
    private ParentReportRepository parentReportRepository;

    @Autowired
    private SessionLogRepository sessionLogRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String token;
    private UUID userId;

    @BeforeEach
    public void setup() throws Exception {
        sessionLogRepository.deleteAll();
        parentReportRepository.deleteAll();
        sentenceProgressRepository.deleteAll();
        moduleProgressRepository.deleteAll();
        klaseRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Register a Learner
        RegisterRequest registerReq = new RegisterRequest(
                "Nene Garcia",
                "nene.garcia@example.com",
                "nenePassword123",
                Role.LEARNER
        );

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        // 2. Login
        LoginRequest loginReq = new LoginRequest("nene.garcia@example.com", "nenePassword123");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        String responseContent = loginResult.getResponse().getContentAsString();
        token = objectMapper.readTree(responseContent).get("token").asText();
        userId = UUID.fromString(objectMapper.readTree(responseContent).get("userId").asText());

        // Explicitly unlock Module 4 for testing
        ModuleProgress m4 = moduleProgressRepository.findByUserIdAndModuleNumber(userId, 4)
                .orElseThrow(() -> new IllegalStateException("Module progress 4 not initialized"));
        m4.setIsUnlocked(true);
        moduleProgressRepository.save(m4);
    }

    @Test
    public void testSentenceTaskFlow() throws Exception {
        // 1. Fetch first Tier 1 task (Lolo sentence)
        MvcResult firstTaskResult = mockMvc.perform(get("/api/sentences/task")
                .header("Authorization", "Bearer " + token)
                .param("tier", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.scrambledWords", hasSize(3)))
                .andExpect(jsonPath("$.tier", is(1)))
                .andReturn();

        String taskContent = firstTaskResult.getResponse().getContentAsString();
        String taskIdStr = objectMapper.readTree(taskContent).get("taskId").asText();
        UUID taskId = UUID.fromString(taskIdStr);

        // 2. Submit incorrect arrangement attempt
        SentenceProgressRequest incorrectReq = new SentenceProgressRequest(taskId, Arrays.asList("si", "Ako", "Lolo"));
        mockMvc.perform(post("/api/sentences/progress")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(incorrectReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.correct", is(false)))
                .andExpect(jsonPath("$.attempts", is(1)))
                .andExpect(jsonPath("$.accuracy", is(0.0)));

        // 3. Submit correct arrangement attempt
        SentenceProgressRequest correctReq = new SentenceProgressRequest(taskId, Arrays.asList("Ako", "si", "Lolo"));
        mockMvc.perform(post("/api/sentences/progress")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(correctReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.correct", is(true)))
                .andExpect(jsonPath("$.attempts", is(2)))
                .andExpect(jsonPath("$.accuracy", is(50.0))); // 1 correct / 2 attempts = 50.0%
    }

    @Test
    public void testClassroomLeaderboardAndDashboardAndPdfReport() throws Exception {
        // 1. Seed a classroom
        UUID teacherId = UUID.randomUUID();
        Klase klase = new Klase("Grade 2-Pinoys", teacherId, "ABC123");
        klase = klaseRepository.save(klase);

        // 2. Join the classroom using joinCode
        mockMvc.perform(post("/api/klase/join")
                .header("Authorization", "Bearer " + token)
                .param("joinCode", "ABC123"))
                .andExpect(status().isOk());

        // Verify user klase_id updated
        User student = userRepository.findById(userId).get();
        assertEquals(klase.getId(), student.getKlaseId());

        // 3. Fetch ranked leaderboard
        mockMvc.perform(get("/api/klase/" + klase.getId() + "/leaderboard")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].learnerName", is("Nene Garcia")))
                .andExpect(jsonPath("$[0].modulesCompleted", is(0)));

        // 4. Fetch Parent Progress Dashboard metrics
        mockMvc.perform(get("/api/progress/" + userId + "/dashboard")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.masteredCount", is(0)))
                .andExpect(jsonPath("$.trailCompletion", is(0.0)))
                .andExpect(jsonPath("$.wordMasteryList", hasSize(25)));

        // 5. Explicitly complete Module 1 for the user and check PDF Report Download API
        ModuleProgress m1 = moduleProgressRepository.findByUserIdAndModuleNumber(userId, 1).get();
        m1.setIsComplete(true);
        m1.setAccuracy(BigDecimal.valueOf(87.5));
        moduleProgressRepository.save(m1);

        MvcResult pdfResult = mockMvc.perform(get("/api/reports/generate/" + userId + "/1")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andReturn();

        // Verify PDF content headers
        String contentType = pdfResult.getResponse().getHeader("Content-Type");
        assertEquals("application/pdf", contentType);
        byte[] contentBytes = pdfResult.getResponse().getContentAsByteArray();
        assertNotNull(contentBytes);
        assertEquals(true, contentBytes.length > 0, "PDF content bytes should be generated successfully.");

        // Assert that an audit log row is successfully inserted in the reports log table
        long parentReportsCount = parentReportRepository.count();
        assertEquals(1, parentReportsCount);
    }
}
