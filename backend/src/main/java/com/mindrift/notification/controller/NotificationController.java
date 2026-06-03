package com.mindrift.notification.controller;

import com.mindrift.common.response.ApiResponse;
import com.mindrift.common.security.UserPrincipal;
import com.mindrift.notification.entity.Notification;
import com.mindrift.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping("/unread")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Notification>>> getUnreadNotifications(@AuthenticationPrincipal UserPrincipal principal) {
        log.info("Fetching unread notifications for user: {}", principal.getId());
        List<Notification> notifications = notificationService.getUnreadNotifications(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("Unread notifications retrieved successfully", notifications));
    }

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<List<Notification>>> getAllNotifications(@AuthenticationPrincipal UserPrincipal principal) {
        log.info("Fetching all notifications for user: {}", principal.getId());
        List<Notification> notifications = notificationService.getAllNotifications(principal.getId());
        return ResponseEntity.ok(ApiResponse.success("All notifications retrieved successfully", notifications));
    }

    @PatchMapping("/{id}/read")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<ApiResponse<Void>> markAsRead(@PathVariable UUID id) {
        log.info("Marking notification {} as read", id);
        notificationService.markAsRead(id);
        return ResponseEntity.ok(ApiResponse.success("Notification marked as read successfully"));
    }
}
