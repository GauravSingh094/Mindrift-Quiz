package com.mindrift.common.storage;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import com.mindrift.common.monitoring.MonitoringService;
import com.mindrift.common.storage.config.StorageProperties;
import io.github.resilience4j.circuitbreaker.CircuitBreaker;
import io.github.resilience4j.circuitbreaker.CircuitBreakerRegistry;
import lombok.Data;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Primary;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.http.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.util.List;
import java.util.Map;
import java.util.function.Supplier;

@Slf4j
@Component("supabaseStorageProvider")
@Primary
@ConditionalOnProperty(name = "storage.provider", havingValue = "supabase")
public class SupabaseStorageProvider implements StorageProvider {

    private final StorageProperties properties;
    private final RestTemplate restTemplate;
    private final CircuitBreaker circuitBreaker;
    private final MonitoringService monitoringService;

    @Autowired
    public SupabaseStorageProvider(
            StorageProperties properties,
            CircuitBreakerRegistry circuitBreakerRegistry,
            MonitoringService monitoringService) {
        this.properties = properties;
        this.restTemplate = new RestTemplate();
        this.circuitBreaker = circuitBreakerRegistry.circuitBreaker("storageProvider");
        this.monitoringService = monitoringService;
        log.info("Initialized Supabase Storage Provider for bucket: {}", properties.getSupabase().getBucket());
    }

    // Constructor for testing
    protected SupabaseStorageProvider(
            StorageProperties properties,
            RestTemplate restTemplate,
            CircuitBreakerRegistry circuitBreakerRegistry,
            MonitoringService monitoringService) {
        this.properties = properties;
        this.restTemplate = restTemplate;
        this.circuitBreaker = circuitBreakerRegistry.circuitBreaker("storageProvider");
        this.monitoringService = monitoringService;
    }

    private String getBaseUrl() {
        String url = properties.getSupabase().getUrl();
        if (url == null || url.isBlank()) {
            throw new IllegalStateException("Supabase URL is not configured. Please set SUPABASE_URL.");
        }
        // Normalize base URL
        if (url.endsWith("/")) {
            url = url.substring(0, url.length() - 1);
        }
        return url + "/storage/v1";
    }

    private <T> T executeWithRetry(Supplier<T> action, String operationName) {
        int maxAttempts = 3;
        int delayMs = 500;
        Exception lastException = null;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                return action.get();
            } catch (Exception e) {
                lastException = e;
                log.warn("Storage operation {} failed on attempt {}/{}: {}", operationName, attempt, maxAttempts, e.getMessage());
                if (attempt < maxAttempts) {
                    try {
                        Thread.sleep(delayMs);
                    } catch (InterruptedException ie) {
                        Thread.currentThread().interrupt();
                        throw new RuntimeException("Operation interrupted", ie);
                    }
                }
            }
        }
        throw new RuntimeException(operationName + " failed after " + maxAttempts + " attempts", lastException);
    }

    @Override
    public String uploadFile(String key, byte[] bytes, String contentType) {
        long start = System.currentTimeMillis();
        try {
            String resultUrl = executeWithRetry(() ->
                circuitBreaker.executeSupplier(() -> {
                    log.info("Uploading file to Supabase with key: {}, size: {} bytes", key, bytes.length);
                    HttpHeaders headers = new HttpHeaders();
                    headers.set("apikey", properties.getSupabase().getServiceRoleKey());
                    headers.set("Authorization", "Bearer " + properties.getSupabase().getServiceRoleKey());
                    headers.setContentType(MediaType.valueOf(contentType));

                    HttpEntity<byte[]> entity = new HttpEntity<>(bytes, headers);
                    String url = String.format("%s/object/%s/%s", getBaseUrl(), properties.getSupabase().getBucket(), key);

                    ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
                    if (!response.getStatusCode().is2xxSuccessful()) {
                        throw new RuntimeException("Supabase upload returned status: " + response.getStatusCode());
                    }
                    return generatePublicUrl(key);
                }),
                "Upload " + key
            );
            monitoringService.incrementStorageUpload("supabase", "SUCCESS");
            monitoringService.recordStorageLatency("supabase", "UPLOAD", System.currentTimeMillis() - start);
            return resultUrl;
        } catch (Exception e) {
            monitoringService.incrementStorageUpload("supabase", "FAILURE");
            log.error("Supabase upload failed for key: {}", key, e);
            throw new RuntimeException("Supabase upload failed: " + e.getMessage(), e);
        }
    }

    @Override
    public byte[] downloadFile(String key) {
        long start = System.currentTimeMillis();
        try {
            byte[] bytes = executeWithRetry(() ->
                circuitBreaker.executeSupplier(() -> {
                    log.info("Downloading file from Supabase with key: {}", key);
                    HttpHeaders headers = new HttpHeaders();
                    headers.set("apikey", properties.getSupabase().getServiceRoleKey());
                    headers.set("Authorization", "Bearer " + properties.getSupabase().getServiceRoleKey());

                    HttpEntity<Void> entity = new HttpEntity<>(headers);
                    String url = String.format("%s/object/authenticated/%s/%s", getBaseUrl(), properties.getSupabase().getBucket(), key);

                    ResponseEntity<byte[]> response = restTemplate.exchange(url, HttpMethod.GET, entity, byte[].class);
                    if (!response.getStatusCode().is2xxSuccessful()) {
                        throw new RuntimeException("Supabase download returned status: " + response.getStatusCode());
                    }
                    return response.getBody();
                }),
                "Download " + key
            );
            monitoringService.incrementStorageDownload("supabase", "SUCCESS");
            monitoringService.recordStorageLatency("supabase", "DOWNLOAD", System.currentTimeMillis() - start);
            return bytes;
        } catch (Exception e) {
            monitoringService.incrementStorageDownload("supabase", "FAILURE");
            log.error("Supabase download failed for key: {}", key, e);
            throw new RuntimeException("Supabase download failed: " + e.getMessage(), e);
        }
    }

    @Override
    public void deleteFile(String key) {
        long start = System.currentTimeMillis();
        try {
            executeWithRetry(() ->
                circuitBreaker.executeSupplier(() -> {
                    log.info("Deleting file from Supabase with key: {}", key);
                    HttpHeaders headers = new HttpHeaders();
                    headers.set("apikey", properties.getSupabase().getServiceRoleKey());
                    headers.set("Authorization", "Bearer " + properties.getSupabase().getServiceRoleKey());
                    headers.setContentType(MediaType.APPLICATION_JSON);

                    Map<String, Object> body = Map.of("prefixes", List.of(key));
                    HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
                    String url = String.format("%s/object/remove/%s", getBaseUrl(), properties.getSupabase().getBucket());

                    ResponseEntity<String> response = restTemplate.exchange(url, HttpMethod.POST, entity, String.class);
                    if (!response.getStatusCode().is2xxSuccessful()) {
                        throw new RuntimeException("Supabase delete returned status: " + response.getStatusCode());
                    }
                    return null;
                }),
                "Delete " + key
            );
            monitoringService.incrementStorageDelete("supabase", "SUCCESS");
            monitoringService.recordStorageLatency("supabase", "DELETE", System.currentTimeMillis() - start);
        } catch (Exception e) {
            monitoringService.incrementStorageDelete("supabase", "FAILURE");
            log.error("Supabase deletion failed for key: {}", key, e);
            throw new RuntimeException("Supabase deletion failed: " + e.getMessage(), e);
        }
    }

    @Override
    public boolean exists(String key) {
        try {
            return executeWithRetry(() ->
                circuitBreaker.executeSupplier(() -> {
                    log.info("Checking file existence on Supabase with key: {}", key);
                    HttpHeaders headers = new HttpHeaders();
                    headers.set("apikey", properties.getSupabase().getServiceRoleKey());
                    headers.set("Authorization", "Bearer " + properties.getSupabase().getServiceRoleKey());

                    HttpEntity<Void> entity = new HttpEntity<>(headers);
                    String url = String.format("%s/object/authenticated/%s/%s", getBaseUrl(), properties.getSupabase().getBucket(), key);

                    try {
                        return restTemplate.execute(url, HttpMethod.HEAD,
                            request -> request.getHeaders().addAll(headers),
                            response -> response.getStatusCode().is2xxSuccessful()
                        );
                    } catch (Exception e) {
                        if (e.getMessage() != null && (e.getMessage().contains("404") || e.getMessage().contains("Not Found"))) {
                            return false;
                        }
                        throw e;
                    }
                }),
                "Exists " + key
            );
        } catch (Exception e) {
            log.warn("Supabase existence check failed or returned false for key: {}", key, e);
            return false;
        }
    }

    @Override
    public String generatePublicUrl(String key) {
        String publicUrlPrefix = properties.getSupabase().getPublicUrl();
        if (publicUrlPrefix != null && !publicUrlPrefix.isBlank()) {
            String prefix = publicUrlPrefix.endsWith("/") ? publicUrlPrefix.substring(0, publicUrlPrefix.length() - 1) : publicUrlPrefix;
            String cleanKey = key.startsWith("/") ? key.substring(1) : key;
            return prefix + "/" + cleanKey;
        }
        return String.format("%s/object/public/%s/%s", getBaseUrl(), properties.getSupabase().getBucket(), key);
    }

    @Override
    public String generateSignedUrl(String key, int expirySeconds) {
        try {
            return executeWithRetry(() ->
                circuitBreaker.executeSupplier(() -> {
                    log.info("Generating signed URL on Supabase for key: {}, expiry: {}s", key, expirySeconds);
                    HttpHeaders headers = new HttpHeaders();
                    headers.set("apikey", properties.getSupabase().getServiceRoleKey());
                    headers.set("Authorization", "Bearer " + properties.getSupabase().getServiceRoleKey());
                    headers.setContentType(MediaType.APPLICATION_JSON);

                    Map<String, Object> body = Map.of("expiresIn", expirySeconds);
                    HttpEntity<Map<String, Object>> entity = new HttpEntity<>(body, headers);
                    String url = String.format("%s/object/sign/%s/%s", getBaseUrl(), properties.getSupabase().getBucket(), key);

                    ResponseEntity<SignedUrlResponse> response = restTemplate.exchange(url, HttpMethod.POST, entity, SignedUrlResponse.class);
                    if (!response.getStatusCode().is2xxSuccessful() || response.getBody() == null) {
                        throw new RuntimeException("Supabase sign URL returned status: " + response.getStatusCode());
                    }

                    String rawUrl = response.getBody().getUrl();
                    if (rawUrl == null) {
                        throw new RuntimeException("Supabase sign URL response body was empty");
                    }

                    if (rawUrl.startsWith("/")) {
                        return properties.getSupabase().getUrl() + rawUrl;
                    }
                    return rawUrl;
                }),
                "SignURL " + key
            );
        } catch (Exception e) {
            log.error("Supabase signed URL generation failed for key: {}", key, e);
            throw new RuntimeException("Supabase signed URL generation failed: " + e.getMessage(), e);
        }
    }

    @Data
    @JsonIgnoreProperties(ignoreUnknown = true)
    public static class SignedUrlResponse {
        @JsonProperty("signedURL")
        private String signedURL;

        @JsonProperty("signedUrl")
        private String signedUrl;

        public String getUrl() {
            return signedUrl != null ? signedUrl : signedURL;
        }
    }
}
