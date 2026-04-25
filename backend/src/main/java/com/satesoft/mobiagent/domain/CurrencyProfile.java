package com.satesoft.mobiagent.domain;

import jakarta.persistence.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@Entity
public class CurrencyProfile {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long userId;
    private String countryName;
    private String countryCode;
    private String currency;
    private String currencyCode;
    private String currencySymbol;
    private Integer decimalPlaces;
    private String roundingCondition;
    private Instant updatedAt;

    @ElementCollection
    @CollectionTable(name = "currency_profile_up_rules", joinColumns = @JoinColumn(name = "profile_id"))
    private List<RoundingRule> upRules = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "currency_profile_down_rules", joinColumns = @JoinColumn(name = "profile_id"))
    private List<RoundingRule> downRules = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "currency_profile_denominations", joinColumns = @JoinColumn(name = "profile_id"))
    private List<CurrencyDenomination> denominations = new ArrayList<>();

    public Long getId() { return id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public String getCountryName() { return countryName; }
    public void setCountryName(String countryName) { this.countryName = countryName; }
    public String getCountryCode() { return countryCode; }
    public void setCountryCode(String countryCode) { this.countryCode = countryCode; }
    public String getCurrency() { return currency; }
    public void setCurrency(String currency) { this.currency = currency; }
    public String getCurrencyCode() { return currencyCode; }
    public void setCurrencyCode(String currencyCode) { this.currencyCode = currencyCode; }
    public String getCurrencySymbol() { return currencySymbol; }
    public void setCurrencySymbol(String currencySymbol) { this.currencySymbol = currencySymbol; }
    public Integer getDecimalPlaces() { return decimalPlaces; }
    public void setDecimalPlaces(Integer decimalPlaces) { this.decimalPlaces = decimalPlaces; }
    public String getRoundingCondition() { return roundingCondition; }
    public void setRoundingCondition(String roundingCondition) { this.roundingCondition = roundingCondition; }
    public Instant getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(Instant updatedAt) { this.updatedAt = updatedAt; }
    public List<RoundingRule> getUpRules() { return upRules; }
    public void setUpRules(List<RoundingRule> upRules) { this.upRules = upRules; }
    public List<RoundingRule> getDownRules() { return downRules; }
    public void setDownRules(List<RoundingRule> downRules) { this.downRules = downRules; }
    public List<CurrencyDenomination> getDenominations() { return denominations; }
    public void setDenominations(List<CurrencyDenomination> denominations) { this.denominations = denominations; }
}
