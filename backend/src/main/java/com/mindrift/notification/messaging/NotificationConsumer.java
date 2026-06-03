package com.mindrift.notification.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindrift.notification.dto.NotificationPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationConsumer {

    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "mindrift.notifications", groupId = "mindrift-notifications-group")
    public void consumeNotificationEvent(String message) {
        log.info("Received notification event message from Kafka");
        try {
            NotificationPayload payload = objectMapper.readValue(message, NotificationPayload.class);
            log.info("Dispatching notification '{}' to user {} via {}", payload.getTitle(), payload.getUserId(), payload.getType());

            switch (payload.getType()) {
                case EMAIL:
                    sendEmailMock(payload.getUserId(), payload.getTitle(), payload.getMessage());
                    break;
                case PUSH:
                    sendPushMock(payload.getUserId(), payload.getTitle(), payload.getMessage());
                    break;
                case IN_APP:
                    log.info("In-App notifications are managed natively in local DB.");
                    break;
            }
        } catch (Exception e) {
            log.error("Failed to process notification message payload: {}", message, e);
        }
    }

    private void sendEmailMock(java.util.UUID userId, String title, String message) {
        log.info("[MOCK DISPATCH] Sending Email to User {}. Title: {}, Body: {}", userId, title, message);
    }

    private void sendPushMock(java.util.UUID userId, String title, String message) {
        log.info("[MOCK DISPATCH] Sending Push Notification to User {}. Title: {}, Body: {}", userId, title, message);
    }
}
