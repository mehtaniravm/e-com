package com.ecom.orderservice.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.context.jdbc.Sql;
import org.springframework.test.context.jdbc.SqlMergeMode;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.util.UUID;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@Testcontainers
@SqlMergeMode(SqlMergeMode.MergeMode.MERGE)
@Sql(scripts = "/sql/order-cleanup.sql", executionPhase = Sql.ExecutionPhase.AFTER_TEST_METHOD)
class OrderLifecycleIntegrationTest {

    @Container
    static final PostgreSQLContainer<?> POSTGRES =
            new PostgreSQLContainer<>("postgres:16-alpine").withDatabaseName("orderdb");

    @DynamicPropertySource
    static void configureDataSource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("spring.jpa.hibernate.ddl-auto", () -> "create-drop");
        registry.add("app.jwt.secret", () -> TestJwtHelper.JWT_SECRET);
    }

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper mapper;

    private static final UUID USER_ID = UUID.randomUUID();

    // ── helpers ──────────────────────────────────────────────────────────────

    private String bearerToken() {
        return "Bearer " + TestJwtHelper.validToken(USER_ID, "USER");
    }

    private String createOrderAndGetId() throws Exception {
        String body = orderBody(USER_ID);
        MvcResult result = mvc.perform(post("/api/orders")
                        .header("Authorization", bearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode json = mapper.readTree(result.getResponse().getContentAsString());
        return json.get("id").asText();
    }

    private static String orderBody(UUID userId) {
        return """
                {
                  "userId": "%s",
                  "items": [
                    {
                      "productId": "%s",
                      "productName": "Widget",
                      "quantity": 2,
                      "unitPrice": 14.99
                    }
                  ]
                }
                """.formatted(userId, UUID.randomUUID());
    }

    private void advanceStatus(String orderId, String status) throws Exception {
        mvc.perform(put("/api/orders/" + orderId + "/status")
                        .header("Authorization", bearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"" + status + "\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value(status));
    }

    // ── tests ─────────────────────────────────────────────────────────────────

    @Test
    void createOrder_returns201WithPendingStatus() throws Exception {
        mvc.perform(post("/api/orders")
                        .header("Authorization", bearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(orderBody(USER_ID)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.userId").value(USER_ID.toString()))
                .andExpect(jsonPath("$.totalAmount").value(29.98))
                .andExpect(jsonPath("$.items.length()").value(1));
    }

    @Test
    void orderLifecycle_createConfirmShip() throws Exception {
        String id = createOrderAndGetId();

        // PENDING → CONFIRMED
        advanceStatus(id, "CONFIRMED");

        // CONFIRMED → SHIPPED (terminal positive state — no DELIVERED in this domain)
        advanceStatus(id, "SHIPPED");

        mvc.perform(get("/api/orders/" + id)
                        .header("Authorization", bearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SHIPPED"));
    }

    @Test
    void cancelOrder_fromPending_returns204() throws Exception {
        String id = createOrderAndGetId();

        mvc.perform(delete("/api/orders/" + id)
                        .header("Authorization", bearerToken()))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/orders/" + id)
                        .header("Authorization", bearerToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
    }

    @Test
    void invalidTransition_shippedToPending_returns422() throws Exception {
        String id = createOrderAndGetId();
        advanceStatus(id, "CONFIRMED");
        advanceStatus(id, "SHIPPED");

        mvc.perform(put("/api/orders/" + id + "/status")
                        .header("Authorization", bearerToken())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"PENDING\"}"))
                .andExpect(status().isUnprocessableEntity());
    }

    @Test
    @Sql("/sql/order-seed.sql")
    void getOrdersByUser_seededOrders_returnsList() throws Exception {
        String token = "Bearer " + TestJwtHelper.validToken(TestJwtHelper.SEEDED_USER_ID, "USER");

        mvc.perform(get("/api/orders/user/" + TestJwtHelper.SEEDED_USER_ID)
                        .header("Authorization", token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray())
                .andExpect(jsonPath("$.length()").value(2));
    }

    @Test
    void noToken_returns403() throws Exception {
        mvc.perform(get("/api/orders/user/" + USER_ID))
                .andExpect(status().isForbidden());
    }

    @Test
    void expiredJwt_returns401() throws Exception {
        String expired = "Bearer " + TestJwtHelper.expiredToken(USER_ID, "USER");

        mvc.perform(get("/api/orders/user/" + USER_ID)
                        .header("Authorization", expired))
                .andExpect(status().isUnauthorized());
    }
}
