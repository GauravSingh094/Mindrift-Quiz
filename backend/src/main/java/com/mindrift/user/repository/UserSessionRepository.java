package com.mindrift.user.repository;

import com.mindrift.user.entity.UserSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserSessionRepository extends JpaRepository<UserSession, UUID> {
    List<UserSession> findByUserIdAndStatus(UUID userId, String status);
    Optional<UserSession> findByUserIdAndDeviceFingerprintAndStatus(UUID userId, String deviceFingerprint, String status);
}
