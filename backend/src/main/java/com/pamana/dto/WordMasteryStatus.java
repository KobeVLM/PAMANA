package com.pamana.dto;

import java.util.UUID;

public class WordMasteryStatus {
    private UUID wordId;
    private String word;
    private String domain;
    private double overallAccuracy;
    private int hamonFailCount;
    private String status;

    public WordMasteryStatus() {
    }

    public WordMasteryStatus(UUID wordId, String word, String domain, double overallAccuracy, int hamonFailCount, String status) {
        this.wordId = wordId;
        this.word = word;
        this.domain = domain;
        this.overallAccuracy = overallAccuracy;
        this.hamonFailCount = hamonFailCount;
        this.status = status;
    }

    // Getters and Setters
    public UUID getWordId() {
        return wordId;
    }

    public void setWordId(UUID wordId) {
        this.wordId = wordId;
    }

    public String getWord() {
        return word;
    }

    public void setWord(String word) {
        this.word = word;
    }

    public String getDomain() {
        return domain;
    }

    public void setDomain(String domain) {
        this.domain = domain;
    }

    public double getOverallAccuracy() {
        return overallAccuracy;
    }

    public void setOverallAccuracy(double overallAccuracy) {
        this.overallAccuracy = overallAccuracy;
    }

    public int getHamonFailCount() {
        return hamonFailCount;
    }

    public void setHamonFailCount(int hamonFailCount) {
        this.hamonFailCount = hamonFailCount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }
}
