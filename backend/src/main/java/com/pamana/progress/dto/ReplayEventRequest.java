package com.pamana.progress.dto;

import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

/**
 * One replay reported by a gameplay screen.
 *
 * <p>The learner comes from the authenticated principal, never from the body.
 * {@code runId} is optional so an older client or a component without a shared
 * progress run can still record a replay; the backend then groups it by itself.
 */
public class ReplayEventRequest {

    private UUID runId;

    @NotBlank(message = "Activity is required")
    private String activity;

    @NotBlank(message = "Item type is required")
    private String itemType;

    @NotBlank(message = "Item key is required")
    private String itemKey;

    private String step;

    private Integer moduleNumber;

    @NotBlank(message = "Source is required")
    private String source;

    public ReplayEventRequest() {
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

    public String getSource() {
        return source;
    }

    public void setSource(String source) {
        this.source = source;
    }
}
