package com.mindrift.common.security;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigInteger;
import java.security.KeyFactory;
import java.security.PublicKey;
import java.security.spec.RSAPublicKeySpec;
import java.util.Base64;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Slf4j
@Service
public class ClerkJwkService {

    @Value("${clerk.jwks-url:https://api.clerk.com/v1/jwks}")
    private String jwksUrl;

    private final Map<String, PublicKey> keyCache = new ConcurrentHashMap<>();
    private final Map<String, java.time.Instant> negativeCache = new ConcurrentHashMap<>();
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private long lastFetchTime = 0L;

    public PublicKey getPublicKey(String kid) {
        if (kid == null || kid.isBlank()) {
            return null;
        }

        // 1. Check negative cache to reject known bad kids immediately
        java.time.Instant negativeExpiry = negativeCache.get(kid);
        if (negativeExpiry != null && negativeExpiry.isAfter(java.time.Instant.now())) {
            log.debug("Negative cache hit for invalid kid: {}", kid);
            return null;
        }

        if (keyCache.containsKey(kid)) {
            return keyCache.get(kid);
        }
        synchronized (this) {
            if (keyCache.containsKey(kid)) {
                return keyCache.get(kid);
            }

            // 2. Throttle network fetches to at most once per 60 seconds
            long now = System.currentTimeMillis();
            if (now - lastFetchTime > 60000) {
                lastFetchTime = now;
                log.info("Key not found in cache for kid: {}. Fetching JWKS from Clerk...", kid);
                fetchJwks();
            } else {
                log.warn("JWKS fetch throttled (last fetch < 60s ago). Skipping network call for kid: {}", kid);
            }

            PublicKey key = keyCache.get(kid);
            if (key == null) {
                // 3. Store in negative cache for 5 minutes to prevent recurring hits
                negativeCache.put(kid, java.time.Instant.now().plusSeconds(300));
                log.warn("Cached invalid kid '{}' in negative cache for 5 minutes", kid);
            }
            return key;
        }
    }

    private void fetchJwks() {
        try {
            log.info("Fetching JWKS from endpoint: {}", jwksUrl);
            String response = restTemplate.getForObject(jwksUrl, String.class);
            if (response == null) {
                log.error("Empty JWKS response from {}", jwksUrl);
                return;
            }
            JsonNode root = objectMapper.readTree(response);
            JsonNode keys = root.get("keys");
            if (keys == null || !keys.isArray()) {
                log.error("Invalid JWKS structure: keys field is missing or not an array");
                return;
            }
            for (JsonNode keyNode : keys) {
                String kid = keyNode.get("kid").asText();
                String kty = keyNode.get("kty").asText();
                if ("RSA".equals(kty)) {
                    String nStr = keyNode.get("n").asText();
                    String eStr = keyNode.get("e").asText();
                    PublicKey publicKey = generateRsaPublicKey(nStr, eStr);
                    if (publicKey != null) {
                        keyCache.put(kid, publicKey);
                        log.info("Successfully cached public key for kid: {}", kid);
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to fetch or parse JWKS from {}", jwksUrl, e);
        }
    }

    private PublicKey generateRsaPublicKey(String nStr, String eStr) {
        try {
            byte[] nBytes = Base64.getUrlDecoder().decode(nStr);
            byte[] eBytes = Base64.getUrlDecoder().decode(eStr);
            BigInteger modulus = new BigInteger(1, nBytes);
            BigInteger exponent = new BigInteger(1, eBytes);
            RSAPublicKeySpec spec = new RSAPublicKeySpec(modulus, exponent);
            KeyFactory factory = KeyFactory.getInstance("RSA");
            return factory.generatePublic(spec);
        } catch (Exception e) {
            log.error("Error generating RSA public key from n and e values", e);
            return null;
        }
    }
}
