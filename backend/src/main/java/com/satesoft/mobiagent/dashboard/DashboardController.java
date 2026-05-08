package com.satesoft.mobiagent.dashboard;

import com.satesoft.mobiagent.domain.*;
import com.satesoft.mobiagent.user.User;
import com.satesoft.mobiagent.user.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {
    private final MnoAccountRepository accounts;
    private final MnoWalletRepository wallets;
    private final MnoTransactionRepository transactions;
    private final ChannelTypeRepository channelTypes;
    private final ServiceChannelRepository serviceChannels;
    private final UserRepository users;

    public DashboardController(MnoAccountRepository accounts, MnoWalletRepository wallets, MnoTransactionRepository transactions, ChannelTypeRepository channelTypes, ServiceChannelRepository serviceChannels, UserRepository users) {
        this.accounts = accounts;
        this.wallets = wallets;
        this.transactions = transactions;
        this.channelTypes = channelTypes;
        this.serviceChannels = serviceChannels;
        this.users = users;
    }

    @GetMapping("/mobi-agent")
    public DashboardStats stats(Authentication auth) {
        Long userId = currentUser(auth).getId();
        var accountList = accounts.findByUserId(userId);
        var walletList = wallets.findByUserId(userId);
        var txList = transactions.findByUserIdOrderByDateDesc(userId);
        BigDecimal emoney = accountList.stream().map(MnoAccount::getEmoneyAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal cash = accountList.stream().map(MnoAccount::getCashAtHand).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal walletBalance = emoney;
        BigDecimal deposits = txList.stream().filter(tx -> tx.getTransactionType() == TransactionType.DEPOSIT).map(MnoTransaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal withdrawals = txList.stream().filter(tx -> tx.getTransactionType() == TransactionType.FLOAT_WITHDRAWAL).map(MnoTransaction::getAmount).reduce(BigDecimal.ZERO, BigDecimal::add);
        return new DashboardStats(
                accountList.size(),
                walletList.size(),
                txList.size(),
                channelTypes.findByUserIdOrderByCreatedAtAsc(userId).size(),
                serviceChannels.findByUserIdOrderByCreatedAtAsc(userId).size(),
                emoney,
                cash,
                walletBalance,
                deposits,
                withdrawals,
                withdrawals.subtract(deposits).abs()
        );
    }

    private User currentUser(Authentication auth) { return users.findByEmail(auth.getName()).orElseThrow(); }

    public record DashboardStats(
            int accountCount,
            int walletCount,
            int transactionCount,
            int channelTypeCount,
            int serviceChannelCount,
            BigDecimal totalEmoney,
            BigDecimal totalCashAtHand,
            BigDecimal totalWalletBalance,
            BigDecimal totalDeposits,
            BigDecimal totalWithdrawals,
            BigDecimal netFloatChange
    ) {}
}
