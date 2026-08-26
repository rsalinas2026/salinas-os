# Salinas OS Product Roadmap

Roadmap updated: 2026-08-26

## Immediate Mission

Complete RCBS Tax Operations as a production-ready, year-over-year operating
system that:

1. Provides accurate overall Tax Preparation Pipeline intelligence.
2. Provides executive operational visibility.
3. Generates controlled weekly client-facing tax status reports.
4. Supports manual review before automation.
5. Persists reporting and configuration state where required.
6. Lets RCBS management configure future Tax Seasons and Asana projects through
   the Salinas OS UI without coding.
7. Runs as an always-available production application on DigitalOcean.
8. Eventually creates Microsoft 365 email drafts and supports controlled
   automatic communications.

## Platform Boundary

- **Asana is the workflow engine and operational system of record.**
- **Salinas OS is the intelligence, configuration, reporting, communications,
  automation, and AI layer.**
- Salinas OS remains one modular platform. RCBS Tax Operations is its first
  mature business module, not a separate standalone product.

## Production-Ready Definition

An operational Executive Dashboard alone does not make RCBS Tax Operations
production-ready. Production readiness requires:

- reliable canonical tax classification;
- reliable executive pipeline intelligence;
- reliable weekly status reporting;
- approved reporting and readiness rules;
- persistent configuration;
- no-code future Tax Season setup;
- production deployment; and
- a controlled, auditable client-communication workflow.

## Critical Requirement: No-Code Tax Season Configuration

Starting a new Tax Season must not require a developer, source-code change, or
redeployment. The target management workflow is:

```text
Settings
→ Tax Seasons
→ Tax Season
→ Asana Projects
```

Management must be able to:

- create a season such as 2027;
- set its name and year;
- set Active, Upcoming, or Archived status;
- select the active/default Tax Season;
- paste an Asana Project ID;
- validate that ID against the Asana API;
- display the validated Asana project name;
- assign the project to a Tax Season;
- assign multiple Asana projects to one season;
- enable or disable projects;
- control deterministic project priority/order; and
- safely remove or reassign project configuration.

This configuration must persist without code edits or redeployment. The design
must preserve deterministic project selection and avoid silently changing the
meaning of historical or active Tax Seasons.

## Delivery Phases

### Phase 1 — Weekly Reporting v2

- Report Readiness
- Candidate
- Attention Required
- Not Applicable
- Filed/100% excluded from recurring weekly reports

### Phase 2 — Minimal Persistence Foundation

- Persistent Tax Season configuration
- Persistent Tax Season-to-Asana Project configuration
- Architecture capable of supporting later report-run history
- Production-oriented database design

### Phase 3 — Settings Center

- Gear/settings navigation
- Tax Season management
- No-code Asana project onboarding
- Asana project validation
- Multiple projects per season
- Enable/disable controls
- Project ordering
- Active/default season management

### Phase 4 — DigitalOcean Production Deployment

- Production application deployment
- Persistent database
- Authentication hardening
- Secrets and environment management
- Documented deployment procedure
- Backup and recovery strategy

### Phase 5 — Weekly Reporting v3

- Report-run history
- Review and approval state
- Recipient validation
- Communication audit trail
- Final-filing communication support

### Phase 6 — Microsoft 365 Communications

- Automatic email draft creation
- PDF attachment
- Human approval
- Delivery logging
- Later controlled automatic sending

### Phase 7 — Executive Operations

- Team Workload
- Capacity Planning
- Bottleneck Detection
- SLA/Aging
- Completion Forecasting
- Executive KPIs

### Phase 8 — Broader Salinas OS

- Core Engine
- Microsoft 365 modules
- Executive Assistant
- Attention Engine
- Memory/Learning Engine
- Kitsune
- Tucutanos
- Airbnb
- Additional business modules

## Scope and Sequencing Rules

- Finish and validate each contained phase without speculative implementation
  of later phases.
- Manual review remains mandatory before communications automation.
- Persistence must be designed for production use and future auditability, not
  added as disposable local state.
- A future final-Filed confirmation is a separate completion communication; it
  is not part of recurring weekly reporting and must not be implemented before
  report history and persistence exist.
- Controlled automatic sending remains the final communication stage, after
  drafts, human approval, recipient validation, attachments, logging, failure
  handling, and operational safeguards have been validated.
