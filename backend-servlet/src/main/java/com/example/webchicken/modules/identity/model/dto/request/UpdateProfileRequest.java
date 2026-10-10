package com.example.webchicken.modules.identity.model.dto.request;

/** Cập nhật thông tin cá nhân */
public record UpdateProfileRequest(
        String fullName,
        String phone,
        String logoUrl,
        String gender,       // MALE | FEMALE | OTHER
        String dateOfBirth,  // ISO format: yyyy-MM-dd
        String email
) {
    public UpdateProfileRequest(String fullName, String phone, String logoUrl, String gender, String dateOfBirth) {
        this(fullName, phone, logoUrl, gender, dateOfBirth, null);
    }
}

