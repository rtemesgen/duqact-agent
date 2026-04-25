package com.satesoft.mobiagent.api;

import com.satesoft.mobiagent.auth.AuthService;
import com.satesoft.mobiagent.domain.UserSettings;
import com.satesoft.mobiagent.domain.UserSettingsRepository;
import com.satesoft.mobiagent.domain.UserTheme;
import com.satesoft.mobiagent.user.User;
import com.satesoft.mobiagent.user.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;

@RestController
@RequestMapping("/api/settings")
public class SettingsController {
    private final UserSettingsRepository settings;
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;

    public SettingsController(UserSettingsRepository settings, UserRepository users, PasswordEncoder passwordEncoder) {
        this.settings = settings; this.users = users; this.passwordEncoder = passwordEncoder;
    }

    @GetMapping("/me")
    public SettingsDto me(Authentication auth) {
        User user = currentUser(auth);
        return dto(settings.findById(user.getId()).orElseGet(() -> defaultSettings(user.getId())));
    }

    @PutMapping("/me")
    public SettingsDto save(@RequestBody SettingsRequest request, Authentication auth) {
        User user = currentUser(auth);
        UserSettings item = settings.findById(user.getId()).orElseGet(() -> defaultSettings(user.getId()));
        item.setEmailNotifications(request.emailNotifications());
        item.setPushNotifications(request.pushNotifications());
        item.setWeeklySummary(request.weeklySummary());
        item.setDisableDiscountForDebt(request.disableDiscountForDebt());
        item.setTheme(request.theme());
        item.setUpdatedAt(Instant.now());
        return dto(settings.save(item));
    }

    @PostMapping("/change-password")
    public void changePassword(@RequestBody ChangePasswordRequest request, Authentication auth) {
        User user = currentUser(auth);
        if (!passwordEncoder.matches(request.currentPassword(), user.getPasswordHash())) throw new IllegalArgumentException("Invalid current password");
        if (!request.newPassword().equals(request.confirmPassword())) throw new IllegalArgumentException("Passwords do not match");
        user.setPasswordHash(passwordEncoder.encode(request.newPassword()));
        users.save(user);
    }

    private User currentUser(Authentication auth) { return users.findByEmail(auth.getName()).orElseThrow(); }
    private UserSettings defaultSettings(Long userId) {
        UserSettings item = new UserSettings();
        item.setUserId(userId);
        item.setUpdatedAt(Instant.now());
        return settings.save(item);
    }
    private SettingsDto dto(UserSettings item) {
        return new SettingsDto(item.getUserId(), item.isEmailNotifications(), item.isPushNotifications(), item.isWeeklySummary(), item.isDisableDiscountForDebt(), item.getTheme(), item.getUpdatedAt());
    }
    public record SettingsRequest(boolean emailNotifications, boolean pushNotifications, boolean weeklySummary, boolean disableDiscountForDebt, UserTheme theme) {}
    public record SettingsDto(Long userId, boolean emailNotifications, boolean pushNotifications, boolean weeklySummary, boolean disableDiscountForDebt, UserTheme theme, Instant updatedAt) {}
    public record ChangePasswordRequest(String currentPassword, String newPassword, String confirmPassword) {}
}
