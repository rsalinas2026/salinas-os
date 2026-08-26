import "server-only";

import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { validateDatabaseUrl } from "./database-url";
import * as schema from "./schema";

export type SalinasDatabase = NodePgDatabase<typeof schema>;

type DatabaseGlobal = typeof globalThis & {
  salinasDatabase?: SalinasDatabase;
  salinasDatabasePool?: Pool;
};

const databaseGlobal = globalThis as DatabaseGlobal;

/**
 * Returns one process-wide, lazily created PostgreSQL pool.
 *
 * Importing this module does not create a pool or open a connection. Existing
 * code-backed readers therefore continue to build and run without DATABASE_URL.
 */
export function getDatabasePool(): Pool {
  if (!databaseGlobal.salinasDatabasePool) {
    databaseGlobal.salinasDatabasePool = new Pool({
      connectionString: validateDatabaseUrl(process.env.DATABASE_URL),
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 5_000,
    });
  }

  return databaseGlobal.salinasDatabasePool;
}

/** Returns the process-wide Drizzle database client without querying it. */
export function getDatabase(): SalinasDatabase {
  if (!databaseGlobal.salinasDatabase) {
    databaseGlobal.salinasDatabase = drizzle(getDatabasePool(), { schema });
  }

  return databaseGlobal.salinasDatabase;
}
