package com.ecom.userservice.dto;

import java.util.UUID;

public record LoginResponse(
    String accessToken,
    String tokenType,
    UUID userId,
    String email,
    String role
) {
    public LoginResponse(String accessToken, UUID userId, String email, String role) {
        this(accessToken, "Bearer", userId, email, role);
    }
}
