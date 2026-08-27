package com.pamana.dto;

import java.util.UUID;

public class VocabularyWordResponse {
    private UUID wordId;
    private String word;
    private String domain;
    private String audioUrl;
    private String imageUrl;
    private Integer ordinal;

    public VocabularyWordResponse() {
    }

    public VocabularyWordResponse(UUID wordId, String word, String domain, String audioUrl, String imageUrl, Integer ordinal) {
        this.wordId = wordId;
        this.word = word;
        this.domain = domain;
        this.audioUrl = audioUrl;
        this.imageUrl = imageUrl;
        this.ordinal = ordinal;
    }

    // Getters and Setters
    public UUID getWordId() {
        return wordId;
    }

    public void setWordId(UUID wordId) {
        this.wordId = wordId;
    }

    public String getWord() {
        return word;
    }

    public void setWord(String word) {
        this.word = word;
    }

    public String getDomain() {
        return domain;
    }

    public void setDomain(String domain) {
        this.domain = domain;
    }

    public String getAudioUrl() {
        return audioUrl;
    }

    public void setAudioUrl(String audioUrl) {
        this.audioUrl = audioUrl;
    }

    public String getImageUrl() {
        return imageUrl;
    }

    public void setImageUrl(String imageUrl) {
        this.imageUrl = imageUrl;
    }

    public Integer getOrdinal() {
        return ordinal;
    }

    public void setOrdinal(Integer ordinal) {
        this.ordinal = ordinal;
    }
}
