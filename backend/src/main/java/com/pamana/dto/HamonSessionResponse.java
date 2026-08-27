package com.pamana.dto;

import java.util.List;
import java.util.UUID;

public class HamonSessionResponse {
    private UUID sessionId;
    private UUID userId;
    private List<VocabularyWordResponse> words;

    public HamonSessionResponse() {
    }

    public HamonSessionResponse(UUID sessionId, UUID userId, List<VocabularyWordResponse> words) {
        this.sessionId = sessionId;
        this.userId = userId;
        this.words = words;
    }

    // Getters and Setters
    public UUID getSessionId() {
        return sessionId;
    }

    public void setSessionId(UUID sessionId) {
        this.sessionId = sessionId;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public List<VocabularyWordResponse> getWords() {
        return words;
    }

    public void setWords(List<VocabularyWordResponse> words) {
        this.words = words;
    }
}
