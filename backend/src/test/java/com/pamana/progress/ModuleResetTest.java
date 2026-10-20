package com.pamana.progress;

import com.pamana.auth.Role;
import com.pamana.auth.UserRepository;
import com.pamana.auth.dto.LoginRequest;
import com.pamana.auth.dto.RegisterRequest;
import com.pamana.syllable.SyllableProgress;
import com.pamana.syllable.SyllableProgressRepository;
import com.pamana.vocabulary.VocabularyItem;
import com.pamana.vocabulary.VocabularyItemRepository;
import com.pamana.vocabulary.WordMastery;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * A retake ("Ulitin") must clear only the in-progress attempt data. The saved
 * completion and score are kept until a new attempt is actually finished, and
 * then only when it beats the saved score.
 */
@SpringBootTest
@AutoConfigureMockMvc
public class ModuleResetTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ModuleProgressRepository moduleProgressRepository;

    @Autowired
    private ModuleAttemptHistoryRepository moduleAttemptHistoryRepository;

    @Autowired
    private SyllableProgressRepository syllableProgressRepository;

    @Autowired
    private VocabularyItemRepository vocabularyItemRepository;

    @Autowired
    private WordMasteryRepository wordMasteryRepository;

    @Autowired
    private ModuleLockService moduleLockService;

    @Autowired
    private ObjectMapper objectMapper;

    private String token;
    private UUID userId;

    @BeforeEach
    public void setup() throws Exception {
        moduleAttemptHistoryRepository.deleteAll();
        syllableProgressRepository.deleteAll();
        wordMasteryRepository.deleteAll();
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

        String responseContent = loginResult.getResponse().getContentAsString();
        token = objectMapper.readTree(responseContent).get("token").asText();
        userId = UUID.fromString(objectMapper.readTree(responseContent).get("user").get("id").asText());
    }

    @Test
    public void resetKeepsSavedCompletionAndScore() throws Exception {
        ModuleProgress m1 = moduleProgressRepository.findByUserIdAndModuleNumber(userId, 1).orElseThrow();
        m1.setIsComplete(true);
        m1.setAccuracy(BigDecimal.valueOf(93));
        moduleProgressRepository.save(m1);

        syllableProgressRepository.save(new SyllableProgress(userId, "pagsama", 1));

        mockMvc.perform(delete("/api/modules/reset/" + userId + "/1")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        assertThat(syllableProgressRepository.findByUserId(userId)).isEmpty();

        ModuleProgress after = moduleProgressRepository.findByUserIdAndModuleNumber(userId, 1).orElseThrow();
        assertThat(after.getIsComplete()).isTrue();
        assertThat(after.getAccuracy()).isNotNull();
        assertThat(after.getAccuracy().doubleValue()).isEqualTo(93.0);
    }

    @Test
    public void resetOfVocabularyModuleClearsThatDomainsMasteryOnly() throws Exception {
        List<VocabularyItem> selfBody = vocabularyItemRepository.findByDomain("self_body");
        if (selfBody.isEmpty()) {
            selfBody = vocabularyItemRepository.saveAll(List.of(
                    new VocabularyItem("mata", "self_body", null, null, 1)));
        }
        VocabularyItem item = selfBody.get(0);

        ModuleProgress m2 = moduleProgressRepository.findByUserIdAndModuleNumber(userId, 2).orElseThrow();
        m2.setIsComplete(true);
        m2.setAccuracy(BigDecimal.valueOf(88));
        moduleProgressRepository.save(m2);

        wordMasteryRepository.save(new WordMastery(userId, item.getId()));

        mockMvc.perform(delete("/api/modules/reset/" + userId + "/2")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        assertThat(wordMasteryRepository.findByUserId(userId)).isEmpty();

        ModuleProgress after = moduleProgressRepository.findByUserIdAndModuleNumber(userId, 2).orElseThrow();
        assertThat(after.getIsComplete()).isTrue();
        assertThat(after.getAccuracy().doubleValue()).isEqualTo(88.0);
    }

    @Test
    public void evaluateAndUnlockKeepsTheHighestScoreEverAchieved() {
        ModuleProgress m1 = moduleProgressRepository.findByUserIdAndModuleNumber(userId, 1).orElseThrow();
        m1.setIsComplete(true);
        m1.setAccuracy(BigDecimal.valueOf(93));
        moduleProgressRepository.save(m1);

        moduleLockService.evaluateAndUnlock(userId, 1, 85.0);

        ModuleProgress after = moduleProgressRepository.findByUserIdAndModuleNumber(userId, 1).orElseThrow();
        assertThat(after.getIsComplete()).isTrue();
        assertThat(after.getAccuracy().doubleValue()).isEqualTo(93.0);

        moduleLockService.evaluateAndUnlock(userId, 1, 100.0);

        ModuleProgress improved = moduleProgressRepository.findByUserIdAndModuleNumber(userId, 1).orElseThrow();
        assertThat(improved.getAccuracy().doubleValue()).isEqualTo(100.0);
    }
}
