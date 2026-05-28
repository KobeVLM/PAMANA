package com.pamana.dto;

import java.util.UUID;

public class SentenceResultResponse {
    private boolean correct;
    private int attempts;
    private double accuracy;
    private double tierAccuracy;
    private boolean tierComplete;
    private boolean moduleComplete;
    private UUID nextTaskId;

    public SentenceResultResponse() {
    }

    public SentenceResultResponse(boolean correct, int attempts, double accuracy, double tierAccuracy, boolean tierComplete, boolean moduleComplete, UUID nextTaskId) {
        this.correct = correct;
        this.attempts = attempts;
        this.accuracy = accuracy;
        this.tierAccuracy = tierAccuracy;
        this.tierComplete = tierComplete;
        this.moduleComplete = moduleComplete;
        this.nextTaskId = nextTaskId;
    }

    // Getters and Setters
    public boolean isCorrect() {
        return correct;
    }

    public void setCorrect(boolean correct) {
        this.correct = correct;
    }

    public int getAttempts() {
        return attempts;
    }

    public void setAttempts(int attempts) {
        this.attempts = attempts;
    }

    public double getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(double accuracy) {
        this.accuracy = accuracy;
    }

    public double getTierAccuracy() {
        return tierAccuracy;
    }

    public void setTierAccuracy(double tierAccuracy) {
        this.tierAccuracy = tierAccuracy;
    }

    public boolean isTierComplete() {
        return tierComplete;
    }

    public void setTierComplete(boolean tierComplete) {
        this.tierComplete = tierComplete;
    }

    public boolean isModuleComplete() {
        return moduleComplete;
    }

    public void setModuleComplete(boolean moduleComplete) {
        this.moduleComplete = moduleComplete;
    }

    public UUID getNextTaskId() {
        return nextTaskId;
    }

    public void setNextTaskId(UUID nextTaskId) {
        this.nextTaskId = nextTaskId;
    }
}
