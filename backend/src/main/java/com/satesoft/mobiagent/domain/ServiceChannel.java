package com.satesoft.mobiagent.domain;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "service_channels")
public class ServiceChannel {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private Long userId;
    private Long channelTypeId;
    @Column(nullable = false)
    private String channelName;
    @Column(nullable = false)
    private String country;
    @Column(nullable = false)
    private Boolean active = true;
    @Column(nullable = false)
    private Instant createdAt = Instant.now();
    private String createdByName;

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getChannelTypeId() { return channelTypeId; }
    public void setChannelTypeId(Long channelTypeId) { this.channelTypeId = channelTypeId; }
    public String getChannelName() { return channelName; }
    public void setChannelName(String channelName) { this.channelName = channelName; }
    public String getCountry() { return country; }
    public void setCountry(String country) { this.country = country; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public String getCreatedByName() { return createdByName; }
    public void setCreatedByName(String createdByName) { this.createdByName = createdByName; }
}
