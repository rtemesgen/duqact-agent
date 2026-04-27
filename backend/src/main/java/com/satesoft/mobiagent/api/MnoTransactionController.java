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
import java.util.List;

@RestController
@RequestMapping("/api/mno-transactions")
class MnoTransactionController {
    private final MnoTransactionRepository transactions; private final TransactionService service; private final UserRepository users;
    MnoTransactionController(MnoTransactionRepository transactions, TransactionService service, UserRepository users) { this.transactions = transactions; this.service = service; this.users = users; }
    @GetMapping List<MnoTransaction> list(Authentication auth) { return transactions.findByUserIdOrderByDateDesc(currentUser(auth).getId()); }
    @PostMapping MnoTransaction record(@RequestBody TransactionRequest request, Authentication auth) { return service.record(request, currentUser(auth).getId()); }
    private User currentUser(Authentication auth) { return users.findByEmail(auth.getName()).orElseThrow(); }
}

record TransactionRequest(Long accountId, Long walletId, TransactionType transactionType, BigDecimal amount, String clientPhone, String clientName) {}

@Service
class TransactionService {
    private final MnoAccountRepository accounts; private final MnoWalletRepository wallets; private final MnoTransactionRepository transactions; private final MnoProviderAdapter provider;
    TransactionService(MnoAccountRepository accounts, MnoWalletRepository wallets, MnoTransactionRepository transactions, MnoProviderAdapter provider) { this.accounts = accounts; this.wallets = wallets; this.transactions = transactions; this.provider = provider; }

    @Transactional
    MnoTransaction record(TransactionRequest request, Long userId) {
        if (request.accountId() == null) throw new IllegalArgumentException("Account is required");
        if (request.amount() == null || request.amount().signum() <= 0) throw new IllegalArgumentException("Amount must be positive");
        MnoAccount account = accounts.findById(request.accountId()).orElseThrow();
        if (!account.getUserId().equals(userId)) throw new IllegalArgumentException("Account not found");
        MnoWallet wallet = resolveWallet(request, userId, account);

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
            case WITHDRAW -> {
                newCash = previousCash.subtract(request.amount());
                newEmoney = previousEmoney.add(request.amount());
                if (newCash.signum() < 0) throw new IllegalArgumentException("Insufficient cash at hand");
            }
            case FLOAT_TOP_UP -> {
                newEmoney = previousEmoney.add(request.amount());
            }
            case FLOAT_WITHDRAWAL, FLOAT_TRANSFER -> {
                newEmoney = previousEmoney.subtract(request.amount());
                if (newEmoney.signum() < 0) throw new IllegalArgumentException("Insufficient e-cash balance");
            }
        }

        MnoTransaction tx = new MnoTransaction();
        tx.setUserId(userId); tx.setAccountId(account.getId()); tx.setAccountName(account.getName());
        tx.setWalletId(wallet == null ? null : wallet.getId()); tx.setMnoWalletName(wallet == null ? null : wallet.getName()); tx.setAgentNumber(account.getAgentId());
        tx.setTransactionType(request.transactionType()); tx.setAmount(request.amount());
        tx.setPreviousEmoney(previousEmoney); tx.setNewEmoney(newEmoney); tx.setPreviousCashAtHand(previousCash); tx.setNewCashAtHand(newCash);
        tx.setPreviousBalance(previousEmoney); tx.setBalance(newEmoney);
        tx.setDate(Instant.now()); tx.setClientPhone(request.clientPhone()); tx.setClientName(request.clientName()); tx.setStatus(TransactionStatus.PENDING);
        tx = transactions.save(tx);
        tx.setStatus(TransactionStatus.PROCESSING);
        try {
            var result = provider.recordTransaction(tx);
            if (!result.successful()) throw new IllegalStateException(result.message());
            account.setEmoneyAmount(newEmoney);
            account.setCashAtHand(newCash);
            accounts.save(account);
            if (wallet != null) {
                wallet.setBalance(newEmoney);
                wallets.save(wallet);
            }
            tx.setStatus(TransactionStatus.COMPLETED);
            tx.setBalance(newEmoney);
        } catch (RuntimeException ex) {
            tx.setStatus(TransactionStatus.FAILED); transactions.save(tx); throw ex;
        }
        return transactions.save(tx);
    }

    private MnoWallet resolveWallet(TransactionRequest request, Long userId, MnoAccount account) {
        if (request.walletId() != null) {
            MnoWallet wallet = wallets.findById(request.walletId()).orElseThrow();
            if (!wallet.getUserId().equals(userId)) throw new IllegalArgumentException("Wallet not found");
            return wallet;
        }
        return wallets.findByUserId(userId).stream()
                .filter(item -> item.getAgentId() != null && item.getAgentId().equals(account.getId()))
                .findFirst()
                .orElse(null);
    }

    private BigDecimal safe(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }
}
