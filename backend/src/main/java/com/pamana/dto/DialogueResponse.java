package com.pamana.dto;

import java.util.List;
import java.util.UUID;

public class DialogueResponse {
    private UUID wordId;
    private String sentenceTemplate;
    private String correctWord;
    private List<String> options;
    private String audioUrl;

    public DialogueResponse() {
    }

    public DialogueResponse(UUID wordId, String sentenceTemplate, String correctWord, List<String> options, String audioUrl) {
        this.wordId = wordId;
        this.sentenceTemplate = sentenceTemplate;
        this.correctWord = correctWord;
        this.options = options;
        this.audioUrl = audioUrl;
    }

    // Getters and Setters
    public UUID getWordId() {
        return wordId;
    }

    public void setWordId(UUID wordId) {
        this.wordId = wordId;
    }

    public String getSentenceTemplate() {
        return sentenceTemplate;
    }

    public void setSentenceTemplate(String sentenceTemplate) {
        this.sentenceTemplate = sentenceTemplate;
    }

    public String getCorrectWord() {
        return correctWord;
    }

    public void setCorrectWord(String correctWord) {
        this.correctWord = correctWord;
    }

    public List<String> getOptions() {
        return options;
    }

    public void setOptions(List<String> options) {
        this.options = options;
    }

    public String getAudioUrl() {
        return audioUrl;
    }

    public void setAudioUrl(String audioUrl) {
        this.audioUrl = audioUrl;
    }
}
