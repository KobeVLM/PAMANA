package com.pamana.model;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Entity
@Table(name = "hamon_sessions")
public class HamonSession {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @NotNull
    @Column(name = "user_id", nullable = false)
    private UUID userId;

    @Convert(converter = UuidListConverter.class)
    @Column(name = "word_ids", columnDefinition = "TEXT")
    private List<UUID> wordIds = new ArrayList<>();

    @Column(name = "pass_rate", precision = 5, scale = 2)
    private BigDecimal passRate;

    @Column(name = "is_complete", nullable = false)
    private Boolean isComplete = false;

    @Column(name = "triggered_at", nullable = false)
    private LocalDateTime triggeredAt;

    @PrePersist
    protected void onCreate() {
        this.triggeredAt = LocalDateTime.now();
    }

    public HamonSession() {
    }

    public HamonSession(UUID userId, List<UUID> wordIds) {
        this.userId = userId;
        this.wordIds = wordIds;
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

    public List<UUID> getWordIds() {
        return wordIds;
    }

    public void setWordIds(List<UUID> wordIds) {
        this.wordIds = wordIds;
    }

    public BigDecimal getPassRate() {
        return passRate;
    }

    public void setPassRate(BigDecimal passRate) {
        this.passRate = passRate;
    }

    public Boolean getIsComplete() {
        return isComplete;
    }

    public void setIsComplete(Boolean complete) {
        isComplete = complete;
    }

    public LocalDateTime getTriggeredAt() {
        return triggeredAt;
    }

    public void setTriggeredAt(LocalDateTime triggeredAt) {
        this.triggeredAt = triggeredAt;
    }

    // Converter to store List<UUID> as a comma-separated string in the DB
    @Converter
    public static class UuidListConverter implements AttributeConverter<List<UUID>, String> {

        @Override
        public String convertToDatabaseColumn(List<UUID> attribute) {
            if (attribute == null || attribute.isEmpty()) {
                return "";
            }
            return attribute.stream()
                    .map(UUID::toString)
                    .collect(Collectors.joining(","));
        }

        @Override
        public List<UUID> convertToEntityAttribute(String dbData) {
            if (dbData == null || dbData.trim().isEmpty()) {
                return new ArrayList<>();
            }
            return Arrays.stream(dbData.split(","))
                    .map(String::trim)
                    .map(UUID::fromString)
                    .collect(Collectors.toCollection(ArrayList::new));
        }
    }
}
