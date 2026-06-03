package com.mindrift.ai.dto;

import com.fasterxml.jackson.annotation.JsonInclude;
import lombok.Builder;
import lombok.Value;

import java.util.List;

@Value @Builder
@JsonInclude(JsonInclude.Include.NON_NULL)
public class ExplanationResponse {
    String explanation;
    String whyUserWasWrong;
    String conceptSummary;
    List<String> keyPoints;
    String analogy;
    List<String> furtherReading;
    String provider;
}
