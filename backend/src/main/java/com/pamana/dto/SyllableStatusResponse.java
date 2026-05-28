package com.pamana.dto;

public class SyllableStatusResponse {

    private double pagsamaAccuracy;
    private double pakingganAccuracy;
    private double kilalaninAccuracy;
    private double rhymingAccuracy;
    private double module1Accuracy;
    private boolean isComplete;
    private boolean module2Unlocked;

    public SyllableStatusResponse() {
    }

    public SyllableStatusResponse(double pagsamaAccuracy, double pakingganAccuracy, 
                                  double kilalaninAccuracy, double rhymingAccuracy, 
                                  double module1Accuracy, boolean isComplete, boolean module2Unlocked) {
        this.pagsamaAccuracy = pagsamaAccuracy;
        this.pakingganAccuracy = pakingganAccuracy;
        this.kilalaninAccuracy = kilalaninAccuracy;
        this.rhymingAccuracy = rhymingAccuracy;
        this.module1Accuracy = module1Accuracy;
        this.isComplete = isComplete;
        this.module2Unlocked = module2Unlocked;
    }

    // Getters and Setters
    public double getPagsamaAccuracy() {
        return pagsamaAccuracy;
    }

    public void setPagsamaAccuracy(double pagsamaAccuracy) {
        this.pagsamaAccuracy = pagsamaAccuracy;
    }

    public double getPakingganAccuracy() {
        return pakingganAccuracy;
    }

    public void setPakingganAccuracy(double pakingganAccuracy) {
        this.pakingganAccuracy = pakingganAccuracy;
    }

    public double getKilalaninAccuracy() {
        return kilalaninAccuracy;
    }

    public void setKilalaninAccuracy(double kilalaninAccuracy) {
        this.kilalaninAccuracy = kilalaninAccuracy;
    }

    public double getRhymingAccuracy() {
        return rhymingAccuracy;
    }

    public void setRhymingAccuracy(double rhymingAccuracy) {
        this.rhymingAccuracy = rhymingAccuracy;
    }

    public double getModule1Accuracy() {
        return module1Accuracy;
    }

    public void setModule1Accuracy(double module1Accuracy) {
        this.module1Accuracy = module1Accuracy;
    }

    public boolean isComplete() {
        return isComplete;
    }

    public void setComplete(boolean complete) {
        isComplete = complete;
    }

    public boolean isModule2Unlocked() {
        return module2Unlocked;
    }

    public void setModule2Unlocked(boolean module2Unlocked) {
        this.module2Unlocked = module2Unlocked;
    }
}
