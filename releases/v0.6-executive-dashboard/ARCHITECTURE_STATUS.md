# v0.6 Architecture and Status Snapshot

Snapshot date: 2026-08-23

## Product State

Salinas OS v0.6 is a Next.js 16 internal RCBS Tax Operations application. It is an intelligence and presentation layer over Asana rather than a replacement workflow system.

## Implemented Data Flow

```text
Asana REST API
  → Tax Season registry and enabled projects
  → Paginated task loading and GID deduplication
  → Section mapping / tax-return classification / Progress Engine
  → Executive metrics and deterministic intelligence
  → Executive API and Dashboard

Asana task
  → Section mapping / client-stage status
  → Milestones and estimated completion window
  → Staff-only individual status preview
  → Manual browser Print / Save as PDF
```

## Runtime Architecture

- **Framework:** Next.js App Router with React and TypeScript.
- **Workflow source:** Asana REST API using a server-only personal access token.
- **Persistence:** None; operational data is fetched from Asana on demand.
- **Authentication:** Shared staff password with an HMAC-signed, HTTP-only session cookie.
- **Executive layer:** Deterministic TypeScript services calculate pipeline metrics, health, exceptions, and bottleneck concentration.
- **Client-status layer:** Reusable React components render client-safe stage copy, milestones, next steps, action requests, estimates, and print styles.
- **Deployment target documented by the project:** Vercel.

## Implemented Modules

- RCBS Executive Dashboard
- Executive Intelligence service and API
- Tax Season registry and selector
- Multi-project task loading and deduplication foundation
- Tax Returns Center
- Eligibility/classification and section mapping
- Progress Engine
- Staff-only individual status preview
- Manual print/save-to-PDF status output
- Staff session authentication

## Partial Foundations

- Multi-project Tax Seasons: loading and deduplication exist, but classification membership selection differs between consumers.
- Client Portal: client-facing presentation exists, but client authentication and delivery do not.
- Weekly Status Reports: report content and manual print output exist, but report selection, scheduling, history, and review workflow do not.
- Workload, bottleneck, SLA, and forecast intelligence: basic assignment, overdue, stage concentration, and static completion ranges exist; capacity, stage aging, SLAs, and predictive forecasting do not.
- Quality Control: represented as a workflow stage, without a checklist, approval gate, defect history, or reviewer audit.

## Not Implemented

- Database or durable audit/history store
- Event Bus or Memory Engine
- Microsoft 365 Email, Calendar, Contacts, To Do, draft creation, or sending
- AI provider/model APIs, Executive Assistant, or Learning Engine
- ShareFile integration
- Formal weekly report eligibility, suppression, review, approval, and delivery workflow
- Kitsune, Tucutanos, Airbnb, or other non-RCBS business modules

## Primary Reliability Risk

The Executive Dashboard ranks eligible memberships and favors the most advanced mapped tax-return classification. The Tax Returns API chooses the first membership by configured project priority. The individual status page chooses the first matching membership. Until these paths share one canonical classifier, multi-project tasks require manual verification before client reporting.

## Configuration Names

The application expects these server-side environment variables. Values are intentionally excluded from this documentation and backup:

- `ASANA_ACCESS_TOKEN`
- `ASANA_PROJECT_GID`
- `SALINAS_STAFF_PASSWORD`
- `SALINAS_AUTH_SECRET`

