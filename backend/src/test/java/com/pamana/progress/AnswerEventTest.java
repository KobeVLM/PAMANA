package com.pamana.progress;

import com.pamana.auth.Role;
import com.pamana.auth.UserRepository;
import com.pamana.auth.dto.LoginRequest;
import com.pamana.auth.dto.RegisterRequest;
import com.pamana.syllable.SyllableProgressRepository;
import com.pamana.syllable.dto.SyllableProgressRequest;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies the answer log and the monotone progress derived from it.
 *
 * <p>The bar must only ever move forward: a wrong retry adds a wrong attempt
 * but cannot remove an item that was already answered correctly.
 */
@SpringBootTest
@AutoConfigureMockMvc
public class AnswerEventTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SyllableProgressRepository syllableProgressRepository;

    @Autowired
    private ModuleProgressRepository moduleProgressRepository;

    @Autowired
    private AnswerEventRepository answerEventRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String token;
    private UUID userId;

    @BeforeEach
    public void setup() throws Exception {
        answerEventRepository.deleteAll();
        syllableProgressRepository.deleteAll();
        moduleProgressRepository.deleteAll();
        userRepository.deleteAll();

        RegisterRequest registerReq = new RegisterRequest(
                "Nene Garcia",
                "nene.garcia@example.com",
                "nenePassword123",
                Role.LEARNER);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        LoginRequest loginReq = new LoginRequest("nene.garcia@example.com", "nenePassword123");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        String body = loginResult.getResponse().getContentAsString();
        token = objectMapper.readTree(body).get("token").asText();
        userId = UUID.fromString(objectMapper.readTree(body).get("user").get("id").asText());
    }

    @Test
    public void wrongRetryAddsAttemptButNeverRemovesProgress() throws Exception {
        UUID runId = UUID.randomUUID();

        answerSyllable(runId, "pagsama", 1, true);
        answerSyllable(runId, "pagsama", 1, false); // retry of the same item
        answerSyllable(runId, "pagsama", 2, true);

        mockMvc.perform(get("/api/progress/" + userId + "/answer-progress")
                .param("runId", runId.toString())
                .param("totalItems", "4")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correctItems", is(2)))
                .andExpect(jsonPath("$.answeredItems", is(2)))
                .andExpect(jsonPath("$.wrongAttempts", is(1)))
                .andExpect(jsonPath("$.totalItems", is(4)))
                .andExpect(jsonPath("$.progressPercent", is(50.0)));
    }

    @Test
    public void progressReachesOneHundredWhenEveryItemIsCorrect() throws Exception {
        UUID runId = UUID.randomUUID();

        answerSyllable(runId, "pagsama", 1, false);
        answerSyllable(runId, "pagsama", 1, true);
        answerSyllable(runId, "pagsama", 2, true);

        mockMvc.perform(get("/api/progress/" + userId + "/answer-progress")
                .param("runId", runId.toString())
                .param("totalItems", "2")
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correctItems", is(2)))
                // Retries cannot push the bar past 100%.
                .andExpect(jsonPath("$.progressPercent", is(100.0)));
    }

    @Test
    public void progressWithoutTotalOmitsPercentage() throws Exception {
        UUID runId = UUID.randomUUID();
        answerSyllable(runId, "pagsama", 1, true);

        mockMvc.perform(get("/api/progress/" + userId + "/answer-progress")
                .param("runId", runId.toString())
                .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correctItems", is(1)))
                .andExpect(jsonPath("$.progressPercent", nullValue()));
    }

    @Test
    public void attemptNumberIsOneBasedPerItemWithinTheRun() throws Exception {
        UUID runId = UUID.randomUUID();

        answerSyllable(runId, "pagsama", 1, false);
        answerSyllable(runId, "pagsama", 1, false);
        answerSyllable(runId, "pagsama", 1, true);
        answerSyllable(runId, "pagsama", 2, true);

        List<AnswerEvent> events = answerEventRepository
                .findByRunIdAndUserIdOrderByAnsweredAtAsc(runId, userId);

        assertThat(events).hasSize(4);
        assertThat(events.get(0).getAttemptNumber()).isEqualTo(1);
        assertThat(events.get(1).getAttemptNumber()).isEqualTo(2);
        assertThat(events.get(2).getAttemptNumber()).isEqualTo(3);
        // A different item restarts the counter.
        assertThat(events.get(3).getAttemptNumber()).isEqualTo(1);
        assertThat(events.get(0).getItemKey()).isEqualTo("pagsama:1");
    }

    @Test
    public void anotherLearnerCannotReadSomeoneElsesRun() throws Exception {
        UUID runId = UUID.randomUUID();
        answerSyllable(runId, "pagsama", 1, true);

        RegisterRequest other = new RegisterRequest(
                "Ibang Bata",
                "ibang.bata@example.com",
                "otherPassword123",
                Role.LEARNER);
        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(other)))
                .andExpect(status().isCreated());

        MvcResult otherLogin = mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(
                        new LoginRequest("ibang.bata@example.com", "otherPassword123"))))
                .andExpect(status().isOk())
                .andReturn();

        String otherToken = objectMapper.readTree(otherLogin.getResponse().getContentAsString()).get("token").asText();
        UUID otherId = UUID.fromString(objectMapper.readTree(otherLogin.getResponse().getContentAsString())
                .get("user").get("id").asText());

        // Same run id, different learner: no rows are returned.
        mockMvc.perform(get("/api/progress/" + otherId + "/answer-progress")
                .param("runId", runId.toString())
                .param("totalItems", "4")
                .header("Authorization", "Bearer " + otherToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.correctItems", is(0)))
                .andExpect(jsonPath("$.answeredItems", is(0)))
                .andExpect(jsonPath("$.progressPercent", is(0.0)));
    }

    private void answerSyllable(UUID runId, String subLevel, int setId, boolean correct) throws Exception {
        SyllableProgressRequest request = new SyllableProgressRequest(subLevel, setId, "A", correct);
        request.setRunId(runId);

        mockMvc.perform(post("/api/syllables/progress")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }
}
