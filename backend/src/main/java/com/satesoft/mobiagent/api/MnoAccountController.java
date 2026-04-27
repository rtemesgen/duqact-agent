package com.satesoft.mobiagent.api;

import com.satesoft.mobiagent.domain.*;
import com.satesoft.mobiagent.user.User;
import com.satesoft.mobiagent.user.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@RestController
@RequestMapping("/api/mno-accounts")
public class MnoAccountController {
    private final MnoAccountRepository accounts; private final UserRepository users;
    public MnoAccountController(MnoAccountRepository accounts, UserRepository users) { this.accounts = accounts; this.users = users; }
    @GetMapping public List<MnoAccount> list(Authentication auth) { return accounts.findByUserId(currentUser(auth).getId()); }
    @PostMapping public MnoAccount create(@RequestBody MnoAccount account, Authentication auth) { account.setUserId(currentUser(auth).getId()); validate(account); return accounts.save(account); }
    @PutMapping("/{id}") public MnoAccount update(@PathVariable Long id, @RequestBody MnoAccount input, Authentication auth) { MnoAccount a = owned(id, auth); copy(input, a); validate(a); return accounts.save(a); }
    @DeleteMapping("/{id}") public void delete(@PathVariable Long id, Authentication auth) { accounts.delete(owned(id, auth)); }
    private void copy(MnoAccount in, MnoAccount a) {
        a.setName(in.getName());
        a.setCountry(in.getCountry());
        a.setMobileNumber(in.getMobileNumber());
        a.setAgentId(in.getAgentId());
        a.setEmoneyAmount(nz(in.getEmoneyAmount()));
        a.setNetwork(in.getNetwork());
        a.setCashAtHand(nz(in.getCashAtHand()));
        a.setAccountType(in.getAccountType());
        a.setCurrency(in.getCurrency());
        a.setOpeningBalance(nz(in.getOpeningBalance()));
        a.setRemarks(in.getRemarks());
    }
    private BigDecimal nz(BigDecimal value) { return value == null ? BigDecimal.ZERO : value; }
    private void validate(MnoAccount account) {
        if (nz(account.getEmoneyAmount()).signum() < 0) throw new IllegalArgumentException("E-money cannot be negative");
        if (nz(account.getCashAtHand()).signum() < 0) throw new IllegalArgumentException("Cash at hand cannot be negative");
        if (nz(account.getOpeningBalance()).signum() < 0) throw new IllegalArgumentException("Opening balance cannot be negative");
    }
    private MnoAccount owned(Long id, Authentication auth) { Long userId = currentUser(auth).getId(); MnoAccount a = accounts.findById(id).orElseThrow(); if (!a.getUserId().equals(userId)) throw new IllegalArgumentException("Not found"); return a; }
    private User currentUser(Authentication auth) { return users.findByEmail(auth.getName()).orElseThrow(); }
}
