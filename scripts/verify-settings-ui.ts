import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { NextRequest } from "next/server";
import {
  buildFutureSeasonInput,
  canAssignValidatedProject,
  moveProjectId,
  safeSettingsError,
} from "../src/features/settings/settings-ui";
import { requireLocalSalinasDatabase } from "./require-local-database";

requireLocalSalinasDatabase();

assert.deepEqual(buildFutureSeasonInput("2028", "2028 Tax Season"), {
  value: {
    code: "2028",
    year: 2028,
    name: "2028 Tax Season",
    status: "upcoming",
  },
});
assert.ok("error" in buildFutureSeasonInput("not-a-year", "Future"));
assert.ok("error" in buildFutureSeasonInput("2028", ""));
assert.equal(
  canAssignValidatedProject({ gid: "123", name: "Authoritative", archived: false }),
  true,
);
assert.equal(
  canAssignValidatedProject({ gid: "123", name: "Authoritative", archived: true }),
  false,
);
assert.equal(canAssignValidatedProject(null), false);
assert.deepEqual(moveProjectId(["a", "b", "c"], "b", "up"), [
  "b",
  "a",
  "c",
]);
assert.deepEqual(moveProjectId(["a", "b", "c"], "b", "down"), [
  "a",
  "c",
  "b",
]);
assert.equal(
  safeSettingsError({ error: "Safe management message" }, "Fallback"),
  "Safe management message",
);
assert.equal(safeSettingsError({ detail: "internal" }, "Fallback"), "Fallback");

async function main() {
  const [auth, route, databaseClient] = await Promise.all([
    import("../src/lib/auth/staff-auth"),
    import("../src/app/api/settings/tax-seasons/route"),
    import("../src/lib/db/client"),
  ]);

  try {
    const token = await auth.createStaffSessionToken();
    const response = await route.GET(
      new NextRequest("http://localhost/api/settings/tax-seasons", {
        headers: {
          cookie: `${auth.STAFF_SESSION_COOKIE}=${token}`,
          host: "localhost",
        },
      }),
    );
    assert.equal(response.status, 200);
    const payload = (await response.json()) as {
      success?: boolean;
      seasons?: Array<{
        code: string;
        year: number;
        status: string;
        isDefault: boolean;
      }>;
    };
    assert.equal(payload.success, true);
    const season2026 = payload.seasons?.find((season) => season.code === "2026");
    assert.ok(season2026, "Persistent 2026 must display in Settings.");
    assert.equal(season2026.year, 2026);
    assert.equal(season2026.status, "active");
    assert.equal(season2026.isDefault, true);

    const pageSource = readFileSync("src/app/settings/page.tsx", "utf8");
    for (const requiredUiText of [
      "Tax Season Configuration",
      "CURRENT",
      "DEFAULT",
      "ENABLED",
      "DISABLED",
      "Validate Project",
      "Confirm Assignment",
      "Workspace",
      "Team",
      "Set as Current",
      "Archive Season",
      "Move Up",
      "Move Down",
      "Current-season protection",
      "window.confirm",
      "sm:",
    ]) {
      assert.ok(pageSource.includes(requiredUiText), `Missing UI behavior: ${requiredUiText}`);
    }
    assert.ok(pageSource.includes("/api/settings/tax-seasons"));
    assert.ok(pageSource.includes("/api/settings/asana-projects/validate"));
    assert.ok(pageSource.includes("/api/settings/tax-season-projects"));
    assert.ok(!pageSource.includes("ASANA_ACCESS_TOKEN"));
    assert.ok(!pageSource.includes("DATABASE_URL"));

    const navigationSource = readFileSync(
      "src/components/SettingsNavLink.tsx",
      "utf8",
    );
    assert.ok(navigationSource.includes('href="/settings"'));

    const proxySource = readFileSync("src/proxy.ts", "utf8");
    assert.ok(!proxySource.includes('"/settings"'));

    console.log("Settings Center UI verification passed.");
  } finally {
    await databaseClient.getDatabasePool().end();
  }
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "Settings UI verification failed.",
  );
  process.exitCode = 1;
});
