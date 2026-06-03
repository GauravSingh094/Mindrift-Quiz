package com.mindrift.notification.repository;

import com.mindrift.notification.entity.Notification;
import com.mindrift.notification.entity.NotificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.UUID;

@Repository
public interface NotificationRepository extends JpaRepository<Notification, UUID> {
    List<Notification> findByUserIdAndStatusOrderByCreatedAtDesc(UUID userId, NotificationStatus status);
    List<Notification> findByUserIdOrderByCreatedAtDesc(UUID userId);
}
