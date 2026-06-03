package com.mindrift.notification.service;

import com.mindrift.common.exception.ResourceNotFoundException;
import com.mindrift.notification.dto.NotificationPayload;
import com.mindrift.notification.entity.Notification;
import com.mindrift.notification.entity.NotificationStatus;
import com.mindrift.notification.entity.NotificationType;
import com.mindrift.notification.messaging.NotificationProducer;
import com.mindrift.notification.repository.NotificationRepository;
import com.mindrift.user.entity.User;
import com.mindrift.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final NotificationProducer notificationProducer;

    @Transactional
    public void sendNotification(UUID userId, String title, String message, NotificationType type) {
        log.info("Sending notification type {} to user {}", type, userId);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found: " + userId));

        Notification notification = new Notification();
        notification.setUser(user);
        notification.setTitle(title);
        notification.setMessage(message);
        notification.setType(type);
        notification.setStatus(NotificationStatus.UNREAD);
        
        Notification savedNotification = notificationRepository.save(notification);

        // Publish message event to Kafka topic for decoupled multi-channel dispatch
        NotificationPayload payload = NotificationPayload.builder()
                .userId(userId)
                .title(title)
                .message(message)
                .type(type)
                .build();
        
        notificationProducer.sendNotificationEvent(payload);
    }

    @Transactional(readOnly = true)
    public List<Notification> getUnreadNotifications(UUID userId) {
        return notificationRepository.findByUserIdAndStatusOrderByCreatedAtDesc(userId, NotificationStatus.UNREAD);
    }

    @Transactional(readOnly = true)
    public List<Notification> getAllNotifications(UUID userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    @Transactional
    public void markAsRead(UUID notificationId) {
        Notification notification = notificationRepository.findById(notificationId)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found: " + notificationId));
        notification.setStatus(NotificationStatus.READ);
        notificationRepository.save(notification);
        log.debug("Notification {} marked as read", notificationId);
    }
}
