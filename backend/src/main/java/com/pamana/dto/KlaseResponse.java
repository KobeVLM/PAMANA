package com.pamana.dto;

import java.util.UUID;

public class KlaseResponse {
    private UUID id;
    private String name;
    private String joinCode;
    private UUID teacherId;

    public KlaseResponse() {}

    public KlaseResponse(UUID id, String name, String joinCode, UUID teacherId) {
        this.id = id;
        this.name = name;
        this.joinCode = joinCode;
        this.teacherId = teacherId;
    }

    public UUID getId() {
        return id;
    }

    public void setId(UUID id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getJoinCode() {
        return joinCode;
    }

    public void setJoinCode(String joinCode) {
        this.joinCode = joinCode;
    }

    public UUID getTeacherId() {
        return teacherId;
    }

    public void setTeacherId(UUID teacherId) {
        this.teacherId = teacherId;
    }
}
