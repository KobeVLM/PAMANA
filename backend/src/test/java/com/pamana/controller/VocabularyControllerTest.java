package com.pamana.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.pamana.dto.LoginRequest;
import com.pamana.dto.RegisterRequest;
import com.pamana.dto.VocabularyProgressRequest;
import com.pamana.model.ModuleProgress;
import com.pamana.model.Role;
import com.pamana.model.VocabularyItem;
import com.pamana.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class VocabularyControllerTest {

        @Autowired
        private MockMvc mockMvc;

        @Autowired
        private UserRepository userRepository;

        @Autowired
        private ModuleProgressRepository moduleProgressRepository;

        @Autowired
        private WordMasteryRepository wordMasteryRepository;

        @Autowired
        private HamonSessionRepository hamonSessionRepository;

        @Autowired
        private VocabularyItemRepository vocabularyItemRepository;

        @Autowired
        private ObjectMapper objectMapper;

        private String token;
        private UUID userId;

        @BeforeEach
        public void setup() throws Exception {
                hamonSessionRepository.deleteAll();
                wordMasteryRepository.deleteAll();
                moduleProgressRepository.deleteAll();
                userRepository.deleteAll();

                // Note: Do not clear vocabularyItemRepository because DbSeeder runs on startup
                // and seeds the 25 standard items. Just assert that seeding took place
                // successfully.
                long itemsCount = vocabularyItemRepository.count();
                assertEquals(25, itemsCount, "Standard vocabulary items should be pre-seeded by DbSeeder.");

                // Register Learner
                RegisterRequest registerReq = new RegisterRequest(
                                "Kobe Vincent",
                                "kobe.vincent@example.com",
                                "kobePassword123",
                                Role.LEARNER);

                mockMvc.perform(post("/api/auth/register")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(registerReq)))
                                .andExpect(status().isCreated());

                // Login
                LoginRequest loginReq = new LoginRequest("kobe.vincent@example.com", "kobePassword123");
                MvcResult loginResult = mockMvc.perform(post("/api/auth/login")
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(loginReq)))
                                .andExpect(status().isOk())
                                .andReturn();

                String responseContent = loginResult.getResponse().getContentAsString();
                token = objectMapper.readTree(responseContent).get("token").asText();
                userId = UUID.fromString(objectMapper.readTree(responseContent).get("user").get("id").asText());

                // Explicitly unlock Module 2 (Self & Body Vocabulary) for testing
                ModuleProgress m2 = moduleProgressRepository.findByUserIdAndModuleNumber(userId, 2)
                                .orElseThrow(() -> new IllegalStateException("Module progress 2 not initialized"));
                m2.setIsUnlocked(true);
                moduleProgressRepository.save(m2);
        }

        @Test
        public void testVocabularySpiralFlow() throws Exception {
                // 1. Get next unmastered word. The first unmastered word should be "mata"
                // (ordinal 1).
                MvcResult nextWordResult = mockMvc.perform(get("/api/vocabulary/next")
                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.word", is("mata")))
                                .andExpect(jsonPath("$.domain", is("self_body")))
                                .andExpect(jsonPath("$.ordinal", is(1)))
                                .andReturn();

                String wordResponseStr = nextWordResult.getResponse().getContentAsString();
                String wordIdStr = objectMapper.readTree(wordResponseStr).get("wordId").asText();
                UUID wordId = UUID.fromString(wordIdStr);

                // 2. Fetch match options for Kilalanin step
                mockMvc.perform(get("/api/vocabulary/match/" + wordIdStr)
                                .header("Authorization", "Bearer " + token)
                                .param("step", "kilalanin"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.targetWordId", is(wordIdStr)))
                                .andExpect(jsonPath("$.targetWord", is("mata")))
                                .andExpect(jsonPath("$.options", hasSize(4)));

                // 3. Fetch dialogue completions for Gamitin step
                mockMvc.perform(get("/api/vocabulary/gamitin/" + wordIdStr)
                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.wordId", is(wordIdStr)))
                                .andExpect(jsonPath("$.correctWord", is("mata")))
                                .andExpect(jsonPath("$.options", hasSize(3)))
                                .andExpect(jsonPath("$.sentenceTemplate", containsString("____")));

                // 4. Submit Pakinggan progress (passive, correct always)
                VocabularyProgressRequest reqPakinggan = new VocabularyProgressRequest(wordId, "pakinggan", true);
                mockMvc.perform(post("/api/vocabulary/progress")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(reqPakinggan)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.mastered", is(false)))
                                .andExpect(jsonPath("$.hamonTriggered", is(false)));

                // 5. Submit Kilalanin progress
                VocabularyProgressRequest reqKilalanin = new VocabularyProgressRequest(wordId, "kilalanin", true);
                mockMvc.perform(post("/api/vocabulary/progress")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(reqKilalanin)))
                                .andExpect(status().isCreated());

                // 6. Submit Basahin progress
                VocabularyProgressRequest reqBasahin = new VocabularyProgressRequest(wordId, "basahin", true);
                mockMvc.perform(post("/api/vocabulary/progress")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(reqBasahin)))
                                .andExpect(status().isCreated());

                // 7. Submit Gamitin progress
                VocabularyProgressRequest reqGamitin = new VocabularyProgressRequest(wordId, "gamitin", true);
                mockMvc.perform(post("/api/vocabulary/progress")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(reqGamitin)))
                                .andExpect(status().isCreated())
                                .andExpect(jsonPath("$.mastered", is(true)))
                                .andExpect(jsonPath("$.overallAccuracy", is(100.0)))
                                .andExpect(jsonPath("$.status", is("green")));
        }

        @Test
        public void testHamonTriggerAndSubmissionFlow() throws Exception {
                // Master first 5 vocabulary words to trigger Hamon session milestone!
                List<VocabularyItem> firstFive = vocabularyItemRepository.findByDomainOrderByOrdinalAsc("self_body")
                                .subList(0, 5);
                assertEquals(5, firstFive.size());

                for (int i = 0; i < 5; i++) {
                        UUID wordId = firstFive.get(i).getId();
                        // Complete all matching/active steps correct for each word to mark status green
                        mockMvc.perform(post("/api/vocabulary/progress")
                                        .header("Authorization", "Bearer " + token)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(
                                                        new VocabularyProgressRequest(wordId, "pakinggan", true))));

                        mockMvc.perform(post("/api/vocabulary/progress")
                                        .header("Authorization", "Bearer " + token)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(
                                                        new VocabularyProgressRequest(wordId, "kilalanin", true))));

                        mockMvc.perform(post("/api/vocabulary/progress")
                                        .header("Authorization", "Bearer " + token)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(
                                                        new VocabularyProgressRequest(wordId, "basahin", true))));

                        MvcResult finalStepResult = mockMvc.perform(post("/api/vocabulary/progress")
                                        .header("Authorization", "Bearer " + token)
                                        .contentType(MediaType.APPLICATION_JSON)
                                        .content(objectMapper.writeValueAsString(
                                                        new VocabularyProgressRequest(wordId, "gamitin", true))))
                                        .andExpect(status().isCreated())
                                        .andReturn();

                        // The 5th word completion should return hamonTriggered = true!
                        if (i == 4) {
                                String responseStr = finalStepResult.getResponse().getContentAsString();
                                boolean triggered = objectMapper.readTree(responseStr).get("hamonTriggered")
                                                .asBoolean();
                                assertEquals(true, triggered, "Hamon session milestone 1 should be triggered.");
                        }
                }

                // Fetch the active Hamon Session
                MvcResult activeSessionResult = mockMvc.perform(get("/api/hamon/session/active")
                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.words", hasSize(5)))
                                .andReturn();

                String sessionContent = activeSessionResult.getResponse().getContentAsString();
                String sessionIdStr = objectMapper.readTree(sessionContent).get("sessionId").asText();
                UUID sessionId = UUID.fromString(sessionIdStr);

                // Submit Hamon results: 4 words pass (100%), 1 word fails (30.0%) to test
                // At-Risk queue
                Map<UUID, Double> results = new HashMap<>();
                results.put(firstFive.get(0).getId(), 100.0);
                results.put(firstFive.get(1).getId(), 100.0);
                results.put(firstFive.get(2).getId(), 100.0);
                results.put(firstFive.get(3).getId(), 100.0);
                results.put(firstFive.get(4).getId(), 30.0); // Fails (scores < 60)

                mockMvc.perform(post("/api/hamon/results/" + sessionIdStr)
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(results)))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.passRate", is(80.0)))
                                .andExpect(jsonPath("$.masteredCount", is(4)))
                                .andExpect(jsonPath("$.reQueuedCount", is(1)))
                                .andExpect(jsonPath("$.reQueuedWords", hasItem(firstFive.get(4).getWord())));
        }
}
