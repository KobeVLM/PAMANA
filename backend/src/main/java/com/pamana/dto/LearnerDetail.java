package com.pamana.dto;

import java.util.List;
import java.util.UUID;

public class LearnerDetail {
    private UUID learnerId;
    private String learnerName;
    private int modulesCompleted;
    private double hamonPassRate;
    private int atRiskWordCount;
    private List<WordMasteryStatus> wordMasteryList;

    public LearnerDetail() {}

    public UUID getLearnerId() {
        return learnerId;
    }

    public void setLearnerId(UUID learnerId) {
        this.learnerId = learnerId;
    }

    public String getLearnerName() {
        return learnerName;
    }

    public void setLearnerName(String learnerName) {
        this.learnerName = learnerName;
    }

    public int getModulesCompleted() {
        return modulesCompleted;
    }

    public void setModulesCompleted(int modulesCompleted) {
        this.modulesCompleted = modulesCompleted;
    }

    public double getHamonPassRate() {
        return hamonPassRate;
    }

    public void setHamonPassRate(double hamonPassRate) {
        this.hamonPassRate = hamonPassRate;
    }

    public int getAtRiskWordCount() {
        return atRiskWordCount;
    }

    public void setAtRiskWordCount(int atRiskWordCount) {
        this.atRiskWordCount = atRiskWordCount;
    }

    public List<WordMasteryStatus> getWordMasteryList() {
        return wordMasteryList;
    }

    public void setWordMasteryList(List<WordMasteryStatus> wordMasteryList) {
        this.wordMasteryList = wordMasteryList;
    }
}
