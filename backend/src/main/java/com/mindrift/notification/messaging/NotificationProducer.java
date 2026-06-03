package com.mindrift.notification.messaging;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.mindrift.notification.dto.NotificationPayload;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    private static final String TOPIC = "mindrift.notifications";

    public void sendNotificationEvent(NotificationPayload payload) {
        log.info("Publishing notification to Kafka for user: {}", payload.getUserId());
        try {
            String jsonPayload = objectMapper.writeValueAsString(payload);
            kafkaTemplate.send(TOPIC, payload.getUserId().toString(), jsonPayload).get();
            log.info("Notification successfully published to Kafka topic '{}'", TOPIC);
        } catch (Exception e) {
            log.error("Failed to publish notification event to Kafka: {}", payload.getUserId(), e);
            throw new RuntimeException("Kafka notification publish failed", e);
        }
    }
}
