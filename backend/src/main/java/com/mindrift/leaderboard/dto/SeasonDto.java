package com.mindrift.leaderboard.dto;

import lombok.Builder;
import lombok.Value;

import java.time.Instant;
import java.util.UUID;

@Value
@Builder
public class SeasonDto {

    UUID id;
    String name;
    String label;
    Instant startDate;
    Instant endDate;
    boolean isActive;
}
