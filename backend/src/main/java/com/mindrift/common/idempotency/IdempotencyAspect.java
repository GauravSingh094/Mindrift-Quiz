package com.mindrift.common.idempotency;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.aspectj.lang.ProceedingJoinPoint;
import org.aspectj.lang.annotation.Around;
import org.aspectj.lang.annotation.Aspect;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Component;
import org.springframework.web.context.request.RequestContextHolder;
import org.springframework.web.context.request.ServletRequestAttributes;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;

@Slf4j
@Aspect
@Component
@RequiredArgsConstructor
public class IdempotencyAspect {

    private final StringRedisTemplate redisTemplate;
    private final ObjectMapper objectMapper;

    private static final String IDEMPOTENCY_KEY_PREFIX = "mindrift:idem:";

    @Around("@annotation(idempotent)")
    public Object enforceIdempotency(ProceedingJoinPoint joinPoint, Idempotent idempotent) throws Throwable {
        ServletRequestAttributes attributes = (ServletRequestAttributes) RequestContextHolder.getRequestAttributes();
        if (attributes == null) {
            return joinPoint.proceed();
        }

        HttpServletRequest request = attributes.getRequest();
        HttpServletResponse response = attributes.getResponse();

        String idempotencyKey = request.getHeader("Idempotency-Key");
        if (idempotencyKey == null || idempotencyKey.isEmpty()) {
            throw new IllegalArgumentException("Missing required 'Idempotency-Key' header on idempotent endpoint");
        }

        String redisKey = IDEMPOTENCY_KEY_PREFIX + idempotencyKey;

        // Atomically set a "PROCESSING" marker
        Boolean isNew = redisTemplate.opsForValue().setIfAbsent(redisKey, 
                objectMapper.writeValueAsString(new CachedResponse("PROCESSING", 200, "", "")), 
                Duration.ofSeconds(idempotent.ttlSeconds()));

        if (Boolean.FALSE.equals(isNew)) {
            String cachedData = redisTemplate.opsForValue().get(redisKey);
            if (cachedData != null) {
                CachedResponse cachedResponse = objectMapper.readValue(cachedData, CachedResponse.class);
                if ("PROCESSING".equals(cachedResponse.getStatus())) {
                    log.warn("Concurrent request detected for idempotency key: {}", idempotencyKey);
                    if (response != null) {
                        response.setStatus(HttpServletResponse.SC_CONFLICT);
                    }
                    throw new IllegalStateException("A request with this Idempotency-Key is currently processing. Please try again.");
                } else if ("COMPLETED".equals(cachedResponse.getStatus())) {
                    log.info("Idempotency cache hit for key: {}", idempotencyKey);
                    if (response != null) {
                        response.setHeader("Idempotency-Cache-Hit", "true");
                        response.setContentType(cachedResponse.getContentType());
                    }
                    Object parsedBody = objectMapper.readValue(cachedResponse.getBody(), Object.class);
                    return ResponseEntity.status(cachedResponse.getStatusCode()).body(parsedBody);
                }
            }
        }

        try {
            Object result = joinPoint.proceed();
            
            if (result instanceof ResponseEntity<?> responseEntity) {
                String bodyJson = objectMapper.writeValueAsString(responseEntity.getBody());
                String contentType = "application/json";
                if (responseEntity.getHeaders().getContentType() != null) {
                    contentType = responseEntity.getHeaders().getContentType().toString();
                }

                CachedResponse completedResp = new CachedResponse("COMPLETED", 
                        responseEntity.getStatusCode().value(), 
                        bodyJson, 
                        contentType);

                redisTemplate.opsForValue().set(redisKey, 
                        objectMapper.writeValueAsString(completedResp), 
                        Duration.ofSeconds(idempotent.ttlSeconds()));
            }

            return result;
        } catch (Throwable e) {
            // Delete locking key on exception to allow retry
            redisTemplate.delete(redisKey);
            throw e;
        }
    }
}
