package com.ecom.orderservice.integration;

import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;
import java.util.UUID;

class TestJwtHelper {

    // Must match the value injected via @DynamicPropertySource in the integration test
    static final String JWT_SECRET =
            "integration-test-secret-key-must-be-at-least-32-bytes-long-padding!!";

    // The user_id seeded into order-seed.sql
    static final UUID SEEDED_USER_ID = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    static String validToken(UUID userId, String role) {
        Date now = new Date();
        return Jwts.builder()
                .subject(userId.toString())
                .claim("roles", List.of("ROLE_" + role))
                .issuedAt(now)
                .expiration(new Date(now.getTime() + 3_600_000))
                .signWith(signingKey())
                .compact();
    }

    static String expiredToken(UUID userId, String role) {
        return Jwts.builder()
                .subject(userId.toString())
                .claim("roles", List.of("ROLE_" + role))
                .issuedAt(new Date(1000))
                .expiration(new Date(2000))
                .signWith(signingKey())
                .compact();
    }

    private static SecretKey signingKey() {
        return Keys.hmacShaKeyFor(JWT_SECRET.getBytes());
    }
}
