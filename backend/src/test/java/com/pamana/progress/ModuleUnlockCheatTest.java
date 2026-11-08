package com.pamana.progress;

import com.pamana.auth.Role;
import com.pamana.auth.UserRepository;
import com.pamana.auth.dto.RegisterRequest;
import com.pamana.auth.dto.LoginRequest;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class ModuleUnlockCheatTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ModuleProgressRepository moduleProgressRepository;

    @Autowired
    private ModuleAttemptHistoryRepository moduleAttemptHistoryRepository;

    @Autowired
    private ModuleLockService moduleLockService;

    @Autowired
    private ObjectMapper objectMapper;

    private String token;
    private UUID userId;

    @BeforeEach
    public void setup() throws Exception {
        moduleAttemptHistoryRepository.deleteAll();
        moduleProgressRepository.deleteAll();
        userRepository.deleteAll();

        RegisterRequest registerReq = new RegisterRequest(
                "CheatLearner",
                "learner_cheat@pamana.ph",
                "Password123!",
                Role.LEARNER
        );

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(registerReq)))
                .andExpect(status().isCreated());

        LoginRequest loginReq = new LoginRequest("learner_cheat@pamana.ph", "Password123!");
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andReturn();

        String resBody = result.getResponse().getContentAsString();
        this.token = objectMapper.readTree(resBody).get("token").asText();
        this.userId = UUID.fromString(objectMapper.readTree(resBody).get("user").get("id").asText());
    }

    @Test
    public void testUnlockIndividualModuleViaService() {
        // Initially, only Module 1 is unlocked
        assertThat(moduleLockService.isModuleUnlocked(userId, 1)).isTrue();
        assertThat(moduleLockService.isModuleUnlocked(userId, 2)).isFalse();
        assertThat(moduleLockService.isModuleUnlocked(userId, 3)).isFalse();

        // Cheat unlock Module 3
        moduleLockService.unlockModule(userId, 3);

        ModuleProgress m1 = moduleProgressRepository.findByUserIdAndModuleNumber(userId, 1).orElseThrow();
        ModuleProgress m2 = moduleProgressRepository.findByUserIdAndModuleNumber(userId, 2).orElseThrow();
        ModuleProgress m3 = moduleProgressRepository.findByUserIdAndModuleNumber(userId, 3).orElseThrow();
        ModuleProgress m4 = moduleProgressRepository.findByUserIdAndModuleNumber(userId, 4).orElseThrow();

        assertThat(m1.getIsUnlocked()).isTrue();
        assertThat(m1.getIsComplete()).isTrue();
        assertThat(m2.getIsUnlocked()).isTrue();
        assertThat(m2.getIsComplete()).isTrue();
        assertThat(m3.getIsUnlocked()).isTrue();
        assertThat(m3.getIsComplete()).isFalse();
        assertThat(m4.getIsUnlocked()).isFalse();
    }

    @Test
    public void testUnlockAllModulesViaService() {
        moduleLockService.unlockAllModules(userId, false);

        List<ModuleProgress> all = moduleProgressRepository.findByUserId(userId);
        assertThat(all).hasSize(4);
        for (ModuleProgress p : all) {
            assertThat(p.getIsUnlocked()).isTrue();
        }
    }

    @Test
    public void testUnlockModuleViaEndpoint() throws Exception {
        mockMvc.perform(post("/api/modules/unlock/2")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        ModuleProgress m2 = moduleProgressRepository.findByUserIdAndModuleNumber(userId, 2).orElseThrow();
        assertThat(m2.getIsUnlocked()).isTrue();
    }

    @Test
    public void testUnlockAllModulesViaEndpoint() throws Exception {
        mockMvc.perform(post("/api/modules/unlock-all")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk());

        List<ModuleProgress> all = moduleProgressRepository.findByUserId(userId);
        for (ModuleProgress p : all) {
            assertThat(p.getIsUnlocked()).isTrue();
        }
    }
}
