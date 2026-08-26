import assert from "node:assert/strict";
import { requireLocalSalinasDatabase } from "./require-local-database";

requireLocalSalinasDatabase();

async function main() {
  const [{ getDatabasePool }, { seedApproved2026TaxSeason }] =
    await Promise.all([
      import("../src/lib/db/client"),
      import("../src/lib/db/seeds/seed-2026"),
    ]);

  try {
    const firstState = await seedApproved2026TaxSeason();

    if (process.argv.includes("--verify-idempotency")) {
      const secondState = await seedApproved2026TaxSeason();
      assert.deepEqual(secondState, firstState);
      console.log("The approved 2026 seed is idempotent.");
    } else {
      console.log("The approved 2026 Tax Season seed completed.");
    }
  } finally {
    await getDatabasePool().end();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : "2026 seed failed.");
  process.exitCode = 1;
});
