import { Client } from 'pg'

const DB_CONFIG = {
  host:     process.env.DB_HOST     ?? 'localhost',
  port:     5432,
  database: 'userdb',
  user:     process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'postgres',
}

async function globalTeardown(): Promise<void> {
  const db = new Client(DB_CONFIG)
  await db.connect()
  try {
    await db.query(`DELETE FROM users WHERE email LIKE '%@e2e.test'`)
  } finally {
    await db.end()
  }
}

export default globalTeardown
