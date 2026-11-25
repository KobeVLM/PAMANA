package com.pamana.vocabulary;

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
import com.pamana.progress.ModuleProgress;
import com.pamana.progress.ModuleProgressRepository;
import com.pamana.vocabulary.dto.VocabularyProgressRequest;

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
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Verifies that the vocabulary dispatcher reads the learner's adaptive tier
 * from answer history, serves that tier's Content Bank pool, stays
 * deterministic within a tier, and records the served tier on each answer.
 */
@SpringBootTest
@AutoConfigureMockMvc
public class VocabularyAdaptiveTierTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private WordMasteryRepository wordMasteryRepository;

    @Autowired
    private ModuleProgressRepository moduleProgressRepository;

    @Autowired
    private VocabularyItemRepository vocabularyItemRepository;

    @Autowired
    private AnswerEventRepository answerEventRepository;

    @Autowired
    private ContentBankRepository contentBankRepository;

    @Autowired
    private ObjectMapper objectMapper;

    private String token;
    private UUID userId;
    private String wordId;

    @BeforeEach
    public void setup() throws Exception {
        answerEventRepository.deleteAll();
        wordMasteryRepository.deleteAll();
        moduleProgressRepository.deleteAll();
        userRepository.deleteAll();

        // DbSeeder runs once at startup; do not delete content_bank rows.
        wordId = vocabularyItemRepository.findByWord("mata").orElseThrow().getId().toString();

        RegisterRequest registerReq = new RegisterRequest(
                "Adaptive Learner",
                "adaptive.learner@example.com",
                "adaptivePassword123",
                Role.LEARNER);
        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        LoginRequest loginReq = new LoginRequest("adaptive.learner@example.com", "adaptivePassword123");
        MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();
        JsonNode login = objectMapper.readTree(loginResult.getResponse().getContentAsString());
        token = login.get("token").asText();
        userId = UUID.fromString(login.get("user").get("id").asText());

        // Module 2 must be unlocked before progress can be submitted.
        ModuleProgress module2 = moduleProgressRepository.findByUserIdAndModuleNumber(userId, 2).orElseThrow();
        module2.setIsUnlocked(true);
        moduleProgressRepository.save(module2);
    }

    @Test
    public void newLearnerGetsStandardPools() throws Exception {
        String match = matchJson();
        JsonNode options = objectMapper.readTree(match).get("options");
        assertThat(options).hasSize(4);
        assertThat(distractorWords(match)).isEqualTo(poolWords(AdaptiveTier.STANDARD));

        String gamitin = gamitinJson();
        JsonNode dialogueOptions = objectMapper.readTree(gamitin).get("options");
        assertThat(dialogueOptions).hasSize(3);
        assertThat(gamitinDistractors(gamitin))
                .isSubsetOf(poolWords(AdaptiveTier.STANDARD))
                .hasSize(2);
    }

    @Test
    public void strugglingLearnerGetsFoundationalPools() throws Exception {
        seedHistory(3, 7); // 30% -> FOUNDATIONAL

        String match = matchJson();
        assertThat(distractorWords(match)).isEqualTo(poolWords(AdaptiveTier.FOUNDATIONAL));
        assertThat(poolWords(AdaptiveTier.FOUNDATIONAL)).isNotEqualTo(poolWords(AdaptiveTier.STANDARD));
    }

    @Test
    public void advancedLearnerGetsChallengePools() throws Exception {
        seedHistory(9, 1); // 90% -> CHALLENGE

        String match = matchJson();
        assertThat(distractorWords(match)).isEqualTo(poolWords(AdaptiveTier.CHALLENGE));
        assertThat(poolWords(AdaptiveTier.CHALLENGE)).isNotEqualTo(poolWords(AdaptiveTier.STANDARD));
    }

    @Test
    public void optionsAreDeterministicWithinATierAndChangeWithIt() throws Exception {
        String first = matchJson();
        for (int i = 0; i < 5; i++) {
            assertThat(matchJson()).isEqualTo(first);
        }

        seedHistory(3, 7);
        String foundational = matchJson();
        assertThat(foundational).isNotEqualTo(first);
        for (int i = 0; i < 5; i++) {
            assertThat(matchJson()).isEqualTo(foundational);
        }
        assertThat(distractorWords(foundational)).isEqualTo(poolWords(AdaptiveTier.FOUNDATIONAL));

        // A tier change must not break the response contract: still 4 options.
        assertThat(objectMapper.readTree(foundational).get("options")).hasSize(4);
    }

    @Test
    public void gamitinUsesTheLearnersTier() throws Exception {
        seedHistory(9, 1);

        String gamitin = gamitinJson();
        JsonNode options = objectMapper.readTree(gamitin).get("options");
        assertThat(options).hasSize(3);
        assertThat(objectMapper.readTree(gamitin).get("correctWord").asText()).isEqualTo("mata");
        assertThat(gamitinDistractors(gamitin))
                .isSubsetOf(poolWords(AdaptiveTier.CHALLENGE))
                .hasSize(2);

        for (int i = 0; i < 5; i++) {
            assertThat(gamitinJson()).isEqualTo(gamitin);
        }
    }

    @Test
    public void foundationalTierIsRecordedOnAnswers() throws Exception {
        seedHistory(3, 7);

        recordAnswer("kilalanin", true);

        assertThat(latestAnswer().getDifficultyTier()).isEqualTo(AdaptiveTier.FOUNDATIONAL.value());
    }

    @Test
    public void challengeTierIsRecordedOnAnswers() throws Exception {
        seedHistory(9, 1);

        recordAnswer("gamitin", true);

        assertThat(latestAnswer().getDifficultyTier()).isEqualTo(AdaptiveTier.CHALLENGE.value());
    }

    private String matchJson() throws Exception {
        return mockMvc.perform(get("/api/vocabulary/match/" + wordId)
                        .header("Authorization", "Bearer " + token)
                        .param("step", "kilalanin"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.targetWord", is("mata")))
                .andReturn().getResponse().getContentAsString();
    }

    private String gamitinJson() throws Exception {
        return mockMvc.perform(get("/api/vocabulary/gamitin/" + wordId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.wordId", is(wordId)))
                .andReturn().getResponse().getContentAsString();
    }

    private void recordAnswer(String step, boolean correct) throws Exception {
        VocabularyProgressRequest request = new VocabularyProgressRequest(
                UUID.fromString(wordId), step, correct);
        mockMvc.perform(post("/api/vocabulary/progress")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated());
    }

    private AnswerEvent latestAnswer() {
        return answerEventRepository.findAll().stream()
                .filter(event -> userId.equals(event.getUserId()))
                .filter(event -> event.getItemKey().startsWith(wordId + ":"))
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
                AdaptiveTierResolver.ITEM_TYPE_VOCABULARY,
                UUID.randomUUID() + ":kilalanin",
                "kilalanin",
                2,
                1,
                correct);
        event.setAnsweredAt(answeredAt);
        answerEventRepository.save(event);
    }

    private Set<String> poolWords(AdaptiveTier tier) {
        ContentBankItem pool = contentBankRepository.findByActivityAndItemKeyAndDifficultyTier(
                        "vocabulary", "mata", tier.value())
                .orElseThrow();
        return new TreeSet<>(Arrays.asList(pool.getDistractors().split(",")));
    }

    private Set<String> distractorWords(String matchJson) throws Exception {
        JsonNode options = objectMapper.readTree(matchJson).get("options");
        Set<String> words = new TreeSet<>();
        for (JsonNode option : options) {
            String word = option.get("word").asText().toLowerCase(Locale.ROOT);
            if (!"mata".equals(word)) {
                words.add(word);
            }
        }
        return words;
    }

    private Set<String> gamitinDistractors(String dialogueJson) throws Exception {
        JsonNode options = objectMapper.readTree(dialogueJson).get("options");
        List<String> words = new java.util.ArrayList<>();
        for (JsonNode option : options) {
            String word = option.asText().toLowerCase(Locale.ROOT);
            if (!"mata".equals(word)) {
                words.add(word);
            }
        }
        return words.stream().collect(Collectors.toCollection(TreeSet::new));
    }
}
