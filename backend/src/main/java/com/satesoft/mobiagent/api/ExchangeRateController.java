package com.satesoft.mobiagent.api;

import com.satesoft.mobiagent.domain.CurrencyDenomination;
import com.satesoft.mobiagent.domain.CurrencyProfile;
import com.satesoft.mobiagent.domain.CurrencyProfileRepository;
import com.satesoft.mobiagent.domain.ExchangeRate;
import com.satesoft.mobiagent.domain.ExchangeRateRepository;
import com.satesoft.mobiagent.domain.RoundingRule;
import com.satesoft.mobiagent.user.User;
import com.satesoft.mobiagent.user.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/exchange-rates")
public class ExchangeRateController {
    private final ExchangeRateRepository rates;
    private final CurrencyProfileRepository profiles;
    private final UserRepository users;

    public ExchangeRateController(ExchangeRateRepository rates, CurrencyProfileRepository profiles, UserRepository users) {
        this.rates = rates;
        this.profiles = profiles;
        this.users = users;
    }

    @GetMapping
    public List<ExchangeRate> list() { return rates.findAll(); }

    @PostMapping
    public ExchangeRate create(@RequestBody ExchangeRate rate) {
        rate.setUpdatedAt(Instant.now());
        return rates.save(rate);
    }

    @PutMapping("/{id}")
    public ExchangeRate update(@PathVariable Long id, @RequestBody ExchangeRate input) {
        ExchangeRate r = rates.findById(id).orElseThrow();
        r.setFromCurrency(input.getFromCurrency());
        r.setToCurrency(input.getToCurrency());
        r.setRate(input.getRate());
        r.setUpdatedAt(Instant.now());
        return rates.save(r);
    }

    @DeleteMapping("/{id}")
    public void delete(@PathVariable Long id) { rates.deleteById(id); }

    @GetMapping("/profiles")
    public List<CurrencyProfile> profiles(Authentication auth) {
        return profiles.findByUserIdOrderByCountryNameAsc(currentUser(auth).getId());
    }

    @PostMapping("/profiles")
    public CurrencyProfile createProfile(@RequestBody CurrencyProfile input, Authentication auth) {
        CurrencyProfile item = new CurrencyProfile();
        copyProfile(input, item);
        item.setUserId(currentUser(auth).getId());
        item.setUpdatedAt(Instant.now());
        return profiles.save(item);
    }

    @PutMapping("/profiles/{id}")
    public CurrencyProfile updateProfile(@PathVariable Long id, @RequestBody CurrencyProfile input, Authentication auth) {
        CurrencyProfile item = ownedProfile(id, auth);
        copyProfile(input, item);
        item.setUpdatedAt(Instant.now());
        return profiles.save(item);
    }

    @DeleteMapping("/profiles/{id}")
    public void deleteProfile(@PathVariable Long id, Authentication auth) {
        profiles.delete(ownedProfile(id, auth));
    }

    private void copyProfile(CurrencyProfile input, CurrencyProfile target) {
        target.setCountryName(input.getCountryName());
        target.setCountryCode(input.getCountryCode());
        target.setCurrency(input.getCurrency());
        target.setCurrencyCode(input.getCurrencyCode());
        target.setCurrencySymbol(input.getCurrencySymbol());
        target.setDecimalPlaces(input.getDecimalPlaces() == null ? 0 : input.getDecimalPlaces());
        target.setRoundingCondition(input.getRoundingCondition() == null ? "Nearest" : input.getRoundingCondition());
        target.setUpRules(copyRules(input.getUpRules()));
        target.setDownRules(copyRules(input.getDownRules()));
        target.setDenominations(copyDenominations(input.getDenominations()));
    }

    private List<RoundingRule> copyRules(List<RoundingRule> source) {
        List<RoundingRule> items = new ArrayList<>();
        if (source == null) return items;
        for (RoundingRule rule : source) {
            RoundingRule copy = new RoundingRule();
            copy.setConsiderFigures(rule.getConsiderFigures());
            copy.setRoundTo(rule.getRoundTo());
            items.add(copy);
        }
        return items;
    }

    private List<CurrencyDenomination> copyDenominations(List<CurrencyDenomination> source) {
        List<CurrencyDenomination> items = new ArrayList<>();
        if (source == null) return items;
        for (CurrencyDenomination denomination : source) {
            CurrencyDenomination copy = new CurrencyDenomination();
            copy.setValue(denomination.getValue());
            copy.setLabel(denomination.getLabel());
            copy.setType(denomination.getType());
            copy.setStatus(denomination.getStatus());
            items.add(copy);
        }
        return items;
    }

    private CurrencyProfile ownedProfile(Long id, Authentication auth) {
        CurrencyProfile item = profiles.findById(id).orElseThrow();
        if (!item.getUserId().equals(currentUser(auth).getId())) throw new IllegalArgumentException("Not found");
        return item;
    }

    private User currentUser(Authentication auth) {
        return users.findByEmail(auth.getName()).orElseThrow();
    }
}
