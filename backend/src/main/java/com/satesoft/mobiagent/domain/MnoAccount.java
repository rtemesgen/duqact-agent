package com.satesoft.mobiagent.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
public class MnoAccount {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long userId; private String name; private String country; private String mobileNumber; private String agentId;
    private BigDecimal emoneyAmount = BigDecimal.ZERO; private String network; private BigDecimal cashAtHand = BigDecimal.ZERO; private String accountType;
    private String currency; private BigDecimal openingBalance = BigDecimal.ZERO; private String remarks;
    public Long getId() { return id; } public Long getUserId() { return userId; } public void setUserId(Long userId) { this.userId = userId; }
    public String getName() { return name; } public void setName(String name) { this.name = name; } public String getCountry() { return country; } public void setCountry(String country) { this.country = country; }
    public String getMobileNumber() { return mobileNumber; } public void setMobileNumber(String mobileNumber) { this.mobileNumber = mobileNumber; } public BigDecimal getEmoneyAmount() { return emoneyAmount; } public void setEmoneyAmount(BigDecimal emoneyAmount) { this.emoneyAmount = emoneyAmount; }
    public String getAgentId() { return agentId; } public void setAgentId(String agentId) { this.agentId = agentId; }
    public String getNetwork() { return network; } public void setNetwork(String network) { this.network = network; } public BigDecimal getCashAtHand() { return cashAtHand; } public void setCashAtHand(BigDecimal cashAtHand) { this.cashAtHand = cashAtHand; }
    public String getAccountType() { return accountType; } public void setAccountType(String accountType) { this.accountType = accountType; }
    public String getCurrency() { return currency; } public void setCurrency(String currency) { this.currency = currency; }
    public BigDecimal getOpeningBalance() { return openingBalance; } public void setOpeningBalance(BigDecimal openingBalance) { this.openingBalance = openingBalance; }
    public String getRemarks() { return remarks; } public void setRemarks(String remarks) { this.remarks = remarks; }
}
