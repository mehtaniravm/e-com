# E-Commerce Platform

Full-stack e-commerce platform built with Spring Boot microservices and a React frontend. Features JWT authentication, role-based access control, order lifecycle management, and a complete test pyramid (unit → integration → E2E).

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│  React 18 + TypeScript (Vite)        :3000           │
│  AuthContext · PrivateRoute · Axios interceptor      │
└───────────────┬─────────────────────────────────────┘
                │ /api/auth, /api/users  →  :8081
                │ /api/orders            →  :8082
┌───────────────▼──────────┐  ┌──────────────────────┐
│  user-service   :8081    │  │  order-service  :8082 │
│  Spring Boot 3.2         │  │  Spring Boot 3.2      │
│  JWT sign + verify       │  │  JWT verify only      │
│  BCrypt passwords        │  │  Order state machine  │
│  RBAC (USER / ADMIN)     │  │  PENDING→CONFIRMED    │
└───────────────┬──────────┘  │  →SHIPPED/CANCELLED   │
                │             └──────────┬────────────┘
    ┌───────────▼──────┐     ┌───────────▼──────┐
    │  PostgreSQL       │     │  PostgreSQL       │
    │  userdb  :5432    │     │  orderdb  :5433   │
    └──────────────────┘     └──────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Language | Java 17, TypeScript 5 |
| Backend framework | Spring Boot 3.2.5 |
| Security | Spring Security 6, JJWT 0.12.6 |
| Persistence | Spring Data JPA, Hibernate 6, PostgreSQL 16 |
| Build tool | Maven 3.9 (multi-module) |
| Frontend | React 18, Vite 5, React Router v6, Axios |
| Containerisation | Docker Compose (PostgreSQL only) |
| Unit tests | JUnit 5, Mockito, AssertJ |
| Integration tests | Spring Boot Test, Testcontainers, @Sql |
| E2E tests | Playwright 1.44, TypeScript |
| Coverage | JaCoCo 0.8.12 |

---

## Project Structure

```
ecom-parent/
├── pom.xml                          # parent POM — Spring Boot 3.2.5, Java 17
├── docker-compose.yml               # PostgreSQL for both services
├── CLAUDE.md                        # coding standards
│
├── user-service/                    # Auth + user management → :8081
│   ├── src/main/java/com/ecom/userservice/
│   │   ├── controller/              # AuthController, UserController
│   │   ├── service/                 # UserService
│   │   ├── security/                # JwtTokenProvider, JwtAuthFilter, CustomUserDetailsService
│   │   ├── entity/                  # User (UUID PK), Role enum
│   │   ├── dto/                     # RegisterRequest, LoginRequest, LoginResponse, UserDTO
│   │   ├── repository/              # UserRepository
│   │   ├── config/                  # SecurityConfig (@EnableMethodSecurity)
│   │   └── exception/               # GlobalExceptionHandler (RFC 9457 ProblemDetail)
│   └── src/test/java/com/ecom/userservice/
│       ├── UserServiceApplicationTests.java   # context load (H2)
│       ├── service/UserServiceTest.java        # 7 Mockito unit tests
│       └── integration/AuthIntegrationTest.java # 7 Testcontainers tests
│
├── order-service/                   # Order management → :8082
│   ├── src/main/java/com/ecom/orderservice/
│   │   ├── controller/              # OrderController
│   │   ├── service/                 # OrderService + state machine
│   │   ├── security/                # JwtTokenValidator, JwtAuthFilter (no UserDetailsService)
│   │   ├── entity/                  # Order, OrderItem, OrderStatus enum
│   │   ├── dto/                     # CreateOrderRequest, OrderResponse, UpdateStatusRequest
│   │   ├── repository/              # OrderRepository (findByIdWithItems JOIN FETCH)
│   │   └── exception/               # GlobalExceptionHandler
│   └── src/test/java/com/ecom/orderservice/
│       ├── OrderServiceApplicationTests.java
│       ├── service/OrderServiceTest.java       # 9 Mockito unit tests
│       └── integration/
│           ├── OrderLifecycleIntegrationTest.java  # 7 Testcontainers tests
│           └── TestJwtHelper.java
│
├── frontend/                        # React SPA → :3000
│   ├── src/
│   │   ├── api/                     # axiosInstance (Bearer interceptor), authApi, userApi, orderApi
│   │   ├── context/AuthContext.tsx  # JWT decode, localStorage, useAuth()
│   │   ├── components/
│   │   │   ├── Layout.tsx           # sidebar nav, sign-out
│   │   │   ├── PrivateRoute.tsx     # auth + role guard
│   │   │   └── ui/                  # Badge, Modal, Spinner
│   │   ├── pages/
│   │   │   ├── LoginPage.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── UserManagementPage.tsx  # ADMIN only — search, edit, status toggle
│   │   │   └── OrdersPage.tsx          # create order, timeline, status advance
│   │   └── router/index.tsx         # createBrowserRouter, nested PrivateRoute
│   └── vite.config.ts               # /api/* proxy to :8081/:8082
│
└── e2e/                             # Playwright E2E tests
    ├── playwright.config.ts
    ├── global-setup.ts              # seeds admin via pg+bcryptjs, customer via API
    ├── global-teardown.ts
    └── tests/journey.spec.ts        # 6 tests across 3 describe blocks
```

---

## Prerequisites

| Tool | Version | Install |
|---|---|---|
| JDK | 17 (Temurin) | `choco install temurin17` |
| Maven | 3.9+ | `choco install maven` |
| Node.js | 18+ | `choco install nodejs` |
| Docker Desktop | latest | `choco install docker-desktop` |
| gh CLI (optional) | latest | `choco install gh` |

> **Windows:** After `choco install`, open a new terminal so PATH is refreshed.  
> **macOS/Linux:** Replace `choco install X` with `brew install X` or the equivalent.

---

## Local Setup — Step by Step

### 1. Clone the repo

```bash
git clone https://github.com/mehtaniravm/e-com.git
cd e-com
```

### 2. Start databases

```bash
docker compose up -d
```

Starts two PostgreSQL 16 containers:
- `user-db` → `localhost:5432` / db `userdb`
- `order-db` → `localhost:5433` / db `orderdb`

### 3. Start user-service

```bash
cd user-service
mvn spring-boot:run
# Listening on http://localhost:8081
```

### 4. Start order-service

```bash
cd order-service
mvn spring-boot:run
# Listening on http://localhost:8082
```

### 5. Start frontend

```bash
cd frontend
npm install
npm run dev
# Listening on http://localhost:3000
```

Open **http://localhost:3000** in your browser.

---

## Environment Variables

All have sensible defaults for local development. Override via shell or `.env`-aware tooling.

| Variable | Default | Used by |
|---|---|---|
| `DB_HOST` | `localhost` | both services |
| `DB_USERNAME` | `postgres` | both services |
| `DB_PASSWORD` | `postgres` | both services |
| `JWT_SECRET` | 64-char hex string | both services |
| `JWT_EXPIRATION_MS` | `86400000` (24 h) | user-service |
| `BASE_URL` | `http://localhost:3000` | Playwright |
| `USER_SERVICE_URL` | `http://localhost:8081` | Playwright globalSetup |

---

## API Reference

### user-service (`:8081`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/auth/register` | public | Register new user (role: USER) |
| `POST` | `/api/auth/login` | public | Login → `{ accessToken, tokenType, userId, email, role }` |
| `GET` | `/api/users` | ADMIN | List all users |
| `GET` | `/api/users/{id}` | authenticated | Get user by ID |
| `PUT` | `/api/users/{id}` | authenticated | Update firstName, lastName, role, enabled |
| `DELETE` | `/api/users/{id}` | ADMIN | Delete user |

### order-service (`:8082`)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/orders` | authenticated | Create order with items |
| `GET` | `/api/orders/{id}` | authenticated | Get order (JOIN FETCH items) |
| `GET` | `/api/orders/user/{userId}` | authenticated | List orders for user |
| `PUT` | `/api/orders/{id}/status` | authenticated | Advance status |
| `DELETE` | `/api/orders/{id}` | authenticated | Cancel order |

**Order state machine:**

```
PENDING ──→ CONFIRMED ──→ SHIPPED  (terminal)
   │              │
   └──────────────┴──→ CANCELLED  (terminal)
```

---

## Running Tests

### Unit tests (no infrastructure needed)

```bash
mvn test
# user-service:  7 tests  ✓
# order-service: 9 tests  ✓
```

### Unit tests + coverage report

```bash
mvn verify -Pcoverage
# HTML report: {module}/target/site/jacoco/index.html
```

Open the report:
```bash
# Windows
start user-service/target/site/jacoco/index.html
start order-service/target/site/jacoco/index.html

# macOS
open user-service/target/site/jacoco/index.html
```

### Integration tests (requires Docker)

```bash
mvn verify -Pintegration          # Testcontainers tests only
mvn verify -Pcoverage -Pintegration  # + coverage report
```

Testcontainers spins up a PostgreSQL container per test class — no manual DB setup needed.

| Test class | Tests | What it covers |
|---|---|---|
| `AuthIntegrationTest` | 7 | register→login flow, admin RBAC, 403/401 responses |
| `OrderLifecycleIntegrationTest` | 7 | order CRUD, state machine, seeded SQL data |

### E2E tests (requires full stack running)

```bash
# Install browser once
cd e2e && npm install && npm run install:browsers

# Run (all services must be up)
npx playwright test --reporter=html

# Open HTML report
npx playwright show-report
```

| Test | Scenario |
|---|---|
| Full user journey | Admin login → edit customer → customer login → create order → assert PENDING |
| Wrong password | `.login-error` message shown |
| Unauthenticated redirect | `/dashboard` → `/login` |
| Customer blocked from `/admin/users` | Redirected to `/dashboard` |
| Admin advances order | PENDING → CONFIRMED → SHIPPED |
| Customer cancels order | PENDING → CANCELLED badge |

---

## What Was Built (Session Summary)

This project was generated end-to-end using Claude Code. Below is a bullet-point log of every task completed.

### Phase 1 — Scaffold

- Created Maven multi-module parent POM (`ecom-parent`, Spring Boot 3.2.5, Java 17)
- Bootstrapped `user-service` module: Spring Web, Security, JPA, Validation, PostgreSQL, JJWT 0.12.6
- Bootstrapped `order-service` module: same stack, no UserDetailsService (JWT-verify only)
- Created `docker-compose.yml` with two PostgreSQL 16 containers (`user-db :5432`, `order-db :5433`)
- Created `CLAUDE.md` with coding standards (layer order, naming, security rules)

### Phase 2 — user-service implementation

- `User` entity: UUID PK (`GenerationType.UUID`), email (unique), BCrypt password, `Role` enum (`USER`/`ADMIN`), `enabled`, `@CreationTimestamp`/`@UpdateTimestamp`
- `UserRepository` with `existsByEmail`, `findByEmail`
- `JwtTokenProvider`: JJWT 0.12.x API (`Jwts.parser().verifyWith(key).build()`), 24 h expiry, embeds `roles` claim
- `JwtAuthenticationFilter` (`OncePerRequestFilter`): extracts Bearer token, loads `UserDetails`, sets `SecurityContextHolder`; returns **401** when token is present but expired/invalid
- `SecurityConfig`: stateless sessions, `DaoAuthenticationProvider`, `@EnableMethodSecurity`, `DELETE /api/users/**` → `ROLE_ADMIN`
- `AuthController`: `POST /api/auth/register` → 201, `POST /api/auth/login` → 200 + `LoginResponse`
- `UserController`: GET/PUT/DELETE with `@PreAuthorize` on ADMIN-only endpoints
- `GlobalExceptionHandler`: RFC 9457 `ProblemDetail` for `UserNotFoundException` (404), `EmailAlreadyExistsException` (409), `BadCredentialsException` (401), `AccessDeniedException` (403)

### Phase 3 — order-service implementation

- `Order` entity: UUID PK, `userId` (plain UUID — no FK across services), `OrderStatus` enum, `totalAmount`, lazy `@OneToMany` items
- `OrderItem` entity: subtotal computed in constructor (`unitPrice × quantity`)
- `OrderStatus` state machine encoded directly in the enum via `canTransitionTo()` switch expression
- `JwtTokenValidator`: parses and verifies token without `UserDetailsService` (trusts claims after signature check)
- `OrderController`: full CRUD + `PUT /{id}/status`
- `OrderRepository`: `findByUserIdOrderByCreatedAtDesc`, `@Query` with `JOIN FETCH` for items
- `GlobalExceptionHandler`: `InvalidStatusTransitionException` → 422, `OrderNotFoundException` → 404

### Phase 4 — React frontend

- `AuthContext`: JWT decode via `atob()`, expiry check, `localStorage` persistence (`access_token`, `auth_user`), `useAuth()` hook
- `PrivateRoute`: redirects unauthenticated → `/login`; wrong role → `/dashboard`
- `axiosInstance`: Axios interceptor reads `access_token` from `localStorage`, attaches `Authorization: Bearer`
- `LoginPage`: controlled form, 401 error message, redirect on success
- `Dashboard`: role-aware quick-nav cards (User Management visible to ADMIN only)
- `UserManagementPage` (ADMIN only): user table with search, inline status toggle, edit modal (first/last name, role chip selector, active toggle)
- `OrdersPage`: order table, `StatusTimeline` (PENDING→CONFIRMED→SHIPPED dots), `OrderDetailModal` with admin advance button, `CreateOrderModal` with dynamic item rows
- Vite proxy: `/api/auth`, `/api/users` → `:8081`; `/api/orders` → `:8082`

### Phase 5 — Test infrastructure

- Added H2 in-memory test config (`application-test.yml`) to both services (`MODE=PostgreSQL`, `ddl-auto: create-drop`)
- `UserServiceApplicationTests` and `OrderServiceApplicationTests`: context load smoke tests with `@ActiveProfiles("test")`
- Fixed `UserDetailsServiceAutoConfiguration` warning in order-service

### Phase 6 — Unit tests (Mockito)

- **`UserServiceTest`** (7 tests): `testRegisterUser_success`, `testRegisterUser_emailAlreadyExists`, `testLogin_validCredentials_returnsToken`, `testLogin_invalidPassword_throws401`, `testGetUser_adminRole_success`, `testGetUser_customerRole_accessDenied`, `testDeactivateUser_locksAccount`
- **`OrderServiceTest`** (9 tests): create with total calculation, get found/not-found, list by user, valid/invalid status transitions, cancel from PENDING/SHIPPED

### Phase 7 — Integration tests (Testcontainers)

- Added `spring-boot-testcontainers`, `testcontainers:junit-jupiter`, `testcontainers:postgresql` to both service POMs
- Updated both `JwtAuthenticationFilter` implementations: present-but-invalid/expired token → **401** (previously swallowed as 403)
- **`AuthIntegrationTest`** (7 tests): `@SpringBootTest(MOCK)` + `@AutoConfigureMockMvc` + `PostgreSQLContainer`; `@DynamicPropertySource` overrides datasource + JWT secret; `@BeforeEach` seeds users via `JdbcTemplate` + `BCryptPasswordEncoder`; `@Sql(AFTER_TEST_METHOD)` cleanup
- **`OrderLifecycleIntegrationTest`** (7 tests): `TestJwtHelper` generates signed JWTs; `@Sql("/sql/order-seed.sql")` seeds known orders for list test; cleanup via class-level `@SqlMergeMode(MERGE)` + `@Sql(AFTER_TEST_METHOD)`
- SQL files: `user-cleanup.sql`, `order-seed.sql`, `order-cleanup.sql`

### Phase 8 — Coverage

- Added JaCoCo 0.8.12 to parent POM under `-Pcoverage` profile
- Configured Surefire to exclude `**/integration/**` by default (Docker required); re-enabled via `-Pintegration` profile
- Baseline coverage (unit + H2 tests only): user-service ~47% lines, order-service ~55% lines
- Coverage gap: controller layer, JWT filters, SecurityConfig — targeted by Testcontainers integration tests and future `@WebMvcTest` slices

### Phase 9 — E2E tests (Playwright)

- Created `e2e/` directory with own `package.json`, `tsconfig.json`, `playwright.config.ts`
- `global-setup.ts`: seeds admin via `pg` client + `bcryptjs` hash, registers customer via `fetch` to user-service API
- `global-teardown.ts`: deletes all `@e2e.test` users
- `tests/journey.spec.ts` (6 tests):
  - **Full user journey**: admin login → navigate User Management → edit customer name → sign out → customer login → create order → assert PENDING badge + correct total
  - **Auth**: wrong password error message, unauthenticated redirect, customer RBAC block
  - **Order lifecycle**: admin advances PENDING→CONFIRMED→SHIPPED; customer cancels PENDING order
- `workers: 1` (sequential — tests share real DB state)
- `.gitignore` excludes `node_modules/`, `playwright-report/`, `test-results/`

### Phase 10 — Git history

| Commit | Message |
|---|---|
| `d3148c8` | `feat: initial e-commerce platform scaffold` |
| `9987da9` | `test(user-service): add UserService unit tests with Mockito` |
| `b7de4a2` | `test(order-service): add OrderService unit tests with Mockito` |
| `9a34366` | `test: add Testcontainers integration tests for auth and order lifecycle` |
| `685504d` | `test(e2e): add Playwright TypeScript E2E tests` |
| `056cf47` | `chore(e2e): remove node_modules from tracking, add .gitignore` |
| `315af37` | `build: add JaCoCo coverage + Surefire exclude for integration tests` |

---

## Key Design Decisions

| Decision | Rationale |
|---|---|
| order-service has no `UserDetailsService` | Cross-service DB calls add latency and coupling; JWT signature verification is sufficient |
| `OrderStatus.canTransitionTo()` in enum | State machine co-located with the type it guards; no separate strategy class needed |
| Axios interceptor reads from `localStorage` directly | Avoids threading React context into the interceptor; both AuthContext and Axios share the same key |
| `@DynamicPropertySource` for Testcontainers | Zero test pollution — each test class gets its own fresh PG container with `create-drop` schema |
| JWT filter returns 401 (not 403) for bad token | Present-but-invalid token = bad credentials (401); missing token = unauthenticated anonymous (403 via Spring Security default) |
| `bcryptjs` in Playwright globalSetup | Pure-JS BCrypt (no native bindings) generates valid Spring-compatible hashes without a running app |
| Surefire excludes `**/integration/**` by default | Integration tests require Docker; CI without Docker still gets a fast unit-test pass |

---

## Roadmap (TODOs from CLAUDE.md)

- [ ] Add Flyway migrations to both services (currently `ddl-auto: validate` in prod)
- [ ] Add `@WebMvcTest` slice tests for controllers → push line coverage to 80%+
- [ ] Add inter-service communication (OpenFeign or WebClient) for order→user lookup
- [ ] Configure test profiles with Testcontainers as the default (replace H2)
- [ ] Add `data-testid` attributes to React components for more stable E2E selectors
- [ ] Add a CI pipeline (GitHub Actions) running `mvn verify -Pcoverage` + Playwright
