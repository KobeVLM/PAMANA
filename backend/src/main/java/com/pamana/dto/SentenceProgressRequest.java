package com.pamana.dto;

import jakarta.validation.constraints.NotNull;
import java.util.List;
import java.util.UUID;

public class SentenceProgressRequest {

    @NotNull
    private UUID taskId;

    @NotNull
    private List<String> submittedOrder;

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
}
