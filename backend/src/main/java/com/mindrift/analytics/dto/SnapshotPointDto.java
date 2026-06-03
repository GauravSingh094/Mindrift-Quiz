package com.mindrift.analytics.dto;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;

/** A single data point in a time-series trend chart */
@Value
@Builder
public class SnapshotPointDto {
    Instant timestamp;
    String periodLabel;
    double averageScore;
    long totalAttempts;
    double passRate;
}
