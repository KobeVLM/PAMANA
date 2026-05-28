package com.pamana.dto;

import java.util.List;
import java.util.UUID;

public class SentenceTaskResponse {
    private UUID taskId;
    private List<String> scrambledWords;
    private String audioUrl;
    private int tier;
    private boolean completed;

    public SentenceTaskResponse() {
    }

    public SentenceTaskResponse(UUID taskId, List<String> scrambledWords, String audioUrl, int tier, boolean completed) {
        this.taskId = taskId;
        this.scrambledWords = scrambledWords;
        this.audioUrl = audioUrl;
        this.tier = tier;
        this.completed = completed;
    }

    // Getters and Setters
    public UUID getTaskId() {
        return taskId;
    }

    public void setTaskId(UUID taskId) {
        this.taskId = taskId;
    }

    public List<String> getScrambledWords() {
        return scrambledWords;
    }

    public void setScrambledWords(List<String> scrambledWords) {
        this.scrambledWords = scrambledWords;
    }

    public String getAudioUrl() {
        return audioUrl;
    }

    public void setAudioUrl(String audioUrl) {
        this.audioUrl = audioUrl;
    }

    public int getTier() {
        return tier;
    }

    public void setTier(int tier) {
        this.tier = tier;
    }

    public boolean isCompleted() {
        return completed;
    }

    public void setCompleted(boolean completed) {
        this.completed = completed;
    }
}
