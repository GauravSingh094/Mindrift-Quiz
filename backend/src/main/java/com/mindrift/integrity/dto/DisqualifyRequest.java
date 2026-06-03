package com.mindrift.integrity.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Builder;
import lombok.Value;
import lombok.extern.jackson.Jacksonized;

import java.util.UUID;

/** Payload for POST /api/integrity/moderation/disqualify */
@Value
@Builder
@Jacksonized
public class DisqualifyRequest {

    @NotNull
    UUID attemptId;

    /** Optional: competition context to update participant status */
    UUID competitionId;

    @NotNull
    String reason;

    /** Whether to notify the user via email/notification */
    boolean notifyUser;

    /** Whether to invalidate the attempt's score from leaderboards */
    boolean invalidateScore;
}
