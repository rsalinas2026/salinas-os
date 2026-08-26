import { loadEnvFile } from "node:process";
import { requireLocalDevelopmentDatabase } from "../src/lib/db/local-development-guard";

/** Loads ignored local configuration and refuses every non-development target. */
export function requireLocalSalinasDatabase(): void {
  loadEnvFile(".env.local");
  requireLocalDevelopmentDatabase();
}
