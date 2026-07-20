# Bookkeeping App Constitution

## Core Principles

### I. Accuracy-First (NON-NEGOTIABLE)
All financial data must be accurate, complete, and auditable. Every transaction MUST be traceable from source to report. No silent failures. No data loss. Double-entry bookkeeping principles MUST be enforced at all layers.

### II. Security & Data Protection
Financial data is sensitive. All data MUST be encrypted at rest and in transit. Access controls MUST follow least-privilege principle. Audit logs MUST record all data access and modifications. PII and financial data MUST never be logged in plain text.

### III. Test-First (NON-NEGOTIABLE)
TDD mandatory for all financial calculations, data transformations, and API contracts. Tests written → User approved → Tests fail → Then implement. Red-Green-Refactor cycle strictly enforced. Coverage gates: 80% minimum for all modules handling financial data.

### IV. Audit Trail
Every financial transaction MUST have an immutable audit trail. Who, what, when, and why MUST be recorded. Corrections MUST be made via reversing entries, never by overwriting historical data. Soft deletes required for all financial records.

### V. Simplicity & Maintainability
Start simple, YAGNI principles. Prefer readable code over clever solutions. Document complex business logic. Every feature MUST have a clear owner and purpose. Technical debt MUST be tracked and addressed quarterly.

## Additional Constraints

### Technology Stack
- **Backend**: NestJS (Node.js/TypeScript)
- **Frontend**: React + Vite + TypeScript with shadcn/ui
- **Database**: PostgreSQL with proper constraints and indexes
- **Testing**: Jest (NestJS), Vitest + React Testing Library (frontend)

### Compliance Requirements
- All financial reports MUST reconcile to the general ledger
- Month-end and year-end closing procedures MUST be supported
- Export capabilities for tax preparation (CSV, PDF, standard formats)

### Performance Standards
- Financial reports MUST generate within 5 seconds for typical queries
- Dashboard MUST load within 2 seconds
- Batch operations (e.g., month-end close) MUST provide progress feedback

## Development Workflow

### Code Review Requirements
- All PRs require at least one review from a team member
- Financial calculation changes require two reviewers
- Constitution compliance MUST be verified in every PR

### Testing Gates
- Unit tests MUST pass before PR submission
- Integration tests MUST pass for API changes
- E2E tests MUST pass for user-facing features

### Deployment Approval
- Features affecting financial calculations require explicit approval
- Database migrations MUST be reviewed by a senior engineer
- Rollback procedures MUST be documented before deployment

## Governance

This constitution supersedes all other practices. Amendments require:
1. Documentation of the proposed change
2. Team approval (majority vote)
3. Migration plan for existing features
4. Update to this document with version increment

**Version**: 1.0.0 | **Ratified**: 2026-07-19 | **Last Amended**: 2026-07-19
