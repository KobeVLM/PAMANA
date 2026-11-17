package com.pamana.parent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pamana.auth.Role;
import com.pamana.auth.UserRepository;
import com.pamana.auth.dto.LoginRequest;
import com.pamana.auth.dto.RegisterRequest;
import com.pamana.parent.dto.LinkLearnerRequest;
import com.pamana.progress.ModuleProgress;
import com.pamana.progress.ModuleProgressRepository;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class ReportControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ModuleProgressRepository moduleProgressRepository;

    @Autowired
    private ParentReportRepository parentReportRepository;

    @Autowired
    private SessionLogRepository sessionLogRepository;

    private String parentToken;
    private UUID learnerId;

    @BeforeEach
    public void setup() throws Exception {
        sessionLogRepository.deleteAll();
        parentReportRepository.deleteAll();
        moduleProgressRepository.deleteAll();
        userRepository.deleteAll();

        register("parent_reports", "Maria Santos", Role.PARENT);
        parentToken = login("parent_reports");

        // Learners registered through the app have no email.
        learnerId = registerLearner("report_learner", "Bianca Santos");
        linkLearner(learnerId);
    }

    @Test
    public void generatesReportForLearnerWithoutEmail() throws Exception {
        completeModule(learnerId, 1);

        MvcResult result = mockMvc.perform(get("/api/reports/generate/{userId}/{moduleNumber}", learnerId, 1)
                .header("Authorization", "Bearer " + parentToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andExpect(header().string(HttpHeaders.CONTENT_DISPOSITION,
                        containsString("pamana_progress_report_module_1.pdf")))
                .andReturn();

        byte[] body = result.getResponse().getContentAsByteArray();
        assertThat(body.length).isGreaterThan(0);
        assertThat(new String(body, 0, 4, StandardCharsets.US_ASCII)).isEqualTo("%PDF");
        assertThat(parentReportRepository.findAll()).hasSize(1);
    }

    @Test
    public void generatesVocabularyReportForLearnerWithoutEmail() throws Exception {
        completeModule(learnerId, 3);

        MvcResult result = mockMvc.perform(get("/api/reports/generate/{userId}/{moduleNumber}", learnerId, 3)
                .header("Authorization", "Bearer " + parentToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andReturn();

        assertThat(new String(result.getResponse().getContentAsByteArray(), 0, 4, StandardCharsets.US_ASCII))
                .isEqualTo("%PDF");
    }

    @Test
    public void generatesReportWhenLearnerNameHasUnsupportedCharacters() throws Exception {
        UUID emojiLearnerId = registerLearner("emoji_learner", "Bianca \uD83E\uDD84");
        linkLearner(emojiLearnerId);
        completeModule(emojiLearnerId, 1);

        MvcResult result = mockMvc.perform(get("/api/reports/generate/{userId}/{moduleNumber}", emojiLearnerId, 1)
                .header("Authorization", "Bearer " + parentToken))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.APPLICATION_PDF))
                .andReturn();

        assertThat(new String(result.getResponse().getContentAsByteArray(), 0, 4, StandardCharsets.US_ASCII))
                .isEqualTo("%PDF");
    }

    @Test
    public void incompleteModuleReturnsBadRequest() throws Exception {
        mockMvc.perform(get("/api/reports/generate/{userId}/{moduleNumber}", learnerId, 2)
                .header("Authorization", "Bearer " + parentToken))
                .andExpect(status().isBadRequest());
    }

    private MvcResult register(String username, String name, Role role) throws Exception {
        RegisterRequest request = new RegisterRequest(username, name, null, "password123", role, "Lalaki");
        return mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andReturn();
    }

    private UUID registerLearner(String username, String name) throws Exception {
        MvcResult result = register(username, name, Role.LEARNER);
        return UUID.fromString(
                objectMapper.readTree(result.getResponse().getContentAsString()).get("id").asText());
    }

    private String login(String username) throws Exception {
        LoginRequest request = new LoginRequest(username, "password123");
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(result.getResponse().getContentAsString()).get("token").asText();
    }

    private void linkLearner(UUID id) throws Exception {
        mockMvc.perform(post("/api/parent/link-learner")
                .header("Authorization", "Bearer " + parentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(new LinkLearnerRequest(id.toString()))))
                .andExpect(status().isOk());
    }

    private void completeModule(UUID userId, int moduleNumber) {
        ModuleProgress progress = moduleProgressRepository
                .findByUserIdAndModuleNumber(userId, moduleNumber)
                .orElseGet(() -> new ModuleProgress(userId, moduleNumber, true, false));
        progress.setIsUnlocked(true);
        progress.setIsComplete(true);
        progress.setAccuracy(BigDecimal.valueOf(90.00).setScale(2));
        moduleProgressRepository.save(progress);
    }
}
