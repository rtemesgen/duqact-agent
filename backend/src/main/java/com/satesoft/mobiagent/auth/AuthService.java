package com.satesoft.mobiagent.auth;

import com.satesoft.mobiagent.user.Role;
import com.satesoft.mobiagent.user.User;
import com.satesoft.mobiagent.user.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserRepository users, PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public String hashPassword(String raw) {
        return passwordEncoder.encode(raw);
    }

    public AuthDtos.LoginResponse login(AuthDtos.LoginRequest request) {
        User user = users.findByEmail(request.email()).orElseThrow(() -> new IllegalArgumentException("Invalid credentials"));
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new IllegalArgumentException("Invalid credentials");
        }
        return response(user);
    }

    public AuthDtos.LoginResponse register(AuthDtos.RegisterRequest request) {
        users.findByEmail(request.email()).ifPresent(user -> {
            throw new IllegalArgumentException("Email is already registered");
        });
        User user = users.save(new User(request.name(), request.email(), hashPassword(request.password()), Role.MOBI_AGENT));
        return response(user);
    }

    private AuthDtos.LoginResponse response(User user) {
        return new AuthDtos.LoginResponse(jwtService.generate(user), user.getId(), user.getName(), user.getEmail(), user.getRole());
    }
}
