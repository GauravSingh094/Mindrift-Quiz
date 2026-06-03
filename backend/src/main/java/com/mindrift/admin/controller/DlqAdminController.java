package com.mindrift.admin.controller;

import com.mindrift.common.base.DeadLetterEvent;
import com.mindrift.common.base.DeadLetterRepository;
import com.mindrift.common.monitoring.MonitoringService;
import com.mindrift.common.security.RequirePermission;
import com.mindrift.common.response.ApiResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Administrative REST Controller for SREs to monitor, replay, or delete Dead Letter Queue (DLQ) events.
 * Fully secured via custom `@RequirePermission` RBAC annotations.
 */
@Slf4j
@RestController
@RequestMapping("/admin/dlq")
@RequiredArgsConstructor
public class DlqAdminController {

    private final DeadLetterRepository deadLetterRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;
    private final MonitoringService monitoringService;

    @GetMapping
    @RequirePermission("admin:manage")
    public ResponseEntity<ApiResponse<List<DeadLetterEvent>>> getDlqEvents() {
        log.info("SRE retrieving complete Dead Letter Queue (DLQ) events...");
        List<DeadLetterEvent> events = deadLetterRepository.findAll();
        return ResponseEntity.ok(ApiResponse.success("DLQ events retrieved successfully", events));
    }

    @PostMapping("/{id}/replay")
    @RequirePermission("admin:manage")
    public ResponseEntity<ApiResponse<Void>> replayEvent(@PathVariable UUID id) {
        log.info("SRE triggering replay validation for DLQ event: {}", id);
        DeadLetterEvent event = deadLetterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dead letter event record not found: " + id));

        // Reconstruct original topic name (e.g., quiz-events-dlq -> quiz-events)
        String originalTopic = event.getTopic().replace("-dlq", "");
        
        try {
            log.info("Replaying DLQ event payload back to original topic: {}", originalTopic);
            kafkaTemplate.send(originalTopic, event.getKeyValue(), event.getPayload()).get();
            
            // Delete replayed event from DB
            deadLetterRepository.delete(event);
            
            // Update metric count
            long totalDlqSize = deadLetterRepository.count();
            monitoringService.setDlqSize(totalDlqSize);
            
            log.info("DLQ Event successfully replayed and cleared from DB: {}", id);
            return ResponseEntity.ok(ApiResponse.success("Event replayed and cleared successfully"));
        } catch (Exception e) {
            log.error("Failed to replay DLQ event to original topic: {}", originalTopic, e);
            return ResponseEntity.status(500)
                    .body(ApiResponse.error("Failed to replay DLQ event: " + e.getMessage(), "ERR_DLQ_REPLAY_FAILED"));
        }
    }

    @DeleteMapping("/{id}")
    @RequirePermission("admin:manage")
    public ResponseEntity<ApiResponse<Void>> deleteEvent(@PathVariable UUID id) {
        log.info("SRE clearing DLQ event from DB: {}", id);
        DeadLetterEvent event = deadLetterRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dead letter event record not found: " + id));
        
        deadLetterRepository.delete(event);
        
        // Update metric count
        long totalDlqSize = deadLetterRepository.count();
        monitoringService.setDlqSize(totalDlqSize);
        
        return ResponseEntity.ok(ApiResponse.success("Dead letter event cleared from DB successfully"));
    }
}
