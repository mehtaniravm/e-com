import { Client } from 'pg'
import bcrypt from 'bcryptjs'

// Credentials used throughout the test suite — match values in global-teardown.ts
export const ADMIN_EMAIL    = 'admin@e2e.test'
export const ADMIN_PASSWORD = 'Admin@123!'
export const CUSTOMER_EMAIL    = 'customer@e2e.test'
export const CUSTOMER_PASSWORD = 'Customer@1!'

const DB_CONFIG = {
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     5432,
  database: 'userdb',
  user:     process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
}

const USER_SERVICE_URL = process.env.USER_SERVICE_URL ?? 'http://localhost:8081'

async function globalSetup(): Promise<void> {
  const db = new Client(DB_CONFIG)
  await db.connect()

  try {
    // ── Clean up any leftovers from a previous run ──────────────────────────
    await db.query(`DELETE FROM users WHERE email LIKE '%@e2e.test'`)

    // ── Seed admin user directly (register API creates USER role only) ───────
    const adminHash = await bcrypt.hash(ADMIN_PASSWORD, 10)
    await db.query(
      `INSERT INTO users (id, email, password, first_name, last_name, role, enabled, created_at, updated_at)
       VALUES (gen_random_uuid(), $1, $2, 'E2E', 'Admin', 'ADMIN', true, NOW(), NOW())`,
      [ADMIN_EMAIL, adminHash],
    )

    // ── Register customer via API ────────────────────────────────────────────
    const res = await fetch(`${USER_SERVICE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: CUSTOMER_EMAIL,
        password: CUSTOMER_PASSWORD,
        firstName: 'E2E',
        lastName: 'Customer',
      }),
    })

    if (!res.ok && res.status !== 409) {
      throw new Error(`Failed to register customer: HTTP ${res.status}`)
    }
  } finally {
    await db.end()
  }
}

export default globalSetup
