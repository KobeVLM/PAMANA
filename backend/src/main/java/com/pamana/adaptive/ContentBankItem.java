package com.pamana.adaptive;

import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;

import java.util.UUID;

/**
 * One tiered distractor pool in the modular Content Bank.
 *
 * <p>The pool is stored as a comma-separated list of labels rather than entity
 * references: vocabulary options need a case-insensitive word lookup and
 * syllable options are plain syllable labels, so a shared string format keeps
 * both activities in one small table.
 */
@Entity
@Table(name = "content_bank", uniqueConstraints = @UniqueConstraint(
        name = "uq_content_bank_item",
        columnNames = { "activity", "item_key", "difficulty_tier" }))
public class ContentBankItem {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @NotBlank
    @Column(nullable = false, length = 16)
    private String activity;

    @NotBlank
    @Column(name = "item_key", nullable = false, length = 80)
    private String itemKey;

    @NotBlank
    @Column(name = "difficulty_tier", nullable = false, length = 16)
    private String difficultyTier;

    @NotBlank
    @Column(nullable = false, columnDefinition = "TEXT")
    private String distractors;

    @Column(name = "context_word", length = 50)
    private String contextWord;

    public ContentBankItem() {
    }

    public ContentBankItem(String activity, String itemKey, String difficultyTier,
            String distractors, String contextWord) {
        this.activity = activity;
        this.itemKey = itemKey;
        this.difficultyTier = difficultyTier;
        this.distractors = distractors;
        this.contextWord = contextWord;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getActivity() {
        return activity;
    }

    public void setActivity(String activity) {
        this.activity = activity;
    }

    public String getItemKey() {
        return itemKey;
    }

    public void setItemKey(String itemKey) {
        this.itemKey = itemKey;
    }

    public String getDifficultyTier() {
        return difficultyTier;
    }

    public void setDifficultyTier(String difficultyTier) {
        this.difficultyTier = difficultyTier;
    }

    public String getDistractors() {
        return distractors;
    }

    public void setDistractors(String distractors) {
        this.distractors = distractors;
    }

    public String getContextWord() {
        return contextWord;
    }

    public void setContextWord(String contextWord) {
        this.contextWord = contextWord;
    }
}
