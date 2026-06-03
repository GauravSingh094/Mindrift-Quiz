package com.mindrift.notification.entity;

import com.mindrift.common.base.BaseEntity;
import com.mindrift.user.entity.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Entity
@Table(name = "notifications")
public class Notification extends BaseEntity {

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String message;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private NotificationType type = NotificationType.IN_APP;

    @Column(nullable = false, length = 50)
    @Enumerated(EnumType.STRING)
    private NotificationStatus status = NotificationStatus.UNREAD;
}
