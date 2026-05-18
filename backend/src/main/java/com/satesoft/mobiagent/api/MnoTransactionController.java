package com.satesoft.mobiagent.api;

import com.satesoft.mobiagent.domain.*;
import com.satesoft.mobiagent.mno.MnoProviderAdapter;
import com.satesoft.mobiagent.user.User;
import com.satesoft.mobiagent.user.UserRepository;
import jakarta.transaction.Transactional;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.Locale;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@RestController
@RequestMapping("/api/mno-transactions")
class MnoTransactionController {
    private final MnoTransactionRepository transactions; private final TransactionService service; private final UserRepository users;
    MnoTransactionController(MnoTransactionRepository transactions, TransactionService service, UserRepository users) { this.transactions = transactions; this.service = service; this.users = users; }
    @GetMapping List<MnoTransaction> list(Authentication auth) { return transactions.findByUserIdOrderByDateDesc(currentUser(auth).getId()); }
    @PostMapping MnoTransaction record(@RequestBody TransactionRequest request, Authentication auth) { return service.record(request, currentUser(auth).getId()); }
    private User currentUser(Authentication auth) { return users.findByEmail(auth.getName()).orElseThrow(); }
}

record TransactionRequest(Long accountId, TransactionType transactionType, BigDecimal amount, String clientPhone, String clientId, String transactionId) {}

@Service
class TransactionService {
    private final MnoAccountRepository accounts; private final MnoTransactionRepository transactions; private final MnoProviderAdapter provider;
    private final Map<String, Instant> recentFingerprints = new ConcurrentHashMap<>();
    private static final long DUPLICATE_WINDOW_SECONDS = 10;
    TransactionService(MnoAccountRepository accounts, MnoTransactionRepository transactions, MnoProviderAdapter provider) { this.accounts = accounts; this.transactions = transactions; this.provider = provider; }

    @Transactional
    MnoTransaction record(TransactionRequest request, Long userId) {
        if (request.accountId() == null) throw new IllegalArgumentException("Account is required");
        if (request.transactionType() == null) throw new IllegalArgumentException("Transaction type is required");
        if (request.amount() == null || request.amount().signum() <= 0) throw new IllegalArgumentException("Amount must be positive");
        String fingerprint = fingerprint(request, userId);
        reserveFingerprint(fingerprint);
        MnoAccount account = accounts.findById(request.accountId()).orElseThrow();
        if (!account.getUserId().equals(userId)) throw new IllegalArgumentException("Account not found");

        BigDecimal previousEmoney = safe(account.getEmoneyAmount());
        BigDecimal previousCash = safe(account.getCashAtHand());
        BigDecimal newEmoney = previousEmoney;
        BigDecimal newCash = previousCash;

        switch (request.transactionType()) {
            case DEPOSIT -> {
                newEmoney = previousEmoney.subtract(request.amount());
                newCash = previousCash.add(request.amount());
                if (newEmoney.signum() < 0) throw new IllegalArgumentException("Insufficient e-cash balance");
            }
            case FLOAT_WITHDRAWAL -> {
                newCash = previousCash.subtract(request.amount());
                newEmoney = previousEmoney.add(request.amount());
                if (newCash.signum() < 0) throw new IllegalArgumentException("Insufficient cash at hand");
            }
            case FLOAT_TOP_UP -> {
                newEmoney = previousEmoney.add(request.amount());
            }
            case FLOAT_TRANSFER -> {
                newEmoney = previousEmoney.subtract(request.amount());
                if (newEmoney.signum() < 0) throw new IllegalArgumentException("Insufficient e-cash balance");
            }
        }

        MnoTransaction tx = new MnoTransaction();
        tx.setUserId(userId); tx.setAccountId(account.getId()); tx.setAccountName(account.getName());
        tx.setWalletId(null); tx.setMnoWalletName(null); tx.setAgentNumber(account.getAgentId());
        tx.setTransactionType(request.transactionType()); tx.setAmount(request.amount());
        tx.setPreviousEmoney(previousEmoney); tx.setNewEmoney(newEmoney); tx.setPreviousCashAtHand(previousCash); tx.setNewCashAtHand(newCash);
        tx.setPreviousBalance(previousEmoney); tx.setBalance(newEmoney);
        tx.setDate(Instant.now()); tx.setClientPhone(request.clientPhone()); tx.setClientId(request.clientId());
        tx.setClientName(request.clientId());
        tx.setTransactionId(request.transactionId());
        tx.setStatus(TransactionStatus.PENDING);
        tx = transactions.save(tx);
        tx.setStatus(TransactionStatus.PROCESSING);
        try {
            var result = provider.recordTransaction(tx);
            if (!result.successful()) throw new IllegalStateException(result.message());
            account.setEmoneyAmount(newEmoney);
            account.setCashAtHand(newCash);
            accounts.save(account);
            tx.setStatus(TransactionStatus.COMPLETED);
            tx.setBalance(newEmoney);
            recentFingerprints.put(fingerprint, Instant.now());
        } catch (RuntimeException ex) {
            tx.setStatus(TransactionStatus.FAILED); transactions.save(tx); recentFingerprints.remove(fingerprint); throw ex;
        }
        return transactions.save(tx);
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
    private void reserveFingerprint(String fingerprint) {
        cleanupFingerprints();
        Instant now = Instant.now();
        Instant existing = recentFingerprints.putIfAbsent(fingerprint, now);
        if (existing != null && existing.plusSeconds(DUPLICATE_WINDOW_SECONDS).isAfter(now)) {
            throw new IllegalStateException("Duplicate transaction request detected. Please wait for the current save to finish.");
        }
        recentFingerprints.put(fingerprint, now);
    }
    private void cleanupFingerprints() {
        Instant cutoff = Instant.now().minusSeconds(DUPLICATE_WINDOW_SECONDS);
        recentFingerprints.entrySet().removeIf(entry -> entry.getValue().isBefore(cutoff));
    }
    private String fingerprint(TransactionRequest request, Long userId) {
        return userId + "|" +
                request.accountId() + "|" +
                request.transactionType() + "|" +
                request.amount().stripTrailingZeros().toPlainString() + "|" +
                normalized(request.clientPhone()) + "|" +
                normalized(request.clientId()) + "|" +
                normalized(request.transactionId());
    }
    private String normalized(String value) {
        return value == null ? "" : value.trim().toLowerCase(Locale.ROOT);
    }
}
