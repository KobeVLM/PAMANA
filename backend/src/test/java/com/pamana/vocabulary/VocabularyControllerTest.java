package com.pamana.vocabulary;

import com.pamana.auth.UserRepository;
import com.pamana.auth.Role;
import com.pamana.auth.dto.LoginRequest;
import com.pamana.auth.dto.RegisterRequest;
import com.pamana.vocabulary.VocabularyItemRepository;
import com.pamana.vocabulary.WordMasteryRepository;
import com.pamana.vocabulary.dto.VocabularyProgressRequest;
import com.pamana.progress.ModuleProgressRepository;
import com.pamana.progress.ModuleProgress;

import com.fasterxml.jackson.databind.ObjectMapper;

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
        private VocabularyItemRepository vocabularyItemRepository;

        @Autowired
        private ObjectMapper objectMapper;

        private String token;
        private UUID userId;

        @BeforeEach
        public void setup() throws Exception {
                wordMasteryRepository.deleteAll();
                moduleProgressRepository.deleteAll();
                userRepository.deleteAll();

                // Note: Do not clear vocabularyItemRepository because DbSeeder runs on startup
                // and seeds the 25 standard items. Just assert that seeding took place
                // successfully.
                long itemsCount = vocabularyItemRepository.count();
                assertEquals(19, itemsCount, "Standard vocabulary items should be pre-seeded by DbSeeder.");

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
                                .andExpect(jsonPath("$.mastered", is(false)));

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
        public void testDeterministicMatchOptionsAndGamitinDialogue() throws Exception {
                // 1. Fetch next word (mata)
                MvcResult nextWordResult = mockMvc.perform(get("/api/vocabulary/next")
                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().isOk())
                                .andReturn();

                String wordResponseStr = nextWordResult.getResponse().getContentAsString();
                String wordIdStr = objectMapper.readTree(wordResponseStr).get("wordId").asText();

                // 2. Verify repeated calls to getMatchOptions return the exact same options in identical order
                MvcResult matchInitialResult = mockMvc.perform(get("/api/vocabulary/match/" + wordIdStr)
                                .header("Authorization", "Bearer " + token)
                                .param("step", "kilalanin"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.options", hasSize(4)))
                                .andReturn();
                String initialMatchJson = matchInitialResult.getResponse().getContentAsString();

                for (int i = 0; i < 5; i++) {
                        MvcResult repeatMatchResult = mockMvc.perform(get("/api/vocabulary/match/" + wordIdStr)
                                        .header("Authorization", "Bearer " + token)
                                        .param("step", "kilalanin"))
                                        .andExpect(status().isOk())
                                        .andReturn();
                        assertEquals(initialMatchJson, repeatMatchResult.getResponse().getContentAsString(),
                                        "Match options output must be deterministic across repeated calls");
                }

                // 3. Verify repeated calls to getGamitinDialogue return the exact same options in identical order
                MvcResult gamitinInitialResult = mockMvc.perform(get("/api/vocabulary/gamitin/" + wordIdStr)
                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.options", hasSize(3)))
                                .andReturn();
                String initialGamitinJson = gamitinInitialResult.getResponse().getContentAsString();

                for (int i = 0; i < 5; i++) {
                        MvcResult repeatGamitinResult = mockMvc.perform(get("/api/vocabulary/gamitin/" + wordIdStr)
                                        .header("Authorization", "Bearer " + token))
                                        .andExpect(status().isOk())
                                        .andReturn();
                        assertEquals(initialGamitinJson, repeatGamitinResult.getResponse().getContentAsString(),
                                        "Gamitin dialogue options output must be deterministic across repeated calls");
                }
        }


        @Test
        public void testGetNextWord_WhenModule2Locked_ReturnsForbidden() throws Exception {
                // Lock Module 2
                ModuleProgress m2 = moduleProgressRepository.findByUserIdAndModuleNumber(userId, 2)
                                .orElseThrow(() -> new IllegalStateException("Module progress 2 not initialized"));
                m2.setIsUnlocked(false);
                moduleProgressRepository.save(m2);

                // Both with explicit moduleNumber=2 and default (no param)
                mockMvc.perform(get("/api/vocabulary/next")
                                .header("Authorization", "Bearer " + token)
                                .param("moduleNumber", "2"))
                                .andExpect(status().isForbidden());

                mockMvc.perform(get("/api/vocabulary/next")
                                .header("Authorization", "Bearer " + token))
                                .andExpect(status().isForbidden());
        }

        @Test
        public void testGetNextWord_WhenModule3Locked_ReturnsForbidden() throws Exception {
                // Module 3 is locked by default
                mockMvc.perform(get("/api/vocabulary/next")
                                .header("Authorization", "Bearer " + token)
                                .param("moduleNumber", "3"))
                                .andExpect(status().isForbidden());
        }

        @Test
        public void testRecordProgress_WhenModule2Locked_ReturnsForbidden() throws Exception {
                // Lock Module 2
                ModuleProgress m2 = moduleProgressRepository.findByUserIdAndModuleNumber(userId, 2)
                                .orElseThrow(() -> new IllegalStateException("Module progress 2 not initialized"));
                m2.setIsUnlocked(false);
                moduleProgressRepository.save(m2);

                VocabularyItem selfBodyWord = vocabularyItemRepository.findByDomain("self_body").get(0);
                VocabularyProgressRequest req = new VocabularyProgressRequest(selfBodyWord.getId(), "kilalanin", true);

                mockMvc.perform(post("/api/vocabulary/progress")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(req)))
                                .andExpect(status().isForbidden());
        }

        @Test
        public void testRecordProgress_WhenModule3Locked_ReturnsForbidden() throws Exception {
                // Module 3 is locked by default
                VocabularyItem familyHomeWord = vocabularyItemRepository.findByDomain("family_home").get(0);
                VocabularyProgressRequest req = new VocabularyProgressRequest(familyHomeWord.getId(), "kilalanin", true);

                mockMvc.perform(post("/api/vocabulary/progress")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(req)))
                                .andExpect(status().isForbidden());
        }

        @Test
        public void testGetNextWordAndRecordProgress_WhenModule3Unlocked_Succeeds() throws Exception {
                // Unlock Module 3
                ModuleProgress m3 = moduleProgressRepository.findByUserIdAndModuleNumber(userId, 3)
                                .orElseThrow(() -> new IllegalStateException("Module progress 3 not initialized"));
                m3.setIsUnlocked(true);
                moduleProgressRepository.save(m3);

                mockMvc.perform(get("/api/vocabulary/next")
                                .header("Authorization", "Bearer " + token)
                                .param("moduleNumber", "3"))
                                .andExpect(status().isOk())
                                .andExpect(jsonPath("$.domain", is("family_home")));

                VocabularyItem familyHomeWord = vocabularyItemRepository.findByDomain("family_home").get(0);
                VocabularyProgressRequest req = new VocabularyProgressRequest(familyHomeWord.getId(), "kilalanin", true);

                mockMvc.perform(post("/api/vocabulary/progress")
                                .header("Authorization", "Bearer " + token)
                                .contentType(MediaType.APPLICATION_JSON)
                                .content(objectMapper.writeValueAsString(req)))
                                .andExpect(status().isCreated());
        }
}
