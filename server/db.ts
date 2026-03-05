import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";

const { Pool } = pg;

const hasDb = !!process.env.DATABASE_URL;

export const pool = hasDb
  ? new Pool({ connectionString: process.env.DATABASE_URL })
  : (null as any);

export const db = hasDb ? drizzle(pool, { schema }) : (null as any);

export { hasDb };
