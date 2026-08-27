package com.pamana.dto;

import java.util.List;

public class SyllableSetResponse {
    private int setId;
    private String subLevel;
    private String consonant;
    private String vowel;
    private String targetSyllable;
    private List<Option> options;
    private String audioUrl;
    private String consonantAudioUrl;
    private String vowelAudioUrl;

    public SyllableSetResponse() {}

    public static class Option {
        private String id;
        private String label;

        public Option(String id, String label) {
            this.id = id;
            this.label = label;
        }

        public String getId() { return id; }
        public void setId(String id) { this.id = id; }
        public String getLabel() { return label; }
        public void setLabel(String label) { this.label = label; }
    }

    public int getSetId() { return setId; }
    public void setSetId(int setId) { this.setId = setId; }

    public String getSubLevel() { return subLevel; }
    public void setSubLevel(String subLevel) { this.subLevel = subLevel; }

    public String getConsonant() { return consonant; }
    public void setConsonant(String consonant) { this.consonant = consonant; }

    public String getVowel() { return vowel; }
    public void setVowel(String vowel) { this.vowel = vowel; }

    public String getTargetSyllable() { return targetSyllable; }
    public void setTargetSyllable(String targetSyllable) { this.targetSyllable = targetSyllable; }

    public List<Option> getOptions() { return options; }
    public void setOptions(List<Option> options) { this.options = options; }

    public String getAudioUrl() { return audioUrl; }
    public void setAudioUrl(String audioUrl) { this.audioUrl = audioUrl; }

    public String getConsonantAudioUrl() { return consonantAudioUrl; }
    public void setConsonantAudioUrl(String consonantAudioUrl) { this.consonantAudioUrl = consonantAudioUrl; }

    public String getVowelAudioUrl() { return vowelAudioUrl; }
    public void setVowelAudioUrl(String vowelAudioUrl) { this.vowelAudioUrl = vowelAudioUrl; }
}
