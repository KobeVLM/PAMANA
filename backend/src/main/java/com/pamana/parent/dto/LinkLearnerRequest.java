package com.pamana.parent.dto;

public class LinkLearnerRequest {
    private String identifier;
    private String learnerEmail;

    public LinkLearnerRequest() {}

    public LinkLearnerRequest(String identifier) {
        this.identifier = identifier;
    }

    public String getIdentifier() {
        if (identifier != null && !identifier.trim().isEmpty()) {
            return identifier.trim();
        }
        return learnerEmail != null ? learnerEmail.trim() : "";
    }

    public void setIdentifier(String identifier) {
        this.identifier = identifier;
    }

    public String getLearnerEmail() {
        return learnerEmail;
    }

    public void setLearnerEmail(String learnerEmail) {
        this.learnerEmail = learnerEmail;
    }
}
