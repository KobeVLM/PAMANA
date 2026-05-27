package com.pamana.dto;

import java.util.UUID;

public class LeaderboardEntry {
    private int rank;
    private UUID userId;
    private String learnerName;
    private String currentModuleName;
    private int modulesCompleted;

    public LeaderboardEntry() {
    }

    public LeaderboardEntry(int rank, UUID userId, String learnerName, String currentModuleName, int modulesCompleted) {
        this.rank = rank;
        this.userId = userId;
        this.learnerName = learnerName;
        this.currentModuleName = currentModuleName;
        this.modulesCompleted = modulesCompleted;
    }

    // Getters and Setters
    public int getRank() {
        return rank;
    }

    public void setRank(int rank) {
        this.rank = rank;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
    }

    public String getLearnerName() {
        return learnerName;
    }

    public void setLearnerName(String learnerName) {
        this.learnerName = learnerName;
    }

    public String getCurrentModuleName() {
        return currentModuleName;
    }

    public void setCurrentModuleName(String currentModuleName) {
        this.currentModuleName = currentModuleName;
    }

    public int getModulesCompleted() {
        return modulesCompleted;
    }

    public void setModulesCompleted(int modulesCompleted) {
        this.modulesCompleted = modulesCompleted;
    }
}
