package com.pamana.parent;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pamana.auth.Role;
import com.pamana.auth.User;
import com.pamana.auth.UserRepository;
import com.pamana.auth.dto.LoginRequest;
import com.pamana.auth.dto.RegisterRequest;
import com.pamana.parent.dto.LinkLearnerRequest;
import com.pamana.progress.ModuleProgressRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.UUID;

import static org.hamcrest.Matchers.is;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class ParentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ModuleProgressRepository moduleProgressRepository;

    @Autowired
    private SessionLogRepository sessionLogRepository;

    @Autowired
    private ParentReportRepository parentReportRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String parentToken;
    private UUID parentId;
    private UUID learnerId;
    private String learnerEmail;

    @BeforeEach
    public void setup() throws Exception {
        sessionLogRepository.deleteAll();
        parentReportRepository.deleteAll();
        moduleProgressRepository.deleteAll();
        userRepository.deleteAll();

        // 1. Register Parent
        RegisterRequest parentReg = new RegisterRequest(
                "Maria Santos",
                "parent@example.com",
                "password123",
                Role.PARENT
        );
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(parentReg)))
                .andExpect(status().isCreated());

        // Login Parent
        LoginRequest parentLogin = new LoginRequest("parent@example.com", "password123");
        MvcResult parentLoginRes = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(parentLogin)))
                .andExpect(status().isOk())
                .andReturn();

        String parentResStr = parentLoginRes.getResponse().getContentAsString();
        parentToken = objectMapper.readTree(parentResStr).get("token").asText();
        parentId = UUID.fromString(objectMapper.readTree(parentResStr).get("user").get("id").asText());

        // 2. Register Learner
        learnerEmail = "juanito@example.com";
        RegisterRequest learnerReg = new RegisterRequest(
                "Juanito Santos",
                learnerEmail,
                "password123",
                Role.LEARNER
        );
        MvcResult learnerRegRes = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(learnerReg)))
                .andExpect(status().isCreated())
                .andReturn();

        String learnerResStr = learnerRegRes.getResponse().getContentAsString();
        learnerId = UUID.fromString(objectMapper.readTree(learnerResStr).get("id").asText());
    }

    @Test
    public void testLinkLearnerBlankIdentifierReturns400() throws Exception {
        LinkLearnerRequest request = new LinkLearnerRequest("");
        mockMvc.perform(post("/api/parent/link-learner")
                .header("Authorization", "Bearer " + parentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Student ID is required.")));
    }

    @Test
    public void testLinkLearnerInvalidUuidReturns400() throws Exception {
        // Test non-UUID string
        LinkLearnerRequest request = new LinkLearnerRequest("invalid-uuid-format");
        mockMvc.perform(post("/api/parent/link-learner")
                .header("Authorization", "Bearer " + parentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Invalid Student ID format. Please enter a valid Student ID.")));

        // Test email string (email lookup disabled)
        LinkLearnerRequest emailRequest = new LinkLearnerRequest(learnerEmail);
        mockMvc.perform(post("/api/parent/link-learner")
                .header("Authorization", "Bearer " + parentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(emailRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Invalid Student ID format. Please enter a valid Student ID.")));
    }

    @Test
    public void testLinkLearnerNonExistentUuidReturns400() throws Exception {
        UUID randomId = UUID.randomUUID();
        LinkLearnerRequest request = new LinkLearnerRequest(randomId.toString());
        mockMvc.perform(post("/api/parent/link-learner")
                .header("Authorization", "Bearer " + parentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Learner not found. Please check the Student ID and try again.")));
    }

    @Test
    public void testLinkLearnerNonLearnerRoleReturns400() throws Exception {
        // Register another parent
        RegisterRequest otherParentReg = new RegisterRequest(
                "Other Parent",
                "otherparent@example.com",
                "password123",
                Role.PARENT
        );
        MvcResult res = mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(otherParentReg)))
                .andExpect(status().isCreated())
                .andReturn();
        UUID otherParentId = UUID.fromString(objectMapper.readTree(res.getResponse().getContentAsString()).get("id").asText());

        LinkLearnerRequest request = new LinkLearnerRequest(otherParentId.toString());
        mockMvc.perform(post("/api/parent/link-learner")
                .header("Authorization", "Bearer " + parentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error", is("Learner not found. Please check the Student ID and try again.")));
    }

    @Test
    public void testLinkLearnerSuccessWithValidStudentId() throws Exception {
        LinkLearnerRequest request = new LinkLearnerRequest(learnerId.toString());
        mockMvc.perform(post("/api/parent/link-learner")
                .header("Authorization", "Bearer " + parentToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Learner linked successfully!")))
                .andExpect(jsonPath("$.learnerId", is(learnerId.toString())))
                .andExpect(jsonPath("$.learnerName", is("Juanito Santos")))
                .andExpect(jsonPath("$.learnerEmail", is(learnerEmail)));

        // Verify in database
        User updatedLearner = userRepository.findById(learnerId).orElse(null);
        assertNotNull(updatedLearner);
        assertEquals(parentId, updatedLearner.getParentId());

        // Verify linked-learners endpoint
        mockMvc.perform(get("/api/parent/linked-learners")
                .header("Authorization", "Bearer " + parentToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id", is(learnerId.toString())))
                .andExpect(jsonPath("$[0].name", is("Juanito Santos")));
    }
}
