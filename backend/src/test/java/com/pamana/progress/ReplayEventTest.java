package com.pamana.progress;

import com.pamana.auth.Role;
import com.pamana.auth.UserRepository;
import com.pamana.auth.dto.LoginRequest;
import com.pamana.auth.dto.RegisterRequest;
import com.pamana.syllable.SyllableProgressRepository;
import com.pamana.vocabulary.WordMasteryRepository;

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
import java.util.Map;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies that every replay button tap becomes exactly one telemetry row and
 * that replays never enter the answer log.
 */
@SpringBootTest
@AutoConfigureMockMvc
public class ReplayEventTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SyllableProgressRepository syllableProgressRepository;

    @Autowired
    private WordMasteryRepository wordMasteryRepository;

    @Autowired
    private ModuleProgressRepository moduleProgressRepository;

    @Autowired
    private AnswerEventRepository answerEventRepository;

    @Autowired
    private ReplayEventRepository replayEventRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String token;
    private UUID userId;

    @BeforeEach
    public void setup() throws Exception {
        replayEventRepository.deleteAll();
        answerEventRepository.deleteAll();
        syllableProgressRepository.deleteAll();
        wordMasteryRepository.deleteAll();
        moduleProgressRepository.deleteAll();
        userRepository.deleteAll();

        RegisterRequest registerReq = new RegisterRequest(
                "Nene Garcia",
                "nene.replay@example.com",
                "nenePassword123",
                Role.LEARNER);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        LoginRequest loginReq = new LoginRequest("nene.replay@example.com", "nenePassword123");
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
    public void everyReplayTapIsLoggedWithoutTouchingAnswers() throws Exception {
        UUID runId = UUID.randomUUID();

        postReplay(runId, "npc", "npc_instruction", "/static/assets/audio/npc/lolo_mod3_kilalanin.mp3", 3);
        postReplay(runId, "npc", "npc_instruction", "/static/assets/audio/npc/lolo_mod3_kilalanin.mp3", 3);
        postReplay(runId, "target", "target_word", "/audio/words/mata.mp3", 3);

        List<ReplayEvent> events = replayEventRepository.findByRunIdAndUserIdOrderByReplayedAtAsc(runId, userId);
        assertThat(events).hasSize(3);
        assertThat(events).allSatisfy(event -> {
            assertThat(event.getUserId()).isEqualTo(userId);
            assertThat(event.getActivity()).isEqualTo("practice");
            assertThat(event.getModuleNumber()).isEqualTo(3);
            assertThat(event.getReplayedAt()).isNotNull();
        });
        assertThat(replayEventRepository.countByUserIdAndSource(userId, "npc")).isEqualTo(2);
        assertThat(replayEventRepository.countByUserIdAndSource(userId, "target")).isEqualTo(1);

        // A replay is guidance, not an answer attempt.
        assertThat(answerEventRepository.count()).isZero();
    }

    @Test
    public void replayWithoutRunIdIsStillRecorded() throws Exception {
        Map<String, Object> body = Map.of(
                "activity", "module",
                "itemType", "npc_instruction",
                "itemKey", "/static/assets/audio/npc/lola_mod2_pagsama.mp3",
                "step", "pagsama",
                "moduleNumber", 2,
                "source", "npc");

        mockMvc.perform(post("/api/replay-events")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated());

        List<ReplayEvent> events = replayEventRepository.findAll();
        assertThat(events).hasSize(1);
        assertThat(events.get(0).getRunId()).isNotNull();
        assertThat(events.get(0).getStep()).isEqualTo("pagsama");
    }

    private void postReplay(UUID runId, String source, String itemType, String itemKey, int moduleNumber)
            throws Exception {
        Map<String, Object> body = Map.of(
                "runId", runId.toString(),
                "activity", "practice",
                "itemType", itemType,
                "itemKey", itemKey,
                "step", "kilalanin",
                "moduleNumber", moduleNumber,
                "source", source);

        mockMvc.perform(post("/api/replay-events")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isCreated());
    }
}
