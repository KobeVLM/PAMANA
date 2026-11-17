package com.pamana.progress;

import com.pamana.progress.ModuleProgress;

import jakarta.persistence.*;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.util.UUID;

@Entity
@Table(name = "module_progress")
public class ModuleProgress {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @NotNull
    @Min(1)
    @Max(4)
    @Column(name = "module_number", nullable = false)
    private Integer moduleNumber;

    @NotNull
    @Column(name = "is_unlocked", nullable = false)
    private Boolean isUnlocked = false;

    @NotNull
    @Column(name = "is_complete", nullable = false)
    private Boolean isComplete = false;

    @Column(precision = 5, scale = 2)
    private BigDecimal accuracy;

    // Snapshot of Module 4's per-tier sentence accuracy at completion time.
    // Kept separate from the live sentence_progress rows because restarting a
    // module deletes those rows while preserving the saved completion.
    @Column(name = "tier1_accuracy", precision = 5, scale = 2)
    private BigDecimal tier1Accuracy;

    @Column(name = "tier2_accuracy", precision = 5, scale = 2)
    private BigDecimal tier2Accuracy;

    public ModuleProgress() {
    }

    public ModuleProgress(UUID userId, Integer moduleNumber, Boolean isUnlocked, Boolean isComplete) {
        this.userId = userId;
        this.moduleNumber = moduleNumber;
        this.isUnlocked = isUnlocked;
        this.isComplete = isComplete;
    }

    // Getters and Setters
    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public UUID getUserId() {
        return userId;
    }

    public void setUserId(UUID userId) {
        this.userId = userId;
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

    public void setIsUnlocked(Boolean unlocked) {
        isUnlocked = unlocked;
    }

    public Boolean getIsComplete() {
        return isComplete;
    }

    public void setIsComplete(Boolean complete) {
        isComplete = complete;
    }

    public BigDecimal getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(BigDecimal accuracy) {
        this.accuracy = accuracy;
    }

    public BigDecimal getTier1Accuracy() {
        return tier1Accuracy;
    }

    public void setTier1Accuracy(BigDecimal tier1Accuracy) {
        this.tier1Accuracy = tier1Accuracy;
    }

    public BigDecimal getTier2Accuracy() {
        return tier2Accuracy;
    }

    public void setTier2Accuracy(BigDecimal tier2Accuracy) {
        this.tier2Accuracy = tier2Accuracy;
    }
}
