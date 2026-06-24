// src/lib/db/DbClient/dbClient.ts

import { Pool } from 'pg';
import { env } from '@/lib/config/Env';

let pool: Pool | null = null;

export function getDbClient(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: env.database.url,
      ssl: { rejectUnauthorized: false },
    });
  }
  return pool;
}
