package com.pamana.progress.dto;

import java.util.UUID;

/**
 * Progress for one play-through, recomputed from {@code answer_events}.
 *
 * <p>{@code correctItems} counts distinct items answered correctly at least
 * once, so retrying a wrong answer can only ever raise the bar. That is what
 * makes the value monotone: a wrong attempt increments {@code wrongAttempts}
 * and nothing else.
 */
public class AnswerProgressResponse {

    private UUID runId;
    private int correctItems;
    private int answeredItems;
    private int totalItems;
    private int wrongAttempts;
    /** 0-100, or null when the caller did not supply a total. */
    private Double progressPercent;

    public AnswerProgressResponse() {
    }

    public AnswerProgressResponse(UUID runId, int correctItems, int answeredItems, int totalItems,
            int wrongAttempts, Double progressPercent) {
        this.runId = runId;
        this.correctItems = correctItems;
        this.answeredItems = answeredItems;
        this.totalItems = totalItems;
        this.wrongAttempts = wrongAttempts;
        this.progressPercent = progressPercent;
    }

    public UUID getRunId() {
        return runId;
    }

    public void setRunId(UUID runId) {
        this.runId = runId;
    }

    public int getCorrectItems() {
        return correctItems;
    }

    public void setCorrectItems(int correctItems) {
        this.correctItems = correctItems;
    }

    public int getAnsweredItems() {
        return answeredItems;
    }

    public void setAnsweredItems(int answeredItems) {
        this.answeredItems = answeredItems;
    }

    public int getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(int totalItems) {
        this.totalItems = totalItems;
    }

    public int getWrongAttempts() {
        return wrongAttempts;
    }

    public void setWrongAttempts(int wrongAttempts) {
        this.wrongAttempts = wrongAttempts;
    }

    public Double getProgressPercent() {
        return progressPercent;
    }

    public void setProgressPercent(Double progressPercent) {
        this.progressPercent = progressPercent;
    }
}
