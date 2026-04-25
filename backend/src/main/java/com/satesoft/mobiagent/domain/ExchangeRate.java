package com.satesoft.mobiagent.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
public class ExchangeRate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private String fromCurrency; private String toCurrency; private BigDecimal rate; private Instant updatedAt;
    public Long getId() { return id; } public String getFromCurrency() { return fromCurrency; } public void setFromCurrency(String fromCurrency) { this.fromCurrency = fromCurrency; }
    public String getToCurrency() { return toCurrency; } public void setToCurrency(String toCurrency) { this.toCurrency = toCurrency; } public BigDecimal getRate() { return rate; } public void setRate(BigDecimal rate) { this.rate = rate; }
    public Instant getUpdatedAt() { return updatedAt; } public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
}
