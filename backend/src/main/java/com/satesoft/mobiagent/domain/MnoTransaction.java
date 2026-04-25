package com.satesoft.mobiagent.domain;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.Instant;

@Entity
public class MnoTransaction {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) private Long id;
    private Long userId; private Long walletId; private String mnoWalletName; private String agentNumber;
    @Enumerated(EnumType.STRING) private TransactionType transactionType;
    private BigDecimal amount; private BigDecimal previousBalance; private BigDecimal balance; private Instant date;
    private String clientPhone; private String clientName;
    @Enumerated(EnumType.STRING) private TransactionStatus status;
    public Long getId() { return id; } public Long getUserId() { return userId; } public void setUserId(Long userId) { this.userId = userId; }
    public Long getWalletId() { return walletId; } public void setWalletId(Long walletId) { this.walletId = walletId; } public String getMnoWalletName() { return mnoWalletName; } public void setMnoWalletName(String mnoWalletName) { this.mnoWalletName = mnoWalletName; }
    public String getAgentNumber() { return agentNumber; } public void setAgentNumber(String agentNumber) { this.agentNumber = agentNumber; } public TransactionType getTransactionType() { return transactionType; } public void setTransactionType(TransactionType transactionType) { this.transactionType = transactionType; }
    public BigDecimal getAmount() { return amount; } public void setAmount(BigDecimal amount) { this.amount = amount; } public BigDecimal getPreviousBalance() { return previousBalance; } public void setPreviousBalance(BigDecimal previousBalance) { this.previousBalance = previousBalance; }
    public BigDecimal getBalance() { return balance; } public void setBalance(BigDecimal balance) { this.balance = balance; } public Instant getDate() { return date; } public void setDate(Instant date) { this.date = date; }
    public String getClientPhone() { return clientPhone; } public void setClientPhone(String clientPhone) { this.clientPhone = clientPhone; } public String getClientName() { return clientName; } public void setClientName(String clientName) { this.clientName = clientName; }
    public TransactionStatus getStatus() { return status; } public void setStatus(TransactionStatus status) { this.status = status; }
}
