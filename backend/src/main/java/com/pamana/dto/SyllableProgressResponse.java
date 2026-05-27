package com.pamana.dto;

public class SyllableProgressResponse {

    private Integer attempts;
    private Integer correctCount;
    private double accuracy;
    private Integer nextSetId;
    private double moduleAccuracy;
    private boolean module2Unlocked;

    public SyllableProgressResponse() {
    }

    public SyllableProgressResponse(Integer attempts, Integer correctCount, double accuracy, 
                                    Integer nextSetId, double moduleAccuracy, boolean module2Unlocked) {
        this.attempts = attempts;
        this.correctCount = correctCount;
        this.accuracy = accuracy;
        this.nextSetId = nextSetId;
        this.moduleAccuracy = moduleAccuracy;
        this.module2Unlocked = module2Unlocked;
    }

    // Getters and Setters
    public Integer getAttempts() {
        return attempts;
    }

    public void setAttempts(Integer attempts) {
        this.attempts = attempts;
    }

    public Integer getCorrectCount() {
        return correctCount;
    }

    public void setCorrectCount(Integer correctCount) {
        this.correctCount = correctCount;
    }

    public double getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(double accuracy) {
        this.accuracy = accuracy;
    }

    public Integer getNextSetId() {
        return nextSetId;
    }

    public void setNextSetId(Integer nextSetId) {
        this.nextSetId = nextSetId;
    }

    public double getModuleAccuracy() {
        return moduleAccuracy;
    }

    public void setModuleAccuracy(double moduleAccuracy) {
        this.moduleAccuracy = moduleAccuracy;
    }

    public boolean isModule2Unlocked() {
        return module2Unlocked;
    }

    public void setModule2Unlocked(boolean module2Unlocked) {
        this.module2Unlocked = module2Unlocked;
    }
}
