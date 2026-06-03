package com.mindrift.common.idempotency;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.io.Serializable;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CachedResponse implements Serializable {
    private String status; // "PROCESSING" or "COMPLETED"
    private int statusCode;
    private String body;
    private String contentType;
}
