# CLAUDE.md – E-Commerce Platform

Coding standards and conventions for this project. Update each section with the team's actual rules.

---

## Project layout

```
ecom-parent/
├── pom.xml                  # parent POM (Spring Boot 3.2, Java 17)
├── user-service/            # auth + user management  → port 8081
├── order-service/           # order management        → port 8082
├── frontend/                # Vite + React 18 + TS    → port 3000
└── docker-compose.yml       # PostgreSQL for both services
```

---

## Java / Spring Boot

<!-- TODO: paste your Java coding standards here -->

- Java version: **17** (records, sealed classes, text blocks are allowed)
- Spring Boot: **3.2.x**
- Package root: `com.ecom.<service-name>`
- Layer order: `controller → service → repository`
- DTOs live in a `dto` sub-package; entities live in `entity`
- Use `@Valid` on controller method parameters, never inside service layer
- Return `ResponseEntity<T>` from controllers for explicit status codes
- Never expose JPA entities directly in API responses
- Use constructor injection (not `@Autowired` field injection)
- `ddl-auto: validate` in all non-test environments (use Flyway/Liquibase for migrations)

---

## Security (user-service)

<!-- TODO: paste your security standards here -->

- Stateless sessions (JWT-based); no HTTP session
- Passwords hashed with `BCryptPasswordEncoder`
- Public endpoints listed explicitly in `SecurityConfig`; everything else is authenticated

---

## React / TypeScript

<!-- TODO: paste your frontend standards here -->

- TypeScript strict mode is enabled — no `any`
- Components: functional only, named exports
- File naming: `PascalCase.tsx` for components, `camelCase.ts` for utilities
- API calls go through `src/api/axiosInstance.ts` — never use `fetch` directly
- Routing via React Router v6 (`createBrowserRouter`)
- Path alias `@/` maps to `src/`

---

## Naming conventions

| Artifact | Convention |
|---|---|
| Java classes | `PascalCase` |
| Java methods / variables | `camelCase` |
| REST endpoints | `kebab-case` (`/api/user-profiles`) |
| DB tables / columns | `snake_case` |
| TS interfaces | `PascalCase` (no `I` prefix) |
| TS enums | `PascalCase` |
| React components | `PascalCase` |
| CSS classes | `kebab-case` |

---

## Git & branching

<!-- TODO: paste your branching strategy here -->

- Branch pattern: `feature/<ticket>-short-description`
- Commit messages: imperative mood, ≤72 chars subject line
- PRs require at least one approval before merge

---

## Running locally

```bash
# Start databases
docker compose up -d

# user-service
cd user-service && mvn spring-boot:run

# order-service
cd order-service && mvn spring-boot:run

# frontend
cd frontend && npm install && npm run dev
```

---

## Environment variables

| Variable | Default | Used by |
|---|---|---|
| `DB_HOST` | `localhost` | both services |
| `DB_USERNAME` | `postgres` | both services |
| `DB_PASSWORD` | `postgres` | both services |

---

## TODO

- [ ] Add Flyway migrations to both services
- [ ] Wire JWT filter into `SecurityConfig`
- [ ] Add inter-service communication (OpenFeign or WebClient)
- [ ] Configure test profiles with H2 or Testcontainers
