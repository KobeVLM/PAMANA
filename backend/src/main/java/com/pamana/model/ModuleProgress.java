package com.pamana.model;

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
}
