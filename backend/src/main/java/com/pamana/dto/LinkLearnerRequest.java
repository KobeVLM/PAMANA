package com.pamana.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public class LinkLearnerRequest {
    @NotBlank(message = "Email is required")
    @Email(message = "Email must be valid")
    private String learnerEmail;

    public LinkLearnerRequest() {}

    public String getLearnerEmail() {
        return learnerEmail;
    }

    public void setLearnerEmail(String learnerEmail) {
        this.learnerEmail = learnerEmail;
    }
}
