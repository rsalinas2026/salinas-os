# Salinas OS v0.6 — Executive Dashboard Foundation

Release checkpoint: 2026-08-23  
Application version: `0.6.0`  
Existing Git tag: `v0.6.0`

## Milestone Summary

Salinas OS v0.6 is an internal RCBS Tax Operations visibility foundation. Asana remains the workflow engine and operational source of truth. Salinas OS reads Asana data, classifies tax-workflow records, calculates operational metrics, and presents executive and per-return status information.

## Included Capabilities

- Executive Dashboard with pipeline totals, active/filed counts, overdue and assignment indicators, workflow and stage distributions, unmapped-section visibility, health scoring, priority insights, and count-based bottleneck detection.
- Season-aware project registry and UI selection, with support in the task loader for multiple enabled Asana projects and cross-project task deduplication.
- Section-driven tax-return eligibility, classification, client-stage mapping, progress percentages, workflow types, and client-visibility metadata.
- Tax Returns Center with search, stage filtering, assignee and due-date display, and links to individual return status previews.
- Client-facing status content for stage, progress, milestones, next step, client action, and a cautious estimated completion window.
- Print-optimized individual status preview with manual browser Print / Save as PDF.
- Internal shared-password access protection for pages and API routes.
- Read-only Asana integration and API endpoints for tax-season, project, section, task, pipeline, and executive information.

## Validation Status

- The production command `npm run build` passed during the repository audit immediately preceding this checkpoint.
- Next.js production compilation, TypeScript validation, page-data collection, and static-page generation completed successfully.
- The repository was clean and synchronized with `origin/main` before these release-documentation files were created.
- This documentation-only checkpoint did not change executable application code, so the build was not rerun.

## Known Limitations and Operational Warnings

- The Executive Dashboard, Tax Returns API, and individual status preview do not yet share one canonical multi-membership selection rule. Management should validate exceptional multi-project tasks against Asana.
- The individual status preview is staff-protected and intended for manual review. It is not a public client portal and should not be exposed directly to clients.
- Report eligibility and `clientVisible` are not yet enforced as a formal weekly reporting gate. Staff must confirm the client, return, stage, content, and reporting suitability before saving or distributing a PDF.
- Estimated completion windows are static planning ranges derived from workflow stage. They are not promised dates or workload-based forecasts.
- PDF creation is manual through the browser. There is no batch generation, archival record, or report-run history.
- Recipient data, email generation, Microsoft 365 draft creation, approval workflow, and automatic sending are not implemented.
- No database or durable audit store exists. Data is loaded from Asana at request time.
- Authentication is a shared staff password, not named-user, role-based, or client authentication.
- Automated tests are not present.

## Safe Operating Procedure

1. Confirm Asana contains the correct client, project membership, section, assignee, and due date.
2. Open the return through the Tax Returns Center rather than constructing a task URL manually.
3. Review all client-facing status text, tax year, form, current stage, estimate, and action request.
4. Use Print / Save as PDF only after manual validation.
5. Review the saved PDF before attaching it to any email.
6. Verify recipients and attachments manually. This release does not create or send email.

## Deferred Capabilities

The following are not part of v0.6: weekly batch reporting, communication history, report approvals, Microsoft 365 draft creation or sending, ShareFile, predictive forecasting, capacity planning, AI providers, Event Bus, Memory Engine, client authentication, and non-RCBS business modules.

