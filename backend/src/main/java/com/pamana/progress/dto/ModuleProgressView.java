package com.pamana.progress.dto;

import java.math.BigDecimal;

/**
 * Read model for the parent dashboard's module list. Adds {@code hasAttempts}
 * so the UI can offer a partial progress report for modules that are unlocked
 * and have been played but are not complete yet.
 */
public class ModuleProgressView {
    private Integer moduleNumber;
    private Boolean isUnlocked;
    private Boolean isComplete;
    private BigDecimal accuracy;
    private Boolean hasAttempts;

    public ModuleProgressView() {
    }

    public ModuleProgressView(Integer moduleNumber, Boolean isUnlocked, Boolean isComplete,
                              BigDecimal accuracy, Boolean hasAttempts) {
        this.moduleNumber = moduleNumber;
        this.isUnlocked = isUnlocked;
        this.isComplete = isComplete;
        this.accuracy = accuracy;
        this.hasAttempts = hasAttempts;
    }

    public Integer getModuleNumber() {
        return moduleNumber;
    }

    public void setModuleNumber(Integer moduleNumber) {
        this.moduleNumber = moduleNumber;
    }

    public Boolean getIsUnlocked() {
        return isUnlocked;
    }

    public void setIsUnlocked(Boolean isUnlocked) {
        this.isUnlocked = isUnlocked;
    }

    public Boolean getIsComplete() {
        return isComplete;
    }

    public void setIsComplete(Boolean isComplete) {
        this.isComplete = isComplete;
    }

    public BigDecimal getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(BigDecimal accuracy) {
        this.accuracy = accuracy;
    }

    public Boolean getHasAttempts() {
        return hasAttempts;
    }

    public void setHasAttempts(Boolean hasAttempts) {
        this.hasAttempts = hasAttempts;
    }
}
