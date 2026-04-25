package com.satesoft.mobiagent.auth;

import com.satesoft.mobiagent.user.Role;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AuthDtos {
    public record LoginRequest(@Email String email, @NotBlank String password) {}
    public record RegisterRequest(@NotBlank String name, @Email String email, @Size(min = 6) String password) {}
    public record LoginResponse(String token, Long userId, String name, String email, Role role) {}
}
