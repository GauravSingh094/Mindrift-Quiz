package com.mindrift.leaderboard.entity;

import com.mindrift.common.base.BaseEntity;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/**
 * A named season with a definite start/end window.
 * Seasonal rankings are computed over attempts submitted within this window.
 */
@Getter
@Setter
@Entity
@Table(name = "leaderboard_seasons")
public class LeaderboardSeason extends BaseEntity {

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "start_date", nullable = false)
    private Instant startDate;

    @Column(name = "end_date", nullable = false)
    private Instant endDate;

    @Column(name = "is_active", nullable = false)
    private Boolean isActive = false;

    /** Human-readable period label, e.g. "Q2 2025" */
    @Column(length = 50)
    private String label;
}
