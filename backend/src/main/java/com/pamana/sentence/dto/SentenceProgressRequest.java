package com.pamana.sentence.dto;

import com.pamana.sentence.dto.SentenceProgressRequest;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public class SentenceProgressRequest {

    @NotNull
    private UUID taskId;

    @NotNull
    private List<String> submittedOrder;

    /** Groups this answer with the rest of the same play-through. Optional. */
    private UUID runId;

    public SentenceProgressRequest() {
    }

    public SentenceProgressRequest(UUID taskId, List<String> submittedOrder) {
        this.taskId = taskId;
        this.submittedOrder = submittedOrder;
    }

    // Getters and Setters
    public UUID getTaskId() {
        return taskId;
    }

    public void setTaskId(UUID taskId) {
        this.taskId = taskId;
    }

    public List<String> getSubmittedOrder() {
        return submittedOrder;
    }

    public void setSubmittedOrder(List<String> submittedOrder) {
        this.submittedOrder = submittedOrder;
    }

    public UUID getRunId() {
        return runId;
    }

    public void setRunId(UUID runId) {
        this.runId = runId;
    }
}
