package com.satesoft.mobiagent.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
public class MnoWallet {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long userId; private Long agentId; private String name; private String network; private BigDecimal balance = BigDecimal.ZERO;
    @Version private Long version;
    public Long getId() { return id; } public Long getUserId() { return userId; } public void setUserId(Long userId) { this.userId = userId; }
    public Long getAgentId() { return agentId; } public void setAgentId(Long agentId) { this.agentId = agentId; } public String getName() { return name; } public void setName(String name) { this.name = name; }
    public String getNetwork() { return network; } public void setNetwork(String network) { this.network = network; } public BigDecimal getBalance() { return balance; } public void setBalance(BigDecimal balance) { this.balance = balance; }
}
