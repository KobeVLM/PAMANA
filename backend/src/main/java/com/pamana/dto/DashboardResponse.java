package com.pamana.dto;

import com.pamana.model.SessionLog;
import java.util.List;

public class DashboardResponse {
    private List<ModuleAccuracy> accuracyTrend;
    private int masteredCount;
    private int needsReviewCount;
    private double hamonPassRate;
    private double avgSessionDuration;
    private double trailCompletion;
    private List<WordMasteryStatus> wordMasteryList;
    private List<SessionLog> sessionHistory;

    public DashboardResponse() {
    }

    public DashboardResponse(List<ModuleAccuracy> accuracyTrend, int masteredCount, int needsReviewCount, double hamonPassRate, double avgSessionDuration, double trailCompletion, List<WordMasteryStatus> wordMasteryList, List<SessionLog> sessionHistory) {
        this.accuracyTrend = accuracyTrend;
        this.masteredCount = masteredCount;
        this.needsReviewCount = needsReviewCount;
        this.hamonPassRate = hamonPassRate;
        this.avgSessionDuration = avgSessionDuration;
        this.trailCompletion = trailCompletion;
        this.wordMasteryList = wordMasteryList;
        this.sessionHistory = sessionHistory;
    }

    // Getters and Setters
    public List<ModuleAccuracy> getAccuracyTrend() {
        return accuracyTrend;
    }

    public void setAccuracyTrend(List<ModuleAccuracy> accuracyTrend) {
        this.accuracyTrend = accuracyTrend;
    }

    public int getMasteredCount() {
        return masteredCount;
    }

    public void setMasteredCount(int masteredCount) {
        this.masteredCount = masteredCount;
    }

    public int getNeedsReviewCount() {
        return needsReviewCount;
    }

    public void setNeedsReviewCount(int needsReviewCount) {
        this.needsReviewCount = needsReviewCount;
    }

    public double getHamonPassRate() {
        return hamonPassRate;
    }

    public void setHamonPassRate(double hamonPassRate) {
        this.hamonPassRate = hamonPassRate;
    }

    public double getAvgSessionDuration() {
        return avgSessionDuration;
    }

    public void setAvgSessionDuration(double avgSessionDuration) {
        this.avgSessionDuration = avgSessionDuration;
    }

    public double getTrailCompletion() {
        return trailCompletion;
    }

    public void setTrailCompletion(double trailCompletion) {
        this.trailCompletion = trailCompletion;
    }

    public List<WordMasteryStatus> getWordMasteryList() {
        return wordMasteryList;
    }

    public void setWordMasteryList(List<WordMasteryStatus> wordMasteryList) {
        this.wordMasteryList = wordMasteryList;
    }

    public List<SessionLog> getSessionHistory() {
        return sessionHistory;
    }

    public void setSessionHistory(List<SessionLog> sessionHistory) {
        this.sessionHistory = sessionHistory;
    }
}
