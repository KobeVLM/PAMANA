package com.pamana.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "word_mastery")
public class WordMastery {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @NotNull
    @Column(name = "vocab_item_id", nullable = false)
    private UUID vocabItemId;

    @Column(name = "overall_accuracy", precision = 5, scale = 2)
    private BigDecimal overallAccuracy = BigDecimal.ZERO;

    @Column(name = "pakinggan_completed", nullable = false)
    private Boolean pakingganCompleted = false;

    @Column(name = "kilalanin_accuracy", precision = 5, scale = 2)
    private BigDecimal kilalaninAccuracy = BigDecimal.ZERO;

    @Column(name = "basahin_accuracy", precision = 5, scale = 2)
    private BigDecimal basahinAccuracy = BigDecimal.ZERO;

    @Column(name = "gamitin_accuracy", precision = 5, scale = 2)
    private BigDecimal gamitinAccuracy = BigDecimal.ZERO;

    @Column(name = "hamon_fail_count", nullable = false)
    private Integer hamonFailCount = 0;

    @Column(nullable = false, length = 10)
    private String status = "grey"; // green / yellow / red / grey

    @Column(name = "last_updated", nullable = false)
    private LocalDateTime lastUpdated;

    @PrePersist
    @PreUpdate
    protected void onUpdate() {
        this.lastUpdated = LocalDateTime.now();
    }

    public WordMastery() {
    }

    public WordMastery(UUID userId, UUID vocabItemId) {
        this.userId = userId;
        this.vocabItemId = vocabItemId;
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

    public UUID getVocabItemId() {
        return vocabItemId;
    }

    public void setVocabItemId(UUID vocabItemId) {
        this.vocabItemId = vocabItemId;
    }

    public BigDecimal getOverallAccuracy() {
        return overallAccuracy;
    }

    public void setOverallAccuracy(BigDecimal overallAccuracy) {
        this.overallAccuracy = overallAccuracy;
    }

    public Boolean getPakingganCompleted() {
        return pakingganCompleted;
    }

    public void setPakingganCompleted(Boolean pakingganCompleted) {
        this.pakingganCompleted = pakingganCompleted;
    }

    public BigDecimal getKilalaninAccuracy() {
        return kilalaninAccuracy;
    }

    public void setKilalaninAccuracy(BigDecimal kilalaninAccuracy) {
        this.kilalaninAccuracy = kilalaninAccuracy;
    }

    public BigDecimal getBasahinAccuracy() {
        return basahinAccuracy;
    }

    public void setBasahinAccuracy(BigDecimal basahinAccuracy) {
        this.basahinAccuracy = basahinAccuracy;
    }

    public BigDecimal getGamitinAccuracy() {
        return gamitinAccuracy;
    }

    public void setGamitinAccuracy(BigDecimal gamitinAccuracy) {
        this.gamitinAccuracy = gamitinAccuracy;
    }

    public Integer getHamonFailCount() {
        return hamonFailCount;
    }

    public void setHamonFailCount(Integer hamonFailCount) {
        this.hamonFailCount = hamonFailCount;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getLastUpdated() {
        return lastUpdated;
    }

    public void setLastUpdated(LocalDateTime lastUpdated) {
        this.lastUpdated = lastUpdated;
    }
}
