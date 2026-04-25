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

record TransactionRequest(Long walletId, TransactionType transactionType, BigDecimal amount, String agentNumber, String clientPhone, String clientName) {}

@Service
class TransactionService {
    private final MnoWalletRepository wallets; private final MnoTransactionRepository transactions; private final MnoProviderAdapter provider;
    TransactionService(MnoWalletRepository wallets, MnoTransactionRepository transactions, MnoProviderAdapter provider) { this.wallets = wallets; this.transactions = transactions; this.provider = provider; }

    @Transactional
    MnoTransaction record(TransactionRequest request, Long userId) {
        MnoWallet wallet = wallets.findById(request.walletId()).orElseThrow();
        if (!wallet.getUserId().equals(userId)) throw new IllegalArgumentException("Wallet not found");
        if (request.amount() == null || request.amount().signum() <= 0) throw new IllegalArgumentException("Amount must be positive");

        // The DOCX sequence requires previous balance, new balance, and wallet update to stay together.
        // This method is transactional so the transaction record and wallet balance are committed as one unit.
        BigDecimal previous = wallet.getBalance();
        BigDecimal next = switch (request.transactionType()) {
            case FLOAT_TOP_UP, FLOAT_WITHDRAWAL -> previous.add(request.amount());
            case DEPOSIT, FLOAT_TRANSFER -> previous.subtract(request.amount());
        };
        if (next.signum() < 0) throw new IllegalArgumentException("Insufficient wallet balance");

        MnoTransaction tx = new MnoTransaction();
        tx.setUserId(userId); tx.setWalletId(wallet.getId()); tx.setMnoWalletName(wallet.getName()); tx.setAgentNumber(request.agentNumber());
        tx.setTransactionType(request.transactionType()); tx.setAmount(request.amount()); tx.setPreviousBalance(previous); tx.setBalance(next);
        tx.setDate(Instant.now()); tx.setClientPhone(request.clientPhone()); tx.setClientName(request.clientName()); tx.setStatus(TransactionStatus.PENDING);
        tx = transactions.save(tx);
        tx.setStatus(TransactionStatus.PROCESSING);
        try {
            // The adapter is a placeholder for a future real MNO API call.
            var result = provider.recordTransaction(tx);
            if (!result.successful()) throw new IllegalStateException(result.message());
            wallet.setBalance(next); wallets.save(wallet); tx.setStatus(TransactionStatus.COMPLETED); tx.setBalance(next);
        } catch (RuntimeException ex) {
            tx.setStatus(TransactionStatus.FAILED); transactions.save(tx); throw ex;
        }
        return transactions.save(tx);
    }
}
