package com.satesoft.mobiagent.api;

import com.satesoft.mobiagent.domain.UserProfile;
import com.satesoft.mobiagent.domain.UserProfileRepository;
import com.satesoft.mobiagent.user.User;
import com.satesoft.mobiagent.user.UserRepository;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.time.LocalDate;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final UserProfileRepository profiles;
    private final UserRepository users;
    public ProfileController(UserProfileRepository profiles, UserRepository users) { this.profiles = profiles; this.users = users; }

    @GetMapping("/me")
    public ProfileDto me(Authentication auth) {
        User user = currentUser(auth);
        return dto(user, profiles.findById(user.getId()).orElseGet(() -> createDefault(user.getId())));
    }

    @PutMapping("/me")
    public ProfileDto save(@RequestBody ProfileRequest request, Authentication auth) {
        User user = currentUser(auth);
        user.setName(request.name());
        if (request.email() != null && !request.email().isBlank()) user.setEmail(request.email());
        users.save(user);
        UserProfile profile = profiles.findById(user.getId()).orElseGet(() -> createDefault(user.getId()));
        profile.setPhonePrimary(request.phonePrimary());
        profile.setPhoneWhatsapp(request.phoneWhatsapp());
        profile.setBio(request.bio());
        profile.setGender(request.gender());
        profile.setDateOfBirth(request.dateOfBirth());
        profile.setIdType(request.idType());
        profile.setIdNumber(request.idNumber());
        profile.setAvatarUrl(request.avatarUrl());
        profile.setSelfieUrl(request.selfieUrl());
        profile.setIdFrontUrl(request.idFrontUrl());
        profile.setIdBackUrl(request.idBackUrl());
        profile.setUpdatedAt(Instant.now());
        return dto(user, profiles.save(profile));
    }

    private User currentUser(Authentication auth) { return users.findByEmail(auth.getName()).orElseThrow(); }
    private UserProfile createDefault(Long userId) { UserProfile p = new UserProfile(); p.setUserId(userId); p.setUpdatedAt(Instant.now()); return profiles.save(p); }
    private ProfileDto dto(User user, UserProfile p) {
        return new ProfileDto(user.getId(), user.getName(), user.getEmail(), p.getPhonePrimary(), p.getPhoneWhatsapp(), p.getBio(), p.getGender(), p.getDateOfBirth(), p.getIdType(), p.getIdNumber(), p.getAvatarUrl(), p.getSelfieUrl(), p.getIdFrontUrl(), p.getIdBackUrl(), p.getUpdatedAt());
    }
    public record ProfileRequest(String name, String email, String phonePrimary, String phoneWhatsapp, String bio, String gender, LocalDate dateOfBirth, String idType, String idNumber, String avatarUrl, String selfieUrl, String idFrontUrl, String idBackUrl) {}
    public record ProfileDto(Long userId, String name, String email, String phonePrimary, String phoneWhatsapp, String bio, String gender, LocalDate dateOfBirth, String idType, String idNumber, String avatarUrl, String selfieUrl, String idFrontUrl, String idBackUrl, Instant updatedAt) {}
}
