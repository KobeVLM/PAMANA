package com.pamana.dto;

import java.util.List;
import java.util.UUID;

public class MatchOptionsResponse {
    private UUID targetWordId;
    private String targetWord;
    private String targetImageUrl;
    private String targetAudioUrl;
    private List<OptionItem> options;

    public MatchOptionsResponse() {
    }

    public MatchOptionsResponse(UUID targetWordId, String targetWord, String targetImageUrl, String targetAudioUrl, List<OptionItem> options) {
        this.targetWordId = targetWordId;
        this.targetWord = targetWord;
        this.targetImageUrl = targetImageUrl;
        this.targetAudioUrl = targetAudioUrl;
        this.options = options;
    }

    // Getters and Setters
    public UUID getTargetWordId() {
        return targetWordId;
    }

    public void setTargetWordId(UUID targetWordId) {
        this.targetWordId = targetWordId;
    }

    public String getTargetWord() {
        return targetWord;
    }

    public void setTargetWord(String targetWord) {
        this.targetWord = targetWord;
    }

    public String getTargetImageUrl() {
        return targetImageUrl;
    }

    public void setTargetImageUrl(String targetImageUrl) {
        this.targetImageUrl = targetImageUrl;
    }

    public String getTargetAudioUrl() {
        return targetAudioUrl;
    }

    public void setTargetAudioUrl(String targetAudioUrl) {
        this.targetAudioUrl = targetAudioUrl;
    }

    public List<OptionItem> getOptions() {
        return options;
    }

    public void setOptions(List<OptionItem> options) {
        this.options = options;
    }

    public static class OptionItem {
        private UUID wordId;
        private String word;
        private String imageUrl;

        public OptionItem() {
        }

        public OptionItem(UUID wordId, String word, String imageUrl) {
            this.wordId = wordId;
            this.word = word;
            this.imageUrl = imageUrl;
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

        public String getImageUrl() {
            return imageUrl;
        }

        public void setImageUrl(String imageUrl) {
            this.imageUrl = imageUrl;
        }
    }
}
