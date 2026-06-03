package com.mindrift.common.base;

import com.mindrift.user.entity.User;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuditService {

    private final AuditRepository auditRepository;

    @Async
    public void logAction(User user, String actionType, Object metadata, String ipAddress, String userAgent) {
        try {
            AuditLog logEntry = new AuditLog();
            logEntry.setUser(user);
            logEntry.setActionType(actionType);
            logEntry.setMetadata(metadata);
            logEntry.setIpAddress(ipAddress);
            logEntry.setUserAgent(userAgent);
            logEntry.setCreatedAt(Instant.now());
            auditRepository.save(logEntry);
            log.debug("Async Audit log recorded: {}", actionType);
        } catch (Exception e) {
            log.error("Failed to save audit log entry", e);
        }
    }
}
