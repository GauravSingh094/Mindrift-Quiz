package com.mindrift.notification.dto;

import com.mindrift.notification.entity.NotificationType;
import lombok.Builder;
import lombok.Getter;
import java.util.UUID;

@Getter
@Builder
public class NotificationPayload {
    private UUID userId;
    private String title;
    private String message;
    private NotificationType type;
}
