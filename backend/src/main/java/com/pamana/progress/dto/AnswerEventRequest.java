package com.pamana.progress.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * One answer reported by a gameplay screen.
 *
 * <p>The learner is taken from the authenticated principal, never from the
 * body, so a child cannot log answers for someone else.
 */
public class AnswerEventRequest {

    @NotNull(message = "Run id is required")
    private UUID runId;

    @NotBlank(message = "Activity is required")
    private String activity;

    @NotBlank(message = "Item type is required")
    private String itemType;

    @NotBlank(message = "Item key is required")
    private String itemKey;

    private String step;

    private Integer moduleNumber;

    private boolean correct;

    public AnswerEventRequest() {
    }

    public UUID getRunId() {
        return runId;
    }

    public void setRunId(UUID runId) {
        this.runId = runId;
    }

    public String getActivity() {
        return activity;
    }

    public void setActivity(String activity) {
        this.activity = activity;
    }

    public String getItemType() {
        return itemType;
    }

    public void setItemType(String itemType) {
        this.itemType = itemType;
    }

    public String getItemKey() {
        return itemKey;
    }

    public void setItemKey(String itemKey) {
        this.itemKey = itemKey;
    }

    public String getStep() {
        return step;
    }

    public void setStep(String step) {
        this.step = step;
    }

    public Integer getModuleNumber() {
        return moduleNumber;
    }

    public void setModuleNumber(Integer moduleNumber) {
        this.moduleNumber = moduleNumber;
    }

    public boolean isCorrect() {
        return correct;
    }

    public void setCorrect(boolean correct) {
        this.correct = correct;
    }
}
