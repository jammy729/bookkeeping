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
pnpm --filter bookkeeping-backend start:dev      # dev env (config/.env), watch mode
pnpm --filter bookkeeping-backend start:qa       # QA env (config/.env.qa), watch mode
pnpm --filter bookkeeping-backend start:prod     # PROD env (config/.env.prod), watch mode — runs against the PRODUCTION database

> Note: `start:qa` / `start:prod` load their env file via `node --env-file=../config/.env.*`, a path resolved relative to `backend/`. Always invoke them through pnpm (which runs the script with cwd = `backend/`): from the repo root use `pnpm --filter bookkeeping-backend start:qa` (or `start:prod`), or from `backend/` use `pnpm start:qa`. Running the raw `node` command from the repo root fails with `node: ../config/.env.prod: not found`. Both scripts also preflight-check that the env file exists and print a clear error otherwise.

# Frontend
pnpm --filter bookkeeping-frontend build
pnpm --filter bookkeeping-frontend lint
pnpm --filter bookkeeping-frontend dev
pnpm --filter bookkeeping-frontend dev:qa        # vite --mode qa (config/.env.qa)
pnpm --filter bookkeeping-frontend dev:prod      # vite --mode prod (config/.env.prod)

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

- **Frontend**: Vercel (auto-deploy)
- **Backend**: Render (auto-deploy)
- **Database**: Supabase (PostgreSQL) — separate projects for staging and production

### Environments

| Environment    | Branch    | Frontend       | Backend        | Database                    | Access                        |
| -------------- | --------- | -------------- | -------------- | --------------------------- | ----------------------------- |
| **Dev**        | any       | localhost:5173 | localhost:3001 | Supabase staging project    | Local only                    |
| **Staging**    | `develop` | Vercel staging | Render staging | Supabase staging project    | IP-restricted (`ALLOWED_IPS`) |
| **Production** | `main`    | Vercel prod    | Render prod    | Supabase production project | Public                        |

### Environment Files

All configuration lives in the root `config/` folder. `config/.env` (gitignored) is used by BOTH backend and frontend for local development; `config/.env.qa` and `config/.env.prod` (gitignored) hold environment-specific values for testing via the frontend `dev:qa` / `dev:prod` scripts:

```
config/.env.example   # Committed template — copy to config/.env for local dev; also the reference for Vercel dashboard env vars
config/.env           # Gitignored — local dev values for backend AND frontend
config/.env.qa        # Gitignored — QA values (cd frontend && pnpm dev:qa)
config/.env.prod      # Gitignored — production values (cd frontend && pnpm dev:prod)
```

- Backend reads it via `ConfigModule` (`envFilePath: ["../config/.env", ".env"]`) and `dotenv` (`resolve(__dirname, "../../config/.env")`)
- Frontend reads it via Vite `envDir: '../config'` with mode-based loading: `vite --mode qa` loads `config/.env.qa`, `vite --mode prod` loads `config/.env.prod` (only `VITE_*` vars are exposed to the browser — never prefix secrets with `VITE_`)
- `config/.env.qa` and `config/.env.prod` intentionally omit `NODE_ENV` — Vite rejects non-`development` `NODE_ENV` in env files during dev-server mode. Vite derives its own; the backend scripts pass it explicitly (`start:qa` → `NODE_ENV=qa`, `start:prod` → `NODE_ENV=production`); deployments set `NODE_ENV=production` in the Render dashboard
- Staging/production values are set in the Vercel dashboards using the same keys from `config/.env.example`

### Backend Environment Variables

Set in Render dashboard (not committed to git):

| Variable       | Staging              | Production              | Description                       |
| -------------- | -------------------- | ----------------------- | --------------------------------- |
| `NODE_ENV`     | `production`         | `production`            | Environment                       |
| `PORT`         | `3001`               | `3001`                  | Listen port                       |
| `DB_URL`       | Supabase staging URL | Supabase production URL | Full PostgreSQL connection string |
| `JWT_SECRET`   | random value         | random value            | JWT signing key                   |
| `FRONTEND_URL` | Vercel staging URL   | Vercel production URL   | CORS origin                       |
| `ALLOWED_IPS`  | `154.20.101.221`     | _(not set)_             | IP restriction (staging only)     |

### Frontend Environment Variables

Set in the hosting dashboard (Vercel or Render — not committed to git):

| Variable            | Local (config/.env)          | Production                         | Description                                                        |
| ------------------- | ---------------------------- | ---------------------------------- | ------------------------------------------------------------------ |
| `VITE_API_URL`      | `/api` (vite dev proxy)      | Backend prod URL + `/api`          | Backend API base URL                                                |
| `VITE_SINGLE_ZONE`  | `false` (unset)              | `true` (free Render/Vercel URL)    | Runs the full app at the deployed origin instead of `admin.` subdomain — see below |

> **Single-zone mode**: free hosting can't serve an `admin.<service>.onrender.com` subdomain (no TLS cert can exist for it). With `VITE_SINGLE_ZONE=true` the app collapses both zones onto the deployed origin (auth + protected pages all live at `/`), so a single free URL works end-to-end. When a real domain is added, unset the flag and the `admin.` subdomain architecture activates. Must be set in the hosting dashboard for deployed builds (gitignored `config/` files are not present at deploy time).

### Database Scripts

```bash
# Run migrations (uses data-source.ts → reads DB_URL from config/.env)
pnpm run migration:run

# Revert last migration
pnpm run migration:revert

# Generate migration (auto-detects entity changes)
pnpm run migration:generate src/migrations/MigrationName

# Seed test user (ts-node, reads DB_URL from config/.env)
pnpm run seed

# Seed via typeorm-extension (with tracking)
pnpm run seed:run
```

Environment-specific variants (same guarded pattern as `start:qa`/`start:prod` — run from the repo root or `backend/`; each preloads its env file via `node --env-file`):

```bash
# Run migrations against the QA database (config/.env.qa)
pnpm --filter bookkeeping-backend migration:run:qa

# Run migrations against the PRODUCTION database (config/.env.prod)
pnpm --filter bookkeeping-backend migration:run:prod

# Seed the QA database (config/.env.qa)
pnpm --filter bookkeeping-backend seed:qa

# Seed the PRODUCTION database (config/.env.prod) — creates test@example.com / Test123!
pnpm --filter bookkeeping-backend seed:prod
```

### Manual Setup Steps

1. **Create Supabase production project** at https://supabase.com/dashboard
2. **Run migration**: `pnpm run migration:run` (with production `DB_URL` in `config/.env`)
3. **Seed test user**: `pnpm run seed`
4. **Create Vercel projects** (staging + prod) connected to `develop` and `main` branches
5. **Create Render services** (staging + prod) connected to `develop` and `main` branches
6. **Set env vars** in Vercel/Render dashboards per tables above
7. **Add IP allowlist** on staging Supabase project (Settings → Database → Network Restrictions)
