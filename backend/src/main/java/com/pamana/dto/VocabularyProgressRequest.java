package com.pamana.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.util.UUID;

public class VocabularyProgressRequest {

    @NotNull
    private UUID wordId;

    @NotBlank
    private String step; // 'pakinggan', 'kilalanin', 'basahin', 'gamitin'

    private boolean correct;

    public VocabularyProgressRequest() {
    }

    public VocabularyProgressRequest(UUID wordId, String step, boolean correct) {
        this.wordId = wordId;
        this.step = step;
        this.correct = correct;
    }

    // Getters and Setters
    public UUID getWordId() {
        return wordId;
    }

    public void setWordId(UUID wordId) {
        this.wordId = wordId;
    }

    public String getStep() {
        return step;
    }

    public void setStep(String step) {
        this.step = step;
    }

    public boolean isCorrect() {
        return correct;
    }

    public void setCorrect(boolean correct) {
        this.correct = correct;
    }
}
