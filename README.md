# Salinas OS

Salinas OS is the internal executive intelligence layer for Reality Check
Business Solutions (RCBS). Asana remains the workflow engine and source of
truth. Salinas OS reads Asana data and turns it into operational and
client-facing progress information.

Current application version: `0.6.0`

## Version 1.0 scope

- Executive dashboard and operational KPIs
- Season-aware Asana project connections
- Section-driven progress and workflow classification
- Operational health and priority insights
- Tax-return eligibility filtering
- Client portal progress, timeline, next action, estimate, and print layout

AI features, forecasting, notifications, capacity planning, mobile-specific
experiences, and additional integrations are explicitly deferred until a
future release.

## Requirements

- Node.js 20 or newer
- npm
- An Asana personal access token with read access to the configured project
- The Asana project GID for the active tax season
- A shared staff password with at least 12 characters
- A random session-signing secret with at least 32 characters

## Local setup

1. Install dependencies with `npm ci`.
2. Copy `.env.example` to `.env.local`.
3. Add the real server-only values for `ASANA_ACCESS_TOKEN`,
   `ASANA_PROJECT_GID`, `SALINAS_STAFF_PASSWORD`, and
   `SALINAS_AUTH_SECRET` to `.env.local`.
4. Start the application with `npm run dev`.
5. Open `http://localhost:3000`.

Never commit `.env.local` or expose the Asana token through a variable whose
name begins with `NEXT_PUBLIC_`.

## Required validation

Every completed sprint must pass both release checks:

```text
npx tsc --noEmit
npm run build
```

Run `npm run lint` as an additional quality check.

## Production deployment

DigitalOcean is the approved production target on the current product roadmap.
Production deployment infrastructure is not yet implemented. When that phase is
authorized, configure
`ASANA_ACCESS_TOKEN`, `ASANA_PROJECT_GID`, `SALINAS_STAFF_PASSWORD`, and
`SALINAS_AUTH_SECRET` through secure server-side environment management. Do not
place any of these values in source control.

The Version 1.0 management-testing release uses a shared RCBS staff password.
Successful login creates a signed, HTTP-only session that expires after eight
hours. This protects both pages and API routes. It is not the future client
authentication system and should not be used to provide clients with access.

After deployment, verify the executive dashboard against known Asana totals
and complete a client-portal smoke test before allowing management use.

## Architecture boundary

Salinas OS does not replace Asana and must not become a second practice
management system. Workflow changes continue to happen in Asana. Salinas OS
provides the intelligence, persistent configuration, reporting, communications,
automation, and future AI layer around that authoritative workflow data. See
`docs/PRODUCT_ROADMAP.md` for the approved delivery sequence.
