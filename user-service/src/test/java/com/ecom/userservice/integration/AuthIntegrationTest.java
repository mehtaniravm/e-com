package com.ecom.userservice.integration;

import com.fasterxml.jackson.databind.ObjectMapper;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.context.jdbc.SqlMergeMode;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import javax.crypto.SecretKey;
import java.util.Date;
import java.util.List;
import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Testcontainers
@SqlMergeMode(SqlMergeMode.MergeMode.MERGE)
@Sql(scripts = "/sql/user-cleanup.sql", executionPhase = Sql.ExecutionPhase.AFTER_TEST_METHOD)
class AuthIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:16-alpine").withDatabaseName("userdb");

    static final String JWT_SECRET =
            "integration-test-secret-key-must-be-at-least-32-bytes-long-padding!!";

    private static final BCryptPasswordEncoder ENCODER = new BCryptPasswordEncoder();
    private static final String ADMIN_HASH = ENCODER.encode("Admin@123!");
    private static final String CUSTOMER_HASH = ENCODER.encode("Customer@1!");

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("app.jwt.secret", () -> JWT_SECRET);
        registry.add("app.jwt.expiration-ms", () -> "3600000");
    }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;
    @Autowired JdbcTemplate jdbc;

    private static final String ADMIN_EMAIL = "admin@test.com";
    private static final String CUSTOMER_EMAIL = "customer@test.com";
    private static UUID adminId;

    @BeforeEach
    void seedUsers() {
        adminId = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO users (id, email, password, first_name, last_name, role, enabled, created_at, updated_at)
                VALUES (?, ?, ?, 'Admin', 'Test', 'ADMIN', true, NOW(), NOW())
                """, adminId, ADMIN_EMAIL, ADMIN_HASH);

        jdbc.update("""
                INSERT INTO users (id, email, password, first_name, last_name, role, enabled, created_at, updated_at)
                VALUES (gen_random_uuid(), ?, ?, 'Customer', 'Test', 'USER', true, NOW(), NOW())
                """, CUSTOMER_EMAIL, CUSTOMER_HASH);
    }

    // ── helpers ──────────────────────────────────────────────────────────────

    private String loginAndGetToken(String email, String password) throws Exception {
        String body = """
                {"email":"%s","password":"%s"}
                """.formatted(email, password);
        String response = mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();
        return mapper.readTree(response).get("accessToken").asText();
    }

    private static String expiredToken() {
        SecretKey key = Keys.hmacShaKeyFor(JWT_SECRET.getBytes());
        return Jwts.builder()
                .subject("stale@test.com")
                .claim("roles", List.of("ROLE_USER"))
                .issuedAt(new Date(1000))
                .expiration(new Date(2000))
                .signWith(key)
                .compact();
    }

    // ── tests ─────────────────────────────────────────────────────────────────

    @Test
    void fullAuthFlow_register_thenLogin_returnsToken() throws Exception {
        String registerBody = """
                {"email":"newuser@test.com","password":"NewPass@1!","firstName":"New","lastName":"User"}
                """;
        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(registerBody))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.email").value("newuser@test.com"))
                .andExpect(jsonPath("$.role").value("USER"));

        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"newuser@test.com","password":"NewPass@1!"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.email").value("newuser@test.com"));
    }

    @Test
    void register_duplicateEmail_returns409() throws Exception {
        String body = """
                {"email":"%s","password":"AnyPass@1!","firstName":"Dup","lastName":"User"}
                """.formatted(CUSTOMER_EMAIL);
        mvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isConflict());
    }

    @Test
    void login_wrongPassword_returns401() throws Exception {
        mvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"email":"%s","password":"WrongPass@1!"}
                                """.formatted(ADMIN_EMAIL)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void admin_canListAllUsers() throws Exception {
        String token = loginAndGetToken(ADMIN_EMAIL, "Admin@123!");

        mvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void customer_cannotDeleteUser_returns403() throws Exception {
        String token = loginAndGetToken(CUSTOMER_EMAIL, "Customer@1!");

        mvc.perform(delete("/api/users/" + adminId)
                        .header("Authorization", "Bearer " + token))
                .andExpect(status().isForbidden());
    }

    @Test
    void protectedEndpoint_noToken_returns403() throws Exception {
        mvc.perform(get("/api/users"))
                .andExpect(status().isForbidden());
    }

    @Test
    void expiredJwt_returns401() throws Exception {
        mvc.perform(get("/api/users")
                        .header("Authorization", "Bearer " + expiredToken()))
                .andExpect(status().isUnauthorized());
    }
}
