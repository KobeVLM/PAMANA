package com.pamana.dto;

import java.util.List;

public class HamonResultResponse {
    private double passRate;
    private int masteredCount;
    private int reQueuedCount;
    private List<String> reQueuedWords;

    public HamonResultResponse() {
    }

    public HamonResultResponse(double passRate, int masteredCount, int reQueuedCount, List<String> reQueuedWords) {
        this.passRate = passRate;
        this.masteredCount = masteredCount;
        this.reQueuedCount = reQueuedCount;
        this.reQueuedWords = reQueuedWords;
    }

    // Getters and Setters
    public double getPassRate() {
        return passRate;
    }

    public void setPassRate(double passRate) {
        this.passRate = passRate;
    }

    public int getMasteredCount() {
        return masteredCount;
    }

    public void setMasteredCount(int masteredCount) {
        this.masteredCount = masteredCount;
    }

    public int getReQueuedCount() {
        return reQueuedCount;
    }

    public void setReQueuedCount(int reQueuedCount) {
        this.reQueuedCount = reQueuedCount;
    }

    public List<String> getReQueuedWords() {
        return reQueuedWords;
    }

    public void setReQueuedWords(List<String> reQueuedWords) {
        this.reQueuedWords = reQueuedWords;
    }
}
