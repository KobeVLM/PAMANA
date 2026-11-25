package com.pamana.syllable;

import com.pamana.adaptive.AdaptiveTier;
import com.pamana.adaptive.AdaptiveTierResolver;
import com.pamana.adaptive.ContentBankItem;
import com.pamana.adaptive.ContentBankRepository;
import com.pamana.auth.Role;
import com.pamana.auth.UserRepository;
import com.pamana.auth.dto.LoginRequest;
import com.pamana.auth.dto.RegisterRequest;
import com.pamana.progress.AnswerEvent;
import com.pamana.progress.AnswerEventRepository;
import com.pamana.progress.ModuleProgressRepository;
import com.pamana.syllable.dto.SyllableProgressRequest;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.TreeSet;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies that the syllable dispatcher uses the learner's adaptive tier,
 * serves the matching Content Bank pool for every sublevel, stays deterministic
 * within a tier, and records the served tier on each answer.
 */
@SpringBootTest
@AutoConfigureMockMvc
public class SyllableAdaptiveTierTest {

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
    private ContentBankRepository contentBankRepository;

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
                "Syllable Learner",
                "syllable.learner@example.com",
                "syllablePassword123",
                Role.LEARNER);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        LoginRequest loginReq = new LoginRequest("syllable.learner@example.com", "syllablePassword123");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode login = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        token = login.get("token").asText();
        userId = UUID.fromString(login.get("user").get("id").asText());
    }

    @Test
    public void newLearnerGetsStandardPools() throws Exception {
        String set = setJson("pagsama", 1);
        JsonNode json = objectMapper.readTree(set);

        assertThat(json.get("options")).hasSize(4);
        assertThat(json.get("targetSyllable").asText()).hasSize(2);
        assertThat(json.get("consonantAudioUrl").asText()).endsWith(".mp3");
        assertThat(json.get("audioUrl").asText()).endsWith(".mp3");
        assertThat(distractorLabels(set)).isEqualTo(poolLabels("pagsama", 1, AdaptiveTier.STANDARD));
    }

    @Test
    public void strugglingLearnerGetsFoundationalPools() throws Exception {
        seedHistory(3, 7); // 30% -> FOUNDATIONAL

        String set = setJson("pagsama", 1);
        assertThat(distractorLabels(set)).isEqualTo(poolLabels("pagsama", 1, AdaptiveTier.FOUNDATIONAL));
        assertThat(poolLabels("pagsama", 1, AdaptiveTier.FOUNDATIONAL))
                .isNotEqualTo(poolLabels("pagsama", 1, AdaptiveTier.STANDARD));
    }

    @Test
    public void advancedLearnerGetsChallengePools() throws Exception {
        seedHistory(9, 1); // 90% -> CHALLENGE

        String set = setJson("pagsama", 1);
        assertThat(distractorLabels(set)).isEqualTo(poolLabels("pagsama", 1, AdaptiveTier.CHALLENGE));
        assertThat(poolLabels("pagsama", 1, AdaptiveTier.CHALLENGE))
                .isNotEqualTo(poolLabels("pagsama", 1, AdaptiveTier.STANDARD));
    }

    @Test
    public void everySublevelUsesTheTieredPool() throws Exception {
        seedHistory(3, 7);

        for (String subLevel : List.of("pagsama", "pakinggan", "kilalanin", "rhyming")) {
            for (int setId = 1; setId <= 5; setId++) {
                String set = setJson(subLevel, setId);
                assertThat(objectMapper.readTree(set).get("options")).hasSize(4);
                assertThat(distractorLabels(set))
                        .as("%s set %s", subLevel, setId)
                        .isEqualTo(poolLabels(subLevel, setId, AdaptiveTier.FOUNDATIONAL));
            }
        }
    }

    @Test
    public void optionsAreDeterministicWithinATierAndChangeWithIt() throws Exception {
        String first = setJson("pakinggan", 2);
        for (int i = 0; i < 5; i++) {
            assertThat(setJson("pakinggan", 2)).isEqualTo(first);
        }

        seedHistory(3, 7);
        String foundational = setJson("pakinggan", 2);
        assertThat(foundational).isNotEqualTo(first);
        for (int i = 0; i < 5; i++) {
            assertThat(setJson("pakinggan", 2)).isEqualTo(foundational);
        }
        assertThat(distractorLabels(foundational))
                .isEqualTo(poolLabels("pakinggan", 2, AdaptiveTier.FOUNDATIONAL));
    }

    @Test
    public void foundationalTierIsRecordedOnAnswers() throws Exception {
        seedHistory(3, 7);

        recordAnswer("pagsama", 1, true);

        assertThat(latestAnswer("pagsama:1").getDifficultyTier())
                .isEqualTo(AdaptiveTier.FOUNDATIONAL.value());
    }

    @Test
    public void challengeTierIsRecordedOnAnswers() throws Exception {
        seedHistory(9, 1);

        recordAnswer("rhyming", 3, true);

        assertThat(latestAnswer("rhyming:3").getDifficultyTier())
                .isEqualTo(AdaptiveTier.CHALLENGE.value());
    }

    private String setJson(String subLevel, int setId) throws Exception {
        return mockMvc.perform(get("/api/syllables/set")
                        .param("subLevel", subLevel)
                        .param("setId", String.valueOf(setId))
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.setId", is(setId)))
                .andExpect(jsonPath("$.subLevel", is(subLevel)))
                .andReturn().getResponse().getContentAsString();
    }

    private void recordAnswer(String subLevel, int setId, boolean correct) throws Exception {
        SyllableProgressRequest request = new SyllableProgressRequest(subLevel, setId, "A", correct);
        mockMvc.perform(post("/api/syllables/progress")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    private AnswerEvent latestAnswer(String itemKey) {
        return answerEventRepository.findAll().stream()
                .filter(event -> userId.equals(event.getUserId()))
                .filter(event -> itemKey.equals(event.getItemKey()))
                .max(java.util.Comparator.comparing(AnswerEvent::getAnsweredAt))
                .orElseThrow();
    }

    private void seedHistory(int correct, int incorrect) {
        LocalDateTime base = LocalDateTime.now().minusMinutes(5);
        int second = 0;
        for (int i = 0; i < correct; i++) {
            saveEvent(true, base.plusSeconds(second++));
        }
        for (int i = 0; i < incorrect; i++) {
            saveEvent(false, base.plusSeconds(second++));
        }
    }

    private void saveEvent(boolean correct, LocalDateTime answeredAt) {
        AnswerEvent event = new AnswerEvent(
                userId,
                UUID.randomUUID(),
                "module",
                AdaptiveTierResolver.ITEM_TYPE_SYLLABLE,
                "pagsama:" + (1 + (int) (answeredAt.getSecond() % 5)),
                "pagsama",
                1,
                1,
                correct);
        event.setAnsweredAt(answeredAt);
        answerEventRepository.save(event);
    }

    private Set<String> poolLabels(String subLevel, int setId, AdaptiveTier tier) {
        ContentBankItem pool = contentBankRepository.findByActivityAndItemKeyAndDifficultyTier(
                        "syllable", subLevel + ":" + setId, tier.value())
                .orElseThrow();
        return new TreeSet<>(Arrays.asList(pool.getDistractors().split(",")));
    }

    private Set<String> distractorLabels(String setJson) throws Exception {
        JsonNode json = objectMapper.readTree(setJson);
        String target = json.get("targetSyllable").asText().toLowerCase(Locale.ROOT);
        Set<String> labels = new TreeSet<>();
        for (JsonNode option : json.get("options")) {
            String label = option.get("id").asText().toLowerCase(Locale.ROOT);
            if (!label.equals(target)) {
                labels.add(label);
            }
        }
        return labels;
    }
}
