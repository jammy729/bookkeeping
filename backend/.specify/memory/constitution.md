# Bookkeeping Backend Constitution

## Core Principles

### I. API-First Design
All functionality MUST be exposed via well-documented APIs. API contracts MUST be defined before implementation. Backward compatibility MUST be maintained for minor versions. Breaking changes require version bumps and migration guides.

### II. Data Integrity (NON-NEGOTIABLE)
Database constraints MUST enforce all business rules. Transactions MUST be atomic. Foreign keys MUST be used for all relationships. Check constraints MUST validate data at the database level. No orphaned records allowed.

### III. Security Layers
Defense in depth required. Input validation at API boundaries. Parameterized queries ONLY (no string concatenation for SQL). Rate limiting on all endpoints. Authentication MUST be verified before authorization checks.

### IV. Audit Logging
All data mutations MUST be logged with user context, timestamp, and before/after state. Logs MUST be immutable and append-only. Sensitive data MUST be redacted from logs. Audit logs MUST be queryable for compliance reporting.

### V. Test Coverage
Unit tests REQUIRED for all services and utilities. Integration tests REQUIRED for all API endpoints. Contract tests REQUIRED for external integrations. Financial calculation tests MUST include edge cases (rounding, negative values, zero).

## Additional Constraints

### NestJS Architecture Standards
- **Modules**: Feature-based module organization with clear boundaries
- **Controllers**: Thin controllers delegating to services
- **Providers**: Services, repositories, and utilities as injectable providers
- **DTOs**: class-validator + class-transformer for all request/response validation
- **Guards**: Authentication/authorization via NestJS guards (JWT, roles)
- **Interceptors**: Response transformation, logging, and error handling
- **Pipes**: Validation and transformation pipes for all incoming data
- **TypeORM/Prisma**: Use ORM for database access with proper entity relationships

### API Standards
- RESTful conventions with consistent error responses
- OpenAPI/Swagger documentation for all endpoints
- Pagination for all list endpoints (cursor-based preferred)
- Idempotency keys for all mutation operations on financial data

### Data Model Standards
- Soft deletes with `deleted_at` timestamp for all financial records
- `created_at`, `updated_at` timestamps on all tables
- UUID primary keys for all tables
- Indexes on all foreign keys and frequently queried columns

### Error Handling
- Consistent error response format across all endpoints
- Error codes MUST be documented and machine-readable
- User-facing messages MUST NOT expose internal details
- All errors MUST be logged with full stack traces

### Performance Standards
- API response time p95 < 200ms for standard queries
- Database queries MUST be optimized (no N+1 queries)
- Connection pooling REQUIRED for database access
- Caching strategy for read-heavy operations (with cache invalidation)

## Development Workflow

### Code Review Requirements
- All PRs require at least one review
- API contract changes require two reviewers
- Database migrations require DBA or senior engineer review

### Testing Gates
- All tests MUST pass before PR submission
- Coverage MUST not decrease (80% minimum for financial modules)
- Integration tests MUST run in CI for all PRs

### Database Migrations
- Migrations MUST be reversible
- Migrations MUST be tested in staging before production
- No destructive migrations without explicit approval and backup

## Governance

This constitution supersedes all other backend practices. Amendments require documentation, team approval, and migration plan for existing services.

**Version**: 1.0.0 | **Ratified**: 2026-07-19 | **Last Amended**: 2026-07-19
