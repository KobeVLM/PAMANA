package com.pamana.auth.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public class UpdateProfileRequest {

    @NotBlank(message = "Name cannot be empty")
    @Size(max = 100, message = "Name must be less than 100 characters")
    private String name;

    @Pattern(regexp = "^(Lalaki|Babae)$", message = "Gender must be either 'Lalaki' or 'Babae'")
    @Size(max = 20)
    private String gender;

    public UpdateProfileRequest() {
    }

    public UpdateProfileRequest(String name, String gender) {
        this.name = name;
        this.gender = gender;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getGender() {
        return gender;
    }

    public void setGender(String gender) {
        this.gender = gender;
    }
}
