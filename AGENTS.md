<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# Salinas OS Development Instructions

## Product Vision

Salinas OS is an operating system for the Salinas organization: a unified intelligence, automation, and reporting layer that makes operational work visible, reliable, and progressively easier to execute. It should connect existing systems of record rather than replace them without a demonstrated need.

The current primary module is **RCBS Tax Operations**. Its immediate purpose is to give the team trustworthy, end-to-end visibility into the overall tax pipeline: every client, engagement, workflow stage, owner, deadline, blocker, and next action should be understandable from one coherent operational view.

## System Boundaries and Responsibilities

- **Asana is the workflow engine and operational system of record.** Preserve Asana's role in task assignment, status progression, ownership, due dates, and day-to-day workflow execution.
- **Salinas OS is the intelligence, automation, and reporting layer.** It should aggregate and interpret operational data, expose pipeline visibility, identify risks or missing information, automate validated processes, and produce useful internal and client-facing reporting.
- Do not duplicate or silently override authoritative workflow state from Asana. Any write-back or automated action must have an explicit, auditable purpose and clearly defined ownership.
- Preserve the existing architecture and established repository conventions. Extend the system through the current patterns unless a required change cannot be delivered safely within them.

## Current Architecture and Modules

Treat the repository's implemented code and documentation as the source of truth for current architecture. Inspect relevant files before describing, changing, or extending it. The broader Salinas OS product is organized around these module families:

- **Core Engine:** shared domain models, orchestration, permissions, auditability, integrations, reporting infrastructure, and platform services.
- **Microsoft 365:** Outlook/email, calendar, documents, identity, and future communication automation.
- **RCBS:** tax operations workflows, pipeline views, client status, deadlines, blockers, reporting, and related practice-management capabilities.
- **AI:** carefully scoped intelligence, summarization, extraction, recommendations, drafting, validation, and human-in-the-loop automation.
- **Business modules:** future operational modules outside RCBS that reuse the Core Engine and integration foundations.

Do not impose a new architecture based only on these conceptual module names. Map new work onto the architecture that actually exists.

## Immediate Delivery Priorities

The immediate goal is overall tax pipeline visibility. Prioritize accurate, actionable views of workflow state and data completeness before adding broad automation.

Weekly client-facing **PDF Status Reports** are a key near-term deliverable. Reports must be clear, professional, accurate, appropriately branded, and generated from validated source data. They should communicate status, completed work, outstanding client needs, blockers, upcoming milestones, and next actions without exposing internal-only commentary.

Client communication automation must follow this rollout sequence exactly:

1. Manual PDF generation
2. Manual email review
3. Automatic email draft creation
4. Approval workflow
5. Controlled automatic sending

Manual email review is required first. Future Microsoft 365 integration may automatically create email drafts only after the report-generation workflow and content checks are validated. Automatic sending must remain controlled and may be enabled only after draft creation, approval, recipient selection, attachments, permissions, audit logging, failure handling, and operational safeguards have been validated in real use.

## Client Communication Safety

- Treat every client-facing message, attachment, recipient, and data point as sensitive.
- Never send client communications automatically unless the specific sending workflow has been explicitly approved and validated for controlled use.
- Default to drafts and human review. A generated draft is not authorization to send.
- Verify client identity, recipient addresses, engagement context, reporting period, attachments, and all material facts before delivery.
- Prevent cross-client data leakage. Enforce strict tenant/client boundaries in queries, generated artifacts, logs, caches, and automation inputs.
- Separate internal notes from client-safe content. Never include internal risk assessments, private commentary, credentials, secrets, or unrelated client information in client-facing output.
- Make automated and human actions auditable, including the source data, generation time, reviewer/approver, final recipients, attachments, and send result.
- Fail closed when data is missing, ambiguous, stale, conflicting, or unsafe. Surface the issue for review instead of guessing or sending.
- Preserve a human approval path and a practical stop mechanism for any communication automation.

## Development Rules

- Inspect relevant files, nearby implementations, configuration, and documentation before editing. For Next.js work, follow the protected Next.js agent-rules block above and read the applicable local framework guides first.
- Edit repository files directly. Complete the requested implementation in the workspace; do not require the user to manually copy and paste code or instructions.
- Preserve existing architecture, conventions, public interfaces, and working behavior unless the requested task explicitly requires a change.
- Do not make speculative refactors, broad cleanups, dependency swaps, or architecture rewrites. Keep changes scoped to the requested outcome.
- Record useful improvements that are not blockers in a **Future Wishlist** rather than expanding the current task. Do not implement wishlist items without approval.
- Write production-quality TypeScript: use precise types, validate external data, handle errors intentionally, keep security boundaries explicit, and avoid `any` or unsafe assertions unless narrowly justified.
- Add or update focused tests when behavior changes. Protect critical reporting, data-boundary, workflow, and communication-safety logic with appropriate verification.
- Run `npm run build` after meaningful changes. Report the exact command and outcome, including any warnings or failures. Do not claim verification that was not performed.
- Do not commit or push without explicit user approval.
- Avoid modifying unrelated files. Preserve user changes and the current working tree.

## Releases and Backups

At milestone releases, prepare a recoverable backup package that includes:

- a GitHub backup through an explicitly approved commit and push;
- an updated changelog describing material user-facing and technical changes;
- release notes covering the milestone's capabilities, validation, known limitations, operational considerations, and upgrade or rollout steps; and
- a versioned ZIP archive of the release, stored and named according to the project's established release process.

Never create commits, push branches or tags, publish releases, or distribute archives without explicit approval. Verify that release artifacts do not contain secrets, local configuration, client data, generated caches, or unnecessary dependencies.

## Session Closeout

Every implementation session must close with:

- **Build verification:** the result of `npm run build` after meaningful changes, or a clear explanation of why it was not required or could not be completed.
- **Summary:** the repository files and behaviors changed.
- **Unresolved issues:** blockers, failed checks, risks, assumptions requiring confirmation, and approved Future Wishlist items that remain open.
- **Next task:** the single most useful recommended next action, kept within the agreed roadmap.
- **GitHub backup reminder:** remind the user that no backup exists for uncommitted or unpushed work and ask for explicit approval before committing or pushing.

Stop at the requested scope and wait for approval when instructed.
