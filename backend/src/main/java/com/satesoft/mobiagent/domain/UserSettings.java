package com.satesoft.mobiagent.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
public class UserSettings {
    @Id
    private Long userId;
    private boolean emailNotifications = true;
    private boolean pushNotifications;
    private boolean weeklySummary = true;
    private boolean disableDiscountForDebt = true;
    @Enumerated(EnumType.STRING)
    private UserTheme theme = UserTheme.DARK;
    private Instant updatedAt;

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public boolean isEmailNotifications() { return emailNotifications; }
    public void setEmailNotifications(boolean emailNotifications) { this.emailNotifications = emailNotifications; }
    public boolean isPushNotifications() { return pushNotifications; }
    public void setPushNotifications(boolean pushNotifications) { this.pushNotifications = pushNotifications; }
    public boolean isWeeklySummary() { return weeklySummary; }
    public void setWeeklySummary(boolean weeklySummary) { this.weeklySummary = weeklySummary; }
    public boolean isDisableDiscountForDebt() { return disableDiscountForDebt; }
    public void setDisableDiscountForDebt(boolean disableDiscountForDebt) { this.disableDiscountForDebt = disableDiscountForDebt; }
    public UserTheme getTheme() { return theme; }
    public void setTheme(UserTheme theme) { this.theme = theme; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
