package com.pamana.dto;

public class ModuleAccuracy {
    private int moduleNumber;
    private String moduleName;
    private double accuracy;

    public ModuleAccuracy() {
    }

    public ModuleAccuracy(int moduleNumber, String moduleName, double accuracy) {
        this.moduleNumber = moduleNumber;
        this.moduleName = moduleName;
        this.accuracy = accuracy;
    }

    // Getters and Setters
    public int getModuleNumber() {
        return moduleNumber;
    }

    public void setModuleNumber(int moduleNumber) {
        this.moduleNumber = moduleNumber;
    }

    public String getModuleName() {
        return moduleName;
    }

    public void setModuleName(String moduleName) {
        this.moduleName = moduleName;
    }

    public double getAccuracy() {
        return accuracy;
    }

    public void setAccuracy(double accuracy) {
        this.accuracy = accuracy;
    }
}
