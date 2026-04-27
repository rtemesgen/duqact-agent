package com.satesoft.mobiagent;

import com.satesoft.mobiagent.auth.AuthService;
import com.satesoft.mobiagent.domain.CurrencyDenomination;
import com.satesoft.mobiagent.domain.CurrencyProfile;
import com.satesoft.mobiagent.domain.CurrencyProfileRepository;
import com.satesoft.mobiagent.domain.ApiConnection;
import com.satesoft.mobiagent.domain.ApiConnectionRepository;
import com.satesoft.mobiagent.domain.ChannelType;
import com.satesoft.mobiagent.domain.ChannelTypeRepository;
import com.satesoft.mobiagent.domain.MobiAgentShop;
import com.satesoft.mobiagent.domain.MobiAgentShopRepository;
import com.satesoft.mobiagent.domain.RoundingRule;
import com.satesoft.mobiagent.domain.ServiceChannel;
import com.satesoft.mobiagent.domain.ServiceChannelRepository;
import com.satesoft.mobiagent.domain.ShopWorkerAssignment;
import com.satesoft.mobiagent.domain.ShopWorkerAssignmentRepository;
import com.satesoft.mobiagent.domain.UserProfile;
import com.satesoft.mobiagent.domain.UserProfileRepository;
import com.satesoft.mobiagent.domain.UserSettings;
import com.satesoft.mobiagent.domain.UserSettingsRepository;
import com.satesoft.mobiagent.domain.UserTheme;
import com.satesoft.mobiagent.user.Role;
import com.satesoft.mobiagent.user.User;
import com.satesoft.mobiagent.user.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;

@SpringBootApplication
public class MobiAgentApplication {
    public static void main(String[] args) {
        SpringApplication.run(MobiAgentApplication.class, args);
    }

    @Bean
    CommandLineRunner seedUsers(UserRepository users, AuthService authService, ChannelTypeRepository channelTypes, ServiceChannelRepository serviceChannels, CurrencyProfileRepository currencyProfiles,
                                ApiConnectionRepository apiConnections, MobiAgentShopRepository shops, ShopWorkerAssignmentRepository assignments,
                                UserProfileRepository profiles, UserSettingsRepository settings) {
        return args -> {
            User admin;
            User agent;
            if (users.count() == 0) {
                admin = users.save(new User("Admin User", "admin@mobi.local", authService.hashPassword("admin123"), Role.ADMIN));
                agent = users.save(new User("Mobi Agent", "agent@mobi.local", authService.hashPassword("agent123"), Role.MOBI_AGENT));
            } else {
                admin = users.findByEmail("admin@mobi.local").orElse(null);
                agent = users.findByEmail("agent@mobi.local").orElse(null);
            }

            if (agent != null) {
                var existingTypes = channelTypes.findByUserIdOrderByCreatedAtAsc(agent.getId());
                ChannelType mno = findOrCreateType(existingTypes, channelTypes, agent.getId(), "MNO", "Mobile Network Operator");
                findOrCreateType(existingTypes, channelTypes, agent.getId(), "Bank", "Banking Institution");
                findOrCreateType(existingTypes, channelTypes, agent.getId(), "Wallet", "Digital Wallet Service");
                ChannelType cash = findOrCreateType(existingTypes, channelTypes, agent.getId(), "Cash", "Cash handling channels");

                var existingServices = serviceChannels.findByUserIdOrderByCreatedAtAsc(agent.getId());
                saveServiceIfMissing(existingServices, serviceChannels, createService(agent.getId(), mno.getId(), "MTN Mobile Money", "Uganda", true, "Admin"));
                saveServiceIfMissing(existingServices, serviceChannels, createService(agent.getId(), mno.getId(), "Airtel Money", "Uganda", true, "Admin"));
                saveServiceIfMissing(existingServices, serviceChannels, createService(agent.getId(), cash.getId(), "Cash at Hand", "Uganda", true, "Admin"));
            }

            if (agent != null && currencyProfiles.findByUserIdOrderByCountryNameAsc(agent.getId()).isEmpty()) {
                currencyProfiles.save(createProfile(agent.getId(), "Uganda", "UG", "Ugandan Shilling", "UGX", "USh", 0,
                        List.of(rule("0.50", "1")), List.of(rule("0.49", "0")),
                        List.of(denomination("50000", "50,000", "Note"), denomination("20000", "20,000", "Note"), denomination("10000", "10,000", "Note"), denomination("5000", "5,000", "Note"), denomination("1000", "1,000", "Note"))));
                currencyProfiles.save(createProfile(agent.getId(), "Kenya", "KE", "Kenyan Shilling", "KES", "KSh", 2,
                        List.of(), List.of(), List.of(denomination("1000", "1,000", "Note"), denomination("500", "500", "Note"), denomination("100", "100", "Note"))));
                currencyProfiles.save(createProfile(agent.getId(), "Tanzania", "TZ", "Tanzanian Shilling", "TZS", "TSh", 0,
                        List.of(), List.of(), List.of(denomination("10000", "10,000", "Note"), denomination("5000", "5,000", "Note"), denomination("1000", "1,000", "Note"))));
            }

            if (admin != null && apiConnections.findByUserIdOrderByCreatedAtAsc(admin.getId()).isEmpty()) {
                apiConnections.save(api(admin.getId(), "Authentication API", "/api/auth", "ACTIVE", "Login and registration for web and mobile clients."));
                apiConnections.save(api(admin.getId(), "Mobi Agent Core API", "/api/mno-transactions", "ACTIVE", "Transactions, accounts, wallets, channels, and dashboard endpoints."));
                apiConnections.save(api(admin.getId(), "Exchange Rate API", "/api/exchange-rates", "ACTIVE", "Exchange rates, currency profiles, rounding rules, and denominations."));
            }

            if (agent != null && shops.findByOwnerUserIdOrderByCreatedAtAsc(agent.getId()).isEmpty()) {
                MobiAgentShop shop = new MobiAgentShop();
                shop.setBusinessName("Kampala Central Shop");
                shop.setLocation("Kampala");
                shop.setCountry("Uganda");
                shop.setOwnerUserId(agent.getId());
                shop.setAgentId("AGT-001");
                shop.setRemarks("Main agent branch");
                shop.setCreatedAt(Instant.now());
                shop.setUpdatedAt(Instant.now());
                shop = shops.save(shop);

                ShopWorkerAssignment assignment = new ShopWorkerAssignment();
                assignment.setShopId(shop.getId());
                assignment.setUserId(agent.getId());
                assignment.setJobTitle("Supervisor");
                assignment.setPhone("+256700000001");
                assignment.setCreatedAt(Instant.now());
                assignments.save(assignment);
            }

            if (agent != null && profiles.findById(agent.getId()).isEmpty()) {
                UserProfile profile = new UserProfile();
                profile.setUserId(agent.getId());
                profile.setPhonePrimary("+256700000001");
                profile.setPhoneWhatsapp("+256700000001");
                profile.setBio("Mobi Agent profile aligned to the reference product workflow.");
                profile.setGender("Prefer not to say");
                profile.setIdType("National ID");
                profile.setIdNumber("CM00000000");
                profile.setUpdatedAt(Instant.now());
                profiles.save(profile);
            }

            if (agent != null && settings.findById(agent.getId()).isEmpty()) {
                UserSettings userSettings = new UserSettings();
                userSettings.setUserId(agent.getId());
                userSettings.setTheme(UserTheme.DARK);
                userSettings.setUpdatedAt(Instant.now());
                settings.save(userSettings);
            }
        };
    }

    private static ApiConnection api(Long userId, String name, String endpoint, String status, String description) {
        ApiConnection item = new ApiConnection();
        item.setUserId(userId);
        item.setName(name);
        item.setEndpoint(endpoint);
        item.setStatus(status);
        item.setDescription(description);
        item.setCreatedAt(Instant.now());
        item.setUpdatedAt(Instant.now());
        return item;
    }

    private static ChannelType createType(Long userId, String name, String description, boolean active) {
        ChannelType item = new ChannelType();
        item.setUserId(userId);
        item.setName(name);
        item.setDescription(description);
        item.setActive(active);
        item.setCreatedAt(Instant.now());
        return item;
    }

    private static ChannelType findOrCreateType(List<ChannelType> existingTypes, ChannelTypeRepository repository, Long userId, String name, String description) {
        return existingTypes.stream()
                .filter(item -> item.getName() != null && item.getName().equalsIgnoreCase(name))
                .findFirst()
                .orElseGet(() -> repository.save(createType(userId, name, description, true)));
    }

    private static ServiceChannel createService(Long userId, Long channelTypeId, String channelName, String country, boolean active, String createdBy) {
        ServiceChannel item = new ServiceChannel();
        item.setUserId(userId);
        item.setChannelTypeId(channelTypeId);
        item.setChannelName(channelName);
        item.setCountry(country);
        item.setActive(active);
        item.setCreatedByName(createdBy);
        item.setCreatedAt(Instant.now());
        return item;
    }

    private static void saveServiceIfMissing(List<ServiceChannel> existingServices, ServiceChannelRepository repository, ServiceChannel candidate) {
        boolean exists = existingServices.stream().anyMatch(item ->
                item.getChannelTypeId() != null
                        && item.getChannelTypeId().equals(candidate.getChannelTypeId())
                        && item.getChannelName() != null
                        && item.getChannelName().equalsIgnoreCase(candidate.getChannelName()));
        if (!exists) repository.save(candidate);
    }

    private static CurrencyProfile createProfile(Long userId, String countryName, String countryCode, String currency, String currencyCode, String symbol, int decimalPlaces,
                                                 List<RoundingRule> upRules, List<RoundingRule> downRules, List<CurrencyDenomination> denominations) {
        CurrencyProfile item = new CurrencyProfile();
        item.setUserId(userId);
        item.setCountryName(countryName);
        item.setCountryCode(countryCode);
        item.setCurrency(currency);
        item.setCurrencyCode(currencyCode);
        item.setCurrencySymbol(symbol);
        item.setDecimalPlaces(decimalPlaces);
        item.setRoundingCondition("Nearest");
        item.setUpRules(upRules);
        item.setDownRules(downRules);
        item.setDenominations(denominations);
        item.setUpdatedAt(Instant.now());
        return item;
    }

    private static RoundingRule rule(String threshold, String roundTo) {
        RoundingRule item = new RoundingRule();
        item.setConsiderFigures(new BigDecimal(threshold));
        item.setRoundTo(new BigDecimal(roundTo));
        return item;
    }

    private static CurrencyDenomination denomination(String value, String label, String type) {
        CurrencyDenomination item = new CurrencyDenomination();
        item.setValue(new BigDecimal(value));
        item.setLabel(label);
        item.setType(type);
        item.setStatus("Active");
        return item;
    }
}
