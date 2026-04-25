package com.satesoft.mobiagent.api;

import com.satesoft.mobiagent.domain.*;
import com.satesoft.mobiagent.user.User;
import com.satesoft.mobiagent.user.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/mno-wallets")
public class MnoWalletController {
    private final MnoWalletRepository wallets; private final UserRepository users;
    public MnoWalletController(MnoWalletRepository wallets, UserRepository users) { this.wallets = wallets; this.users = users; }
    @GetMapping public List<MnoWallet> list(Authentication auth) { return wallets.findByUserId(currentUser(auth).getId()); }
    @PostMapping public MnoWallet create(@RequestBody MnoWallet wallet, Authentication auth) { wallet.setUserId(currentUser(auth).getId()); if (wallet.getBalance() == null) wallet.setBalance(BigDecimal.ZERO); return wallets.save(wallet); }
    @PutMapping("/{id}") public MnoWallet update(@PathVariable Long id, @RequestBody MnoWallet input, Authentication auth) { MnoWallet w = owned(id, auth); w.setAgentId(input.getAgentId()); w.setName(input.getName()); w.setNetwork(input.getNetwork()); w.setBalance(input.getBalance() == null ? BigDecimal.ZERO : input.getBalance()); return wallets.save(w); }
    @DeleteMapping("/{id}") public void delete(@PathVariable Long id, Authentication auth) { wallets.delete(owned(id, auth)); }
    private MnoWallet owned(Long id, Authentication auth) { Long userId = currentUser(auth).getId(); MnoWallet w = wallets.findById(id).orElseThrow(); if (!w.getUserId().equals(userId)) throw new IllegalArgumentException("Not found"); return w; }
    private User currentUser(Authentication auth) { return users.findByEmail(auth.getName()).orElseThrow(); }
}
