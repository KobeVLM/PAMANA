package com.pamana.dto;

import java.util.UUID;

public class WordMasteryResponse {
    private UUID wordId;
    private double overallAccuracy;
    private String status;
    private boolean mastered;
    private boolean hamonTriggered;

    public WordMasteryResponse() {
    }

    public WordMasteryResponse(UUID wordId, double overallAccuracy, String status, boolean mastered, boolean hamonTriggered) {
        this.wordId = wordId;
        this.overallAccuracy = overallAccuracy;
        this.status = status;
        this.mastered = mastered;
        this.hamonTriggered = hamonTriggered;
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

    public boolean isHamonTriggered() {
        return hamonTriggered;
    }

    public void setHamonTriggered(boolean hamonTriggered) {
        this.hamonTriggered = hamonTriggered;
    }
}
