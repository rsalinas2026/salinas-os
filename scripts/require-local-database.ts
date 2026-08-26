import { loadEnvFile } from "node:process";
import { validateDatabaseUrl } from "../src/lib/db/database-url";

const LOCAL_DATABASE_NAME = "salinas_os_dev";
const LOCAL_DATABASE_USER = "salinas_os_dev";
const LOCAL_DATABASE_HOSTS = new Set(["127.0.0.1", "localhost", "::1"]);

/** Loads ignored local configuration and refuses every non-development target. */
export function requireLocalSalinasDatabase(): void {
  loadEnvFile(".env.local");

  const databaseUrl = validateDatabaseUrl(process.env.DATABASE_URL);
  const parsedUrl = new URL(databaseUrl);
  const databaseName = decodeURIComponent(parsedUrl.pathname.slice(1));
  const databaseUser = decodeURIComponent(parsedUrl.username);

  if (
    !LOCAL_DATABASE_HOSTS.has(parsedUrl.hostname) ||
    databaseName !== LOCAL_DATABASE_NAME ||
    databaseUser !== LOCAL_DATABASE_USER
  ) {
    throw new Error(
      "This command may run only against the dedicated local Salinas OS development database.",
    );
  }
}
