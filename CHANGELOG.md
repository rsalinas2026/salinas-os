# Changelog

All notable Salinas OS milestone changes are documented in this file.

## [0.6.0] - 2026-08-23

### Added

- RCBS Executive Dashboard with tax-pipeline totals, stage distribution, workflow mix, assignment and overdue indicators, operational health scoring, priority insights, and count-based bottleneck detection.
- Season-aware tax operations foundation with an active-season registry, enabled Asana projects, paginated task loading, and cross-project task deduplication.
- Asana section classification and Progress Engine for tax-return eligibility, client stages, progress percentages, client visibility, workflow types, and unmapped-section handling.
- Tax Returns Center with season selection, search, stage filtering, assignment details, due dates, and links to individual status previews.
- Individual client-status preview with milestones, next steps, client-action messaging, estimated completion windows, and browser print/save-to-PDF support.
- Read-only Asana project discovery, section inspection, task diagnostics, tax-season, tax-return, summary, and executive API routes.
- Shared-password staff authentication using an HTTP-only, signed, eight-hour session cookie.
- Initial release-management foundation with a version file and the `v0.6.0` Git tag.

### Known Limitations

- Membership selection is not yet canonical across the Executive Dashboard, Tax Returns API, and individual status preview; a multi-project task can potentially be classified differently by each path.
- Weekly report queues, report-run history, recipient data, communication history, suppression rules, approval workflows, and automated delivery are not implemented.
- PDF output relies on the browser print dialog; there is no server-side or batch PDF generator.
- Microsoft 365, ShareFile, AI-provider, database, Event Bus, Memory Engine, and non-RCBS business-module integrations are not implemented.
- Authentication is intended for internal management testing and is not client authentication or role-based access control.
- Automated tests are not currently present.

