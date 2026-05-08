package com.satesoft.mobiagent.api;

import com.satesoft.mobiagent.domain.*;
import com.satesoft.mobiagent.user.User;
import com.satesoft.mobiagent.user.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/mno-accounts")
public class MnoAccountController {
    private final MnoAccountRepository accounts; private final UserRepository users; private final ServiceChannelRepository serviceChannels; private final ChannelTypeRepository channelTypes;
    public MnoAccountController(MnoAccountRepository accounts, UserRepository users, ServiceChannelRepository serviceChannels, ChannelTypeRepository channelTypes) { this.accounts = accounts; this.users = users; this.serviceChannels = serviceChannels; this.channelTypes = channelTypes; }
    @GetMapping public List<MnoAccount> list(Authentication auth) { return accounts.findByUserId(currentUser(auth).getId()); }
    @PostMapping public MnoAccount create(@RequestBody MnoAccount account, Authentication auth) { Long userId = currentUser(auth).getId(); account.setUserId(userId); hydrateFromServiceChannel(account, userId, true); validate(account); return accounts.save(account); }
    @PutMapping("/{id}") public MnoAccount update(@PathVariable Long id, @RequestBody MnoAccount input, Authentication auth) { Long userId = currentUser(auth).getId(); MnoAccount a = owned(id, auth); copy(input, a); hydrateFromServiceChannel(a, userId, false); validate(a); return accounts.save(a); }
    @DeleteMapping("/{id}") public void delete(@PathVariable Long id, Authentication auth) { accounts.delete(owned(id, auth)); }
    private void copy(MnoAccount in, MnoAccount a) {
        a.setServiceChannelId(in.getServiceChannelId());
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
    private void hydrateFromServiceChannel(MnoAccount account, Long userId, boolean requireSelection) {
        ServiceChannel service = resolveServiceChannel(account, userId);
        if (service == null) {
            if (requireSelection || account.getServiceChannelId() != null) throw new IllegalArgumentException("Service channel is required");
            return;
        }
        account.setServiceChannelId(service.getId());
        account.setNetwork(service.getChannelName());
        account.setCountry(service.getCountry());
        String channelTypeName = channelTypes.findById(service.getChannelTypeId()).map(ChannelType::getName).orElse("");
        account.setAccountType(channelTypeName);
    }
    private ServiceChannel resolveServiceChannel(MnoAccount account, Long userId) {
        if (account.getServiceChannelId() != null) {
            ServiceChannel service = serviceChannels.findById(account.getServiceChannelId()).orElseThrow(() -> new IllegalArgumentException("Service channel not found"));
            if (!userId.equals(service.getUserId())) throw new IllegalArgumentException("Service channel not found");
            return service;
        }
        if (blank(account.getNetwork())) return null;
        return serviceChannels.findByUserIdOrderByCreatedAtAsc(userId).stream()
                .filter(service -> equalsIgnoreCase(service.getChannelName(), account.getNetwork()))
                .filter(service -> blank(account.getCountry()) || equalsIgnoreCase(service.getCountry(), account.getCountry()))
                .findFirst()
                .orElse(null);
    }
    private boolean blank(String value) { return value == null || value.isBlank(); }
    private boolean equalsIgnoreCase(String left, String right) { return left != null && right != null && left.equalsIgnoreCase(right); }
    private BigDecimal nz(BigDecimal value) { return value == null ? BigDecimal.ZERO : value; }
    private void validate(MnoAccount account) {
        if (account.getName() == null || account.getName().isBlank()) throw new IllegalArgumentException("Account name is required");
        if (account.getMobileNumber() == null || account.getMobileNumber().isBlank()) throw new IllegalArgumentException("Account number is required");
        if (nz(account.getEmoneyAmount()).signum() < 0) throw new IllegalArgumentException("E-money cannot be negative");
        if (nz(account.getCashAtHand()).signum() < 0) throw new IllegalArgumentException("Cash at hand cannot be negative");
        if (nz(account.getOpeningBalance()).signum() < 0) throw new IllegalArgumentException("Opening balance cannot be negative");
    }
    private MnoAccount owned(Long id, Authentication auth) { Long userId = currentUser(auth).getId(); MnoAccount a = accounts.findById(id).orElseThrow(); if (!a.getUserId().equals(userId)) throw new IllegalArgumentException("Not found"); return a; }
    private User currentUser(Authentication auth) { return users.findByEmail(auth.getName()).orElseThrow(); }
}
