package com.mindrift.integrity.dto;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.UUID;

/** Proctoring session summary embedded in IntegrityReportResponse */
@Value
@Builder
public class ProctoringSessionDto {
    UUID sessionId;
    String status;
    boolean cameraConsented;
    boolean microphoneConsented;
    boolean fullscreenRequired;
    long framesCaptured;
    long faceDetectedFrames;
    long noFaceFrames;
    long multipleFaceFrames;
    double faceDetectionRate;
    int heartbeatMissedCount;
    Instant startedAt;
    Instant endedAt;
    boolean flaggedForReview;
    String flagReason;
}
