package com.pamana.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public class SyllableProgressRequest {

    @NotBlank(message = "Sub-level is required")
    private String subLevel; // 'pagsama', 'pakinggan', 'kilalanin', 'rhyming'

    @NotNull(message = "Set ID is required")
    private Integer setId;

    @NotBlank(message = "Selected answer is required")
    private String selectedAnswer;

    private boolean correct;

    public SyllableProgressRequest() {
    }

    public SyllableProgressRequest(String subLevel, Integer setId, String selectedAnswer, boolean correct) {
        this.subLevel = subLevel;
        this.setId = setId;
        this.selectedAnswer = selectedAnswer;
        this.correct = correct;
    }

    // Getters and Setters
    public String getSubLevel() {
        return subLevel;
    }

    public void setSubLevel(String subLevel) {
        this.subLevel = subLevel;
    }

    public Integer getSetId() {
        return setId;
    }

    public void setSetId(Integer setId) {
        this.setId = setId;
    }

    public String getSelectedAnswer() {
        return selectedAnswer;
    }

    public void setSelectedAnswer(String selectedAnswer) {
        this.selectedAnswer = selectedAnswer;
    }

    public boolean isCorrect() {
        return correct;
    }

    public void setCorrect(boolean correct) {
        this.correct = correct;
    }
}
