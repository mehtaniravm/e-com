import { useState } from "react";

const sprintData = [
  {
    id: 1,
    title: "Sprint 1",
    subtitle: "Foundation",
    theme: "AUTH · USER CRUD · PROJECT SETUP",
    color: "#C8F542",
    accent: "#8fb82e",
    totalSP: 26,
    stories: [
      {
        id: "US-01",
        title: "User Registration & Login",
        sp: 8,
        dod: [
          "JWT auth working end-to-end",
          "Password hashed with bcrypt",
          "Refresh token flow tested",
          "Unit tests ≥ 80% coverage",
        ],
        risks: ["Token expiry edge cases", "Brute-force rate limiting not scoped"],
        tracks: {
          backend: [
            { task: "Set up Express/FastAPI project scaffold", hrs: 3 },
            { task: "Implement /register & /login endpoints", hrs: 4 },
            { task: "JWT issuance + refresh token logic", hrs: 4 },
            { task: "Write auth unit tests", hrs: 3 },
          ],
          frontend: [
            { task: "Bootstrap React app + routing skeleton", hrs: 3 },
            { task: "Build Login & Register form components", hrs: 4 },
            { task: "Wire auth API calls + token storage", hrs: 3 },
            { task: "Protected route HOC", hrs: 2 },
          ],
        },
      },
      {
        id: "US-02",
        title: "User Profile CRUD",
        sp: 5,
        dod: [
          "GET/PUT/DELETE /users/:id secured",
          "Input validation on all fields",
          "Postman collection updated",
        ],
        risks: ["Soft-delete vs hard-delete decision needed early"],
        tracks: {
          backend: [
            { task: "User model + DB migrations", hrs: 2 },
            { task: "CRUD endpoints with validation", hrs: 4 },
            { task: "Integration tests for user routes", hrs: 2 },
          ],
          frontend: [
            { task: "Profile page UI", hrs: 3 },
            { task: "Edit profile form + API wiring", hrs: 3 },
          ],
        },
      },
      {
        id: "US-03",
        title: "Project & Repo Setup",
        sp: 3,
        dod: [
          "CI/CD pipeline green on main",
          "Docker Compose runs locally",
          "README documents setup steps",
        ],
        risks: ["Cloud credentials/secrets management TBD"],
        tracks: {
          backend: [
            { task: "Docker Compose (API + DB + cache)", hrs: 3 },
            { task: "GitHub Actions CI workflow", hrs: 3 },
          ],
          frontend: [
            { task: "Linting, Prettier, env config", hrs: 2 },
            { task: "Storybook scaffold (optional)", hrs: 2 },
          ],
        },
      },
      {
        id: "US-04",
        title: "Role-Based Access Control",
        sp: 5,
        dod: [
          "Admin / User roles enforced via middleware",
          "Unauthorized routes return 403",
          "Tests cover all role permutations",
        ],
        risks: ["Role hierarchy creep — keep to 2 roles this sprint"],
        tracks: {
          backend: [
            { task: "Role middleware + DB seeding", hrs: 3 },
            { task: "Guard all existing routes", hrs: 2 },
            { task: "RBAC unit tests", hrs: 3 },
          ],
          frontend: [
            { task: "Conditional UI render by role", hrs: 2 },
            { task: "Admin-only route guards", hrs: 2 },
          ],
        },
      },
      {
        id: "US-05",
        title: "Password Reset Flow",
        sp: 5,
        dod: [
          "Email link expires in 1 hour",
          "Old token invalidated after use",
          "E2E test covers full reset journey",
        ],
        risks: ["Email service (SES/SendGrid) may need sandbox approval"],
        tracks: {
          backend: [
            { task: "Reset token generation + storage", hrs: 3 },
            { task: "Email service integration", hrs: 4 },
            { task: "Endpoint + expiry tests", hrs: 3 },
          ],
          frontend: [
            { task: "Forgot password + reset forms", hrs: 3 },
            { task: "Success/error state handling", hrs: 2 },
          ],
        },
      },
    ],
  },
  {
    id: 2,
    title: "Sprint 2",
    subtitle: "Core Features",
    theme: "ORDER MGMT · UI INTEGRATION · NOTIFICATIONS",
    color: "#42C8F5",
    accent: "#2e8fb8",
    totalSP: 28,
    stories: [
      {
        id: "US-06",
        title: "Create & List Orders",
        sp: 8,
        dod: [
          "POST /orders creates with correct status",
          "GET /orders paginates correctly",
          "Order tied to authenticated user",
          "API schema validated with Zod/Pydantic",
        ],
        risks: ["Order state machine must be locked before build starts"],
        tracks: {
          backend: [
            { task: "Order model + state machine design", hrs: 4 },
            { task: "POST /orders endpoint + validation", hrs: 4 },
            { task: "GET /orders with pagination + filters", hrs: 3 },
            { task: "Order service unit tests", hrs: 3 },
          ],
          frontend: [
            { task: "Order list page + data table", hrs: 4 },
            { task: "Create order form + wizard", hrs: 4 },
            { task: "Optimistic UI + loading skeletons", hrs: 3 },
          ],
        },
      },
      {
        id: "US-07",
        title: "Order Detail & Status Update",
        sp: 5,
        dod: [
          "Status transitions validated server-side",
          "Audit log entry on every change",
          "Detail page shows full history",
        ],
        risks: ["Concurrent status updates — add optimistic locking"],
        tracks: {
          backend: [
            { task: "PATCH /orders/:id/status + audit log", hrs: 4 },
            { task: "GET /orders/:id with history", hrs: 2 },
            { task: "Concurrency test suite", hrs: 2 },
          ],
          frontend: [
            { task: "Order detail page", hrs: 3 },
            { task: "Status badge + transition actions", hrs: 3 },
          ],
        },
      },
      {
        id: "US-08",
        title: "Search & Filter Orders",
        sp: 5,
        dod: [
          "Full-text search responds < 200ms (p95)",
          "Filter combinations tested",
          "No N+1 queries in ORM layer",
        ],
        risks: ["Full-text search may need Postgres tsvector or Elasticsearch"],
        tracks: {
          backend: [
            { task: "Search endpoint + DB indexing", hrs: 4 },
            { task: "Query optimisation + EXPLAIN analysis", hrs: 3 },
          ],
          frontend: [
            { task: "Search bar + filter panel UI", hrs: 3 },
            { task: "Debounce, URL state sync", hrs: 2 },
          ],
        },
      },
      {
        id: "US-09",
        title: "Email & In-App Notifications",
        sp: 5,
        dod: [
          "Order status change triggers email",
          "In-app bell icon shows unread count",
          "Notifications marked read on view",
        ],
        risks: ["Email deliverability SLA not defined; fallback to polling"],
        tracks: {
          backend: [
            { task: "Notification service + event hooks", hrs: 4 },
            { task: "Email templates (HTML)", hrs: 3 },
            { task: "GET /notifications endpoint", hrs: 2 },
          ],
          frontend: [
            { task: "Notification bell + dropdown", hrs: 3 },
            { task: "Mark-read UX + real-time polling", hrs: 3 },
          ],
        },
      },
      {
        id: "US-10",
        title: "File Attachment Upload",
        sp: 5,
        dod: [
          "Files stored in S3/GCS bucket",
          "Max 10 MB enforced client + server",
          "Signed URLs expire after 15 min",
        ],
        risks: ["CORS config for signed URLs; bucket IAM policies needed"],
        tracks: {
          backend: [
            { task: "S3 upload + signed URL generation", hrs: 4 },
            { task: "File metadata table + endpoint", hrs: 3 },
          ],
          frontend: [
            { task: "Drag-and-drop upload component", hrs: 4 },
            { task: "Progress bar + error states", hrs: 2 },
          ],
        },
      },
    ],
  },
  {
    id: 3,
    title: "Sprint 3",
    subtitle: "Polish",
    theme: "ADMIN DASHBOARD · TESTING · DEPLOYMENT",
    color: "#F542C8",
    accent: "#b82e8f",
    totalSP: 27,
    stories: [
      {
        id: "US-11",
        title: "Admin Dashboard",
        sp: 8,
        dod: [
          "KPI widgets load in < 1s",
          "Charts render correct aggregated data",
          "Only ADMIN role can access",
          "Responsive down to 1024px",
        ],
        risks: ["Aggregation queries may need materialised views for scale"],
        tracks: {
          backend: [
            { task: "Analytics aggregation endpoints", hrs: 4 },
            { task: "User management CRUD (admin scope)", hrs: 3 },
            { task: "Rate limiting on analytics routes", hrs: 2 },
          ],
          frontend: [
            { task: "Dashboard layout + KPI cards", hrs: 4 },
            { task: "Charts (Recharts / Chart.js)", hrs: 4 },
            { task: "User management data table", hrs: 3 },
          ],
        },
      },
      {
        id: "US-12",
        title: "End-to-End Test Suite",
        sp: 5,
        dod: [
          "≥ 10 critical user journeys covered",
          "Tests run in CI on every PR",
          "< 5 min total run time",
        ],
        risks: ["Flaky tests block CI; add retry logic from day 1"],
        tracks: {
          backend: [
            { task: "API contract tests (Supertest/pytest)", hrs: 4 },
            { task: "DB seed fixtures + teardown", hrs: 3 },
          ],
          frontend: [
            { task: "Playwright/Cypress setup + config", hrs: 3 },
            { task: "Auth, orders, admin test flows", hrs: 4 },
          ],
        },
      },
      {
        id: "US-13",
        title: "Performance & Accessibility Audit",
        sp: 3,
        dod: [
          "Lighthouse score ≥ 90 (perf + a11y)",
          "All interactive elements keyboard accessible",
          "No critical WCAG 2.1 AA violations",
        ],
        risks: ["Chart libraries often fail a11y — add ARIA labels manually"],
        tracks: {
          backend: [
            { task: "Response compression + caching headers", hrs: 2 },
          ],
          frontend: [
            { task: "axe-core sweep + fix violations", hrs: 4 },
            { task: "Bundle analysis + lazy loading", hrs: 3 },
          ],
        },
      },
      {
        id: "US-14",
        title: "Production Deployment & Monitoring",
        sp: 5,
        dod: [
          "Zero-downtime deploy verified",
          "Error tracking (Sentry) active",
          "Uptime alert fires within 2 min",
          "Runbook documented in Confluence",
        ],
        risks: ["DB migration rollback strategy must be tested pre-launch"],
        tracks: {
          backend: [
            { task: "Staging → prod promotion pipeline", hrs: 4 },
            { task: "Sentry + health check endpoints", hrs: 3 },
            { task: "Secrets rotation + env audit", hrs: 2 },
          ],
          frontend: [
            { task: "CDN config + cache invalidation", hrs: 3 },
            { task: "Source maps upload to Sentry", hrs: 2 },
          ],
        },
      },
      {
        id: "US-15",
        title: "Error Handling & UX Polish",
        sp: 3,
        dod: [
          "Global error boundary catches all unhandled errors",
          "All API errors show user-friendly messages",
          "Empty states designed for all list views",
        ],
        risks: ["Scope creep risk — timebox UI polish strictly"],
        tracks: {
          backend: [
            { task: "Standardised error response schema", hrs: 2 },
            { task: "Logging correlation IDs", hrs: 2 },
          ],
          frontend: [
            { task: "Error boundary + toast system", hrs: 3 },
            { task: "Empty states + 404/500 pages", hrs: 3 },
          ],
        },
      },
    ],
  },
];

const RiskBadge = ({ risk }) => (
  <div style={{
    display: "flex", alignItems: "flex-start", gap: "8px",
    padding: "6px 10px", borderRadius: "6px",
    background: "rgba(255,200,50,0.08)", border: "1px solid rgba(255,200,50,0.25)",
    marginBottom: "5px",
  }}>
    <span style={{ color: "#f5c842", fontSize: "12px", marginTop: "1px", flexShrink: 0 }}>⚠</span>
    <span style={{ color: "#d4b84a", fontSize: "12px", lineHeight: 1.4 }}>{risk}</span>
  </div>
);

const TaskChip = ({ task, hrs, color }) => (
  <div style={{
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "7px 12px", borderRadius: "6px",
    background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
    marginBottom: "5px", gap: "10px",
  }}>
    <span style={{ color: "#c8c8c8", fontSize: "12px", lineHeight: 1.4 }}>{task}</span>
    <span style={{
      color, fontSize: "11px", fontWeight: 700,
      fontFamily: "'Space Mono', monospace", whiteSpace: "nowrap",
      background: `${color}18`, border: `1px solid ${color}44`,
      padding: "2px 8px", borderRadius: "4px",
    }}>{hrs}h</span>
  </div>
);

const StoryCard = ({ story, sprintColor }) => {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      border: `1px solid rgba(255,255,255,0.1)`,
      borderRadius: "12px", overflow: "hidden", marginBottom: "12px",
      background: "rgba(255,255,255,0.025)",
      transition: "border-color 0.2s",
    }}
      onMouseEnter={e => e.currentTarget.style.borderColor = sprintColor + "55"}
      onMouseLeave={e => e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)"}
    >
      {/* Header */}
      <div
        onClick={() => setOpen(!open)}
        style={{
          padding: "14px 18px", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "space-between",
          userSelect: "none",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{
            fontFamily: "'Space Mono', monospace", fontSize: "11px",
            color: sprintColor, border: `1px solid ${sprintColor}55`,
            padding: "2px 8px", borderRadius: "4px", background: `${sprintColor}12`,
          }}>{story.id}</span>
          <span style={{ color: "#f0f0f0", fontSize: "14px", fontWeight: 600 }}>{story.title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{
            fontFamily: "'Space Mono', monospace", fontSize: "13px",
            color: sprintColor, fontWeight: 700,
          }}>{story.sp} SP</span>
          <span style={{
            color: "#888", fontSize: "12px",
            transform: open ? "rotate(90deg)" : "rotate(0deg)",
            transition: "transform 0.2s", display: "inline-block",
          }}>▶</span>
        </div>
      </div>

      {/* Expanded */}
      {open && (
        <div style={{ padding: "0 18px 18px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px", marginTop: "16px" }}>
            {/* Backend */}
            <div>
              <div style={{
                fontSize: "10px", fontFamily: "'Space Mono', monospace",
                color: "#888", letterSpacing: "0.1em", marginBottom: "8px",
                textTransform: "uppercase",
              }}>⬡ Backend Track</div>
              {story.tracks.backend.map((t, i) => (
                <TaskChip key={i} task={t.task} hrs={t.hrs} color="#7ec8e3" />
              ))}
            </div>
            {/* Frontend */}
            <div>
              <div style={{
                fontSize: "10px", fontFamily: "'Space Mono', monospace",
                color: "#888", letterSpacing: "0.1em", marginBottom: "8px",
                textTransform: "uppercase",
              }}>⬡ Frontend Track</div>
              {story.tracks.frontend.map((t, i) => (
                <TaskChip key={i} task={t.task} hrs={t.hrs} color={sprintColor} />
              ))}
            </div>
            {/* DoD + Risks */}
            <div>
              <div style={{
                fontSize: "10px", fontFamily: "'Space Mono', monospace",
                color: "#888", letterSpacing: "0.1em", marginBottom: "8px",
                textTransform: "uppercase",
              }}>✓ Definition of Done</div>
              {story.dod.map((d, i) => (
                <div key={i} style={{
                  display: "flex", gap: "8px", marginBottom: "5px",
                  padding: "6px 10px", borderRadius: "6px",
                  background: "rgba(100,220,150,0.06)",
                  border: "1px solid rgba(100,220,150,0.18)",
                }}>
                  <span style={{ color: "#64dc96", fontSize: "11px", marginTop: "1px" }}>✓</span>
                  <span style={{ color: "#a8d8bc", fontSize: "12px", lineHeight: 1.4 }}>{d}</span>
                </div>
              ))}
              <div style={{
                fontSize: "10px", fontFamily: "'Space Mono', monospace",
                color: "#888", letterSpacing: "0.1em", margin: "12px 0 8px",
                textTransform: "uppercase",
              }}>⚠ Risk Flags</div>
              {story.risks.map((r, i) => <RiskBadge key={i} risk={r} />)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const SprintPanel = ({ sprint, isActive, onClick }) => {
  return (
    <div
      onClick={onClick}
      style={{
        flex: 1, cursor: "pointer",
        padding: "20px",
        borderRadius: "14px",
        border: isActive
          ? `2px solid ${sprint.color}`
          : "2px solid rgba(255,255,255,0.08)",
        background: isActive
          ? `linear-gradient(145deg, ${sprint.color}14, ${sprint.color}06)`
          : "rgba(255,255,255,0.025)",
        transition: "all 0.25s",
        position: "relative", overflow: "hidden",
      }}
    >
      {isActive && (
        <div style={{
          position: "absolute", top: 0, left: 0, right: 0, height: "3px",
          background: `linear-gradient(90deg, ${sprint.color}, ${sprint.accent})`,
        }} />
      )}
      <div style={{
        fontFamily: "'Space Mono', monospace", fontSize: "10px",
        color: sprint.color, letterSpacing: "0.15em", marginBottom: "4px",
      }}>{sprint.title}</div>
      <div style={{ color: "#f0f0f0", fontSize: "16px", fontWeight: 700, marginBottom: "4px" }}>
        {sprint.subtitle}
      </div>
      <div style={{ color: "#666", fontSize: "10px", marginBottom: "12px" }}>{sprint.theme}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: "4px" }}>
        <span style={{
          fontFamily: "'Space Mono', monospace", fontSize: "28px",
          fontWeight: 700, color: sprint.color,
        }}>{sprint.totalSP}</span>
        <span style={{ color: "#555", fontSize: "12px" }}>/ 30 SP</span>
      </div>
      {/* mini bar */}
      <div style={{
        marginTop: "8px", height: "4px", borderRadius: "2px",
        background: "rgba(255,255,255,0.06)",
      }}>
        <div style={{
          height: "100%", borderRadius: "2px",
          width: `${(sprint.totalSP / 30) * 100}%`,
          background: `linear-gradient(90deg, ${sprint.color}, ${sprint.accent})`,
          transition: "width 0.4s ease",
        }} />
      </div>
    </div>
  );
};

export default function SprintPlan() {
  const [activeSprint, setActiveSprint] = useState(0);
  const sprint = sprintData[activeSprint];

  const totalTasks = (s) => s.stories.reduce(
    (acc, st) => acc + st.tracks.backend.length + st.tracks.frontend.length, 0
  );

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0d0f",
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      padding: "40px 32px",
      color: "#f0f0f0",
    }}>
      {/* Google Font import */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Space+Mono:wght@400;700&display=swap');
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
      `}</style>

      <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
        {/* Header */}
        <div style={{ marginBottom: "36px" }}>
          <div style={{
            fontFamily: "'Space Mono', monospace", fontSize: "11px",
            color: "#555", letterSpacing: "0.2em", marginBottom: "10px",
          }}>IMPLEMENTATION PLAN · 3 SPRINTS · MAX 30 SP EACH</div>
          <h1 style={{
            margin: 0, fontSize: "32px", fontWeight: 700,
            letterSpacing: "-0.02em", color: "#f5f5f5",
          }}>Sprint Planning Board</h1>
          <p style={{ color: "#555", marginTop: "6px", fontSize: "14px" }}>
            Click a sprint to explore stories, tasks, DoD, and risk flags.
          </p>
        </div>

        {/* Sprint selector */}
        <div style={{ display: "flex", gap: "14px", marginBottom: "32px" }}>
          {sprintData.map((s, i) => (
            <SprintPanel
              key={s.id} sprint={s}
              isActive={i === activeSprint}
              onClick={() => setActiveSprint(i)}
            />
          ))}
        </div>

        {/* Stats bar */}
        <div style={{
          display: "flex", gap: "20px", marginBottom: "24px",
          padding: "14px 20px", borderRadius: "10px",
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.07)",
        }}>
          {[
            { label: "Stories", value: sprint.stories.length },
            { label: "Story Points", value: `${sprint.totalSP} / 30` },
            { label: "Dev Tasks", value: totalTasks(sprint) },
            { label: "Capacity Used", value: `${Math.round((sprint.totalSP / 30) * 100)}%` },
          ].map((s, i) => (
            <div key={i} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
              {i > 0 && <div style={{ width: "1px", height: "24px", background: "rgba(255,255,255,0.08)" }} />}
              <div>
                <div style={{ color: "#555", fontSize: "10px", fontFamily: "'Space Mono', monospace", letterSpacing: "0.1em" }}>{s.label.toUpperCase()}</div>
                <div style={{ color: sprint.color, fontWeight: 700, fontFamily: "'Space Mono', monospace", fontSize: "16px" }}>{s.value}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Stories */}
        <div>
          <div style={{
            fontSize: "11px", fontFamily: "'Space Mono', monospace",
            color: "#444", letterSpacing: "0.15em", marginBottom: "14px",
          }}>USER STORIES — CLICK TO EXPAND</div>
          {sprint.stories.map(story => (
            <StoryCard key={story.id} story={story} sprintColor={sprint.color} />
          ))}
        </div>

        {/* Legend */}
        <div style={{
          marginTop: "28px", padding: "14px 20px",
          borderRadius: "10px", background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          display: "flex", gap: "24px", flexWrap: "wrap",
        }}>
          {[
            { color: "#7ec8e3", label: "Backend track tasks" },
            { color: sprint.color, label: "Frontend track tasks" },
            { color: "#64dc96", label: "Definition of Done criteria" },
            { color: "#f5c842", label: "Risk flags" },
          ].map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <div style={{ width: "10px", height: "10px", borderRadius: "2px", background: l.color }} />
              <span style={{ color: "#666", fontSize: "12px" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
