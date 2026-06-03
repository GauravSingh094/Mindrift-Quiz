package com.mindrift.common.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.security.PublicKey;

@Slf4j
@Service
@RequiredArgsConstructor
public class JwtTokenService {

    private final ClerkJwkService clerkJwkService;

    public Claims parseToken(String token) {
        try {
            // Standard parse of JWT unsigned header first to get kid
            int firstDot = token.indexOf('.');
            int secondDot = token.indexOf('.', firstDot + 1);
            if (firstDot <= 0 || secondDot <= 0) {
                log.error("Malformed JWT structure");
                return null;
            }
            String withoutSignature = token.substring(0, secondDot + 1);
            // Parse token header without verifying signature
            var headerClaims = Jwts.parser().build().parse(withoutSignature);
            var header = headerClaims.getHeader();
            String kid = (String) header.get("kid");
            if (kid == null) {
                log.error("JWT token header is missing kid claim");
                return null;
            }

            PublicKey publicKey = clerkJwkService.getPublicKey(kid);
            if (publicKey == null) {
                log.error("Failed to retrieve matching public key for kid: {}", kid);
                return null;
            }

            // Fully verify signature and parse body
            return Jwts.parser()
                    .verifyWith(publicKey)
                    .build()
                    .parseSignedClaims(token)
                    .getPayload();
        } catch (Exception e) {
            log.error("JWT token signature validation failed: {}", e.getMessage());
            return null;
        }
    }
}
