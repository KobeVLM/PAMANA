package com.pamana.vocabulary.dto;

import com.pamana.vocabulary.dto.WordMasteryResponse;

import java.util.UUID;

public class WordMasteryResponse {
    private UUID wordId;
    private double overallAccuracy;
    private String status;
    private boolean mastered;

    public WordMasteryResponse() {
    }

    public WordMasteryResponse(UUID wordId, double overallAccuracy, String status, boolean mastered) {
        this.wordId = wordId;
        this.overallAccuracy = overallAccuracy;
        this.status = status;
        this.mastered = mastered;
    }

    // Getters and Setters
    public UUID getWordId() {
        return wordId;
    }

    public void setWordId(UUID wordId) {
        this.wordId = wordId;
    }

    public double getOverallAccuracy() {
        return overallAccuracy;
    }

    public void setOverallAccuracy(double overallAccuracy) {
        this.overallAccuracy = overallAccuracy;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public boolean isMastered() {
        return mastered;
    }

    public void setMastered(boolean mastered) {
        this.mastered = mastered;
    }
}
