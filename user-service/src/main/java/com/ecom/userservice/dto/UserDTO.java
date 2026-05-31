package com.ecom.userservice.dto;

import com.ecom.userservice.entity.Role;
import com.ecom.userservice.entity.User;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.time.LocalDateTime;
import java.util.UUID;

public record UserDTO(
    UUID id,
    @NotBlank @Email String email,
    @NotBlank @Size(max = 50) String firstName,
    @NotBlank @Size(max = 50) String lastName,
    Role role,
    boolean enabled,
    LocalDateTime createdAt
) {
    public static UserDTO from(User user) {
        return new UserDTO(
            user.getId(),
            user.getEmail(),
            user.getFirstName(),
            user.getLastName(),
            user.getRole(),
            user.isEnabled(),
            user.getCreatedAt()
        );
    }
}
