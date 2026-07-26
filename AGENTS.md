# Bookkeeping App

Full-stack bookkeeping application for tracking income, expenses, clients, invoices, and financial reports.

## Tech Stack

- **Backend**: NestJS + TypeScript, TypeORM, PostgreSQL
- **Frontend**: React 18 + Vite + TypeScript, TanStack Query, Tailwind CSS, shadcn/ui
- **Auth**: JWT (access + refresh tokens), bcrypt
- **Database**: PostgreSQL via TypeORM (auto-sync in dev)
- **Monorepo**: pnpm workspaces

## Project Structure

```
bookkeeping/
├── backend/
│   ├── src/
│   │   ├── modules/        # Feature modules (auth, expenses, income, categories, clients, invoices, budgets, reports, uploads)
│   │   ├── entities/       # TypeORM entities
│   │   ├── migrations/     # Database migrations
│   │   └── app.module.ts   # Root module
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── pages/          # Route pages (Dashboard, Expenses, Income, Categories, Clients, Reports, Budgets)
│   │   ├── components/     # Shared components + ui/ (shadcn)
│   │   ├── hooks/          # TanStack Query hooks (useExpenses, useIncome, useCategories, etc.)
│   │   ├── lib/            # API client, utilities
│   │   └── types/          # TypeScript interfaces
│   └── package.json
├── architecture.md         # Detailed architecture documentation
├── roadmap.md              # Development roadmap
└── pnpm-workspace.yaml
```

## Commands

```bash
# Backend
pnpm --filter bookkeeping-backend build
pnpm --filter bookkeeping-backend lint
pnpm --filter bookkeeping-backend start:dev

# Frontend
pnpm --filter bookkeeping-frontend build
pnpm --filter bookkeeping-frontend lint
pnpm --filter bookkeeping-frontend dev

# Both
pnpm install --frozen-lockfile
```

## Architecture

See [architecture.md](./architecture.md) for detailed system architecture, database schema, auth flow, and security measures.

## Roadmap

See [roadmap.md](./roadmap.md) for development status, priorities, and future improvements.

## Project Constitution

See [.specify/memory/constitution.md](./.specify/memory/constitution.md) for core principles and constraints.

### Key Principles

1. **Accuracy-First (NON-NEGOTIABLE)**: All financial data must be accurate, complete, and auditable. Double-entry bookkeeping enforced.
2. **Security & Data Protection**: Encryption at rest/in transit, least-privilege access, audit logs.
3. **Test-First (NON-NEGOTIABLE)**: TDD mandatory for financial calculations. 80% minimum coverage for financial data modules.
4. **Audit Trail**: Immutable audit trail, corrections via reversing entries, soft deletes for financial records.
5. **Simplicity & Maintainability**: YAGNI, readable over clever, document complex logic.

## Conventions

- TypeScript strict mode
- ESLint with zero warnings policy
- TanStack Query for all server state (no local caching)
- Backend handles authorization via JWT (userId from token, never query params for user data)
- Currency: CAD (en-CA locale)
- All API responses follow `{ data: ... }` wrapper pattern
- Entities use UUID primary keys
- Dates stored as ISO strings

## Deployment

- **Frontend**: Vercel (auto-deploy from main)
- **Backend**: Render (auto-deploy from main)
- **Database**: Supabase (PostgreSQL)
- Environment variables: `DATABASE_URL`, `JWT_SECRET`, `FRONTEND_URL`, `PORT`
