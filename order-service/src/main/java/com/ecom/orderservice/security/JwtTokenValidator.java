package com.ecom.orderservice.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.util.List;

@Component
public class JwtTokenValidator {

    private final SecretKey signingKey;

    public JwtTokenValidator(@Value("${app.jwt.secret}") String secret) {
        this.signingKey = Keys.hmacShaKeyFor(secret.getBytes());
    }

    /**
     * Parses and verifies the token, returning a populated Authentication.
     * Throws JwtException (unchecked) if the token is invalid or expired.
     */
    public Authentication toAuthentication(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(signingKey)
                .build()
                .parseSignedClaims(token)
                .getPayload();

        String subject = claims.getSubject();

        @SuppressWarnings("unchecked")
        List<String> roles = claims.get("roles", List.class);

        List<SimpleGrantedAuthority> authorities = (roles == null ? List.<String>of() : roles).stream()
                .map(SimpleGrantedAuthority::new)
                .toList();

        return new UsernamePasswordAuthenticationToken(subject, null, authorities);
    }

    public boolean isValid(String token) {
        try {
            Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token);
            return true;
        } catch (JwtException | IllegalArgumentException e) {
            return false;
        }
    }
}
