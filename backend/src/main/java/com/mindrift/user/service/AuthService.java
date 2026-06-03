package com.mindrift.user.service;

import com.mindrift.common.security.UserPrincipal;
import com.mindrift.outbox.service.OutboxService;
import com.mindrift.user.entity.User;
import com.mindrift.user.entity.UserRole;
import com.mindrift.user.entity.UserSession;
import com.mindrift.user.entity.UserStatus;
import com.mindrift.user.repository.UserRepository;
import com.mindrift.user.repository.UserSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserSessionRepository userSessionRepository;
    private final OutboxService outboxService;

    @Transactional
    public User syncProfile(UserPrincipal principal, String ipAddress, String userAgent, String deviceFingerprint) {
        String clerkId = principal.getClerkId();
        log.info("Synchronizing profile for Clerk ID: {}", clerkId);

        Optional<User> userOpt = userRepository.findByClerkId(clerkId);
        User user;
        boolean isNew = false;

        if (userOpt.isEmpty()) {
            user = new User();
            user.setClerkId(clerkId);
            user.setEmail(principal.getEmail());
            user.setUsername(principal.getUsername());
            user.setRole(UserRole.ROLE_PLAYER);
            user.setStatus(UserStatus.ACTIVE);
            isNew = true;
        } else {
            user = userOpt.get();
        }

        // Keep local profile up to date with Clerk's verified payload
        user.setEmail(principal.getEmail());
        if (principal.getUsername() != null) {
            user.setUsername(principal.getUsername());
        }

        User savedUser = userRepository.save(user);

        // Track or update active device sessions
        trackSession(savedUser, ipAddress, userAgent, deviceFingerprint);

        // Publish Outbox Event for downstream sync
        Map<String, Object> payload = new HashMap<>();
        payload.put("id", savedUser.getId().toString());
        payload.put("clerkId", savedUser.getClerkId());
        payload.put("email", savedUser.getEmail());
        payload.put("username", savedUser.getUsername());
        payload.put("role", savedUser.getRole().name());
        payload.put("status", savedUser.getStatus().name());

        outboxService.saveEvent("USER", savedUser.getId().toString(), isNew ? "USER_CREATED" : "USER_UPDATED", payload);

        return savedUser;
    }

    private void trackSession(User user, String ipAddress, String userAgent, String deviceFingerprint) {
        String fingerprint = (deviceFingerprint == null || deviceFingerprint.isEmpty()) ? "UNKNOWN_DEVICE" : deviceFingerprint;

        log.info("Tracking session for user {} from IP: {}, fingerprint: {}", user.getId(), ipAddress, fingerprint);

        Optional<UserSession> activeSessionOpt = userSessionRepository
                .findByUserIdAndDeviceFingerprintAndStatus(user.getId(), fingerprint, "ACTIVE");

        UserSession session;
        if (activeSessionOpt.isPresent()) {
            session = activeSessionOpt.get();
            session.setLastActivity(Instant.now());
            session.setIpAddress(ipAddress);
            session.setUserAgent(userAgent);
        } else {
            session = new UserSession();
            session.setUser(user);
            session.setDeviceFingerprint(fingerprint);
            session.setIpAddress(ipAddress);
            session.setUserAgent(userAgent);
            session.setLoginTime(Instant.now());
            session.setLastActivity(Instant.now());
            session.setStatus("ACTIVE");
            
            var activeSessions = userSessionRepository.findByUserIdAndStatus(user.getId(), "ACTIVE");
            if (!activeSessions.isEmpty()) {
                log.warn("Multiple active concurrent sessions detected for user: {}. Active Count: {}", user.getId(), activeSessions.size());
            }
        }

        userSessionRepository.save(session);
    }
}
