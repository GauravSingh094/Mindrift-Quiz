package com.mindrift.user.service;

import com.mindrift.common.exception.ResourceNotFoundException;
import com.mindrift.user.entity.UserSession;
import com.mindrift.user.repository.UserSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class SessionService {

    private final UserSessionRepository userSessionRepository;

    @Transactional(readOnly = true)
    public List<UserSession> getActiveSessions(UUID userId) {
        log.info("Fetching active user sessions for user: {}", userId);
        return userSessionRepository.findByUserIdAndStatus(userId, "ACTIVE");
    }

    @Transactional
    public void invalidateSession(UUID sessionId) {
        log.info("Invalidating user session: {}", sessionId);
        UserSession session = userSessionRepository.findById(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("Session not found: " + sessionId));
        session.setStatus("EXPIRED");
        userSessionRepository.save(session);
    }

    @Transactional
    public void invalidateAllUserSessions(UUID userId) {
        log.info("Invalidating all active concurrent sessions for user: {}", userId);
        List<UserSession> activeSessions = userSessionRepository.findByUserIdAndStatus(userId, "ACTIVE");
        for (UserSession session : activeSessions) {
            session.setStatus("EXPIRED");
        }
        userSessionRepository.saveAll(activeSessions);
    }
}
