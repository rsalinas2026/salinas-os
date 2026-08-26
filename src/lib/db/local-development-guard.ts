import "server-only";

import { validateDatabaseUrl } from "./database-url";

const LOCAL_DATABASE_NAME = "salinas_os_dev";
const LOCAL_DATABASE_USER = "salinas_os_dev";
const LOCAL_DATABASE_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

/** Prevents development administration tooling from reaching another database. */
export function requireLocalDevelopmentDatabase(): void {
  const parsedUrl = new URL(validateDatabaseUrl(process.env.DATABASE_URL));
  const databaseName = decodeURIComponent(parsedUrl.pathname.slice(1));
  const databaseUser = decodeURIComponent(parsedUrl.username);

  if (
    !LOCAL_DATABASE_HOSTS.has(parsedUrl.hostname) ||
    databaseName !== LOCAL_DATABASE_NAME ||
    databaseUser !== LOCAL_DATABASE_USER
  ) {
    throw new Error(
      "Settings administration is restricted to the dedicated local development database.",
    );
  }
}
