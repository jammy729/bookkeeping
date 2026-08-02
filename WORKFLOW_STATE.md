# Workflow State

## Current Feature

**Feature**: Admin subdomain (`admin.<domain>`) + JWT hash handoff + health-check hardening + single-zone deployment mode
**Spec path**: N/A — plan approved directly via Conductor Q&A (2026-08-01)
**Status**: Phase 5/6 — QA verified; deployment config resolved (Render, free tier)

## Per-Phase Progress

| Phase | Status | Artifacts | Gate |
|---|---|---|---|
| 0. Requirements | ✅ Approved | Conductor plan (Q&A consensus) | User approved plan + `proceed` |
| 1. Architecture | ✅ Approved | Subdomain zones, origin-split analysis, token handoff decision (URL hash) | User approved |
| 2. UX/Design | ⏭️ Skipped | Backend+infra focused; no new UI states (health page is static) | N/A |
| 3. Tasks | ✅ Inline | Decomposition in Conductor todos | Inline |
| 4. Implementation | ✅ Done | Backend + Frontend (subdomain zones, hash handoff, health hardening, single-zone flag) | Tests green |
| 5. QA & Review | ✅ Done | 36/36 frontend tests, backend 88/88, build+lint clean; prod deploy verified live | Verified |
| 6. Convergence | ✅ Done | Single-zone mode collapses zones onto free Render URL; subdomain path preserved | Verified |
| 7. Docs & Ship | 🔄 In progress | AGENTS.md + config docs updated; Render dashboard env is a user step | Pending |

## Scope (approved)

1. **Frontend**: hostname-zone routing (`isAdminZone` → public vs protected trees). Apex = public only, never persists session. `admin.` subdomain = full app at existing root paths. JWT transferred apex→admin via URL hash (`#token=<jwt>`), captured + stripped in `AuthProvider` mount. Login/Register handoff redirects; logout + 401 → apex `/login`.
2. **Backend**: `app.set('trust proxy', 1)`; CORS comma-separated multi-origin; `/api/health` trimmed to `{status, timestamp}`; IP middleware uses last `x-forwarded-for` entry + exempts `/api/health` and `/`.
3. **Health page**: `public/health.html` → root Vite entry; `%VITE_API_URL%` env syntax; build-time `__GIT_COMMIT__`/`__BUILD_TIME__` injection plugin; drop removed backend fields.
4. **Infra**: single Vercel project, two domains (user action in dashboard).

## Key Decisions (locked)

- Subdomain prefix: `admin.` (e.g., `admin.bookkeeping.app`)
- Token handoff: URL hash (`#token=<jwt>`), stored in admin-origin localStorage, hash stripped immediately
- Apex domain is **stateless** (never persists JWT) — prevents cross-origin logout/redirect loops
- Single Vercel project serving both domains; hostname decides zone
- Health page stays public on apex at `/health.html`; `/health` alias dropped
- **Single-zone mode (2026-08-02)**: free Render hosting can't serve an `admin.` subdomain (no TLS cert exists for `*.onrender.com` subdomains). `VITE_SINGLE_ZONE=true` collapses both zones onto the deployed origin — every hostname is the admin zone, `getAdminOrigin`/`getApexOrigin`/`getLoginUrl` become no-ops, and the public auth pages (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/onboarding`, `/health`) are added to the full-app route tree so unauthenticated redirects never loop. Subdomain architecture stays intact when a real domain is added (just unset the flag).
- **Deployment (2026-08-02)**: both backend + frontend on Render free tier. Backend start command is `node dist/main.js` (NOT the local `start:prod` script). Production DB schema applied via `migration:run:prod` + seeded.

## Risk Register

| # | Risk | Impact | Likelihood | Mitigation | Owner |
|---|---|---|---|---|---|
| R1 | Cross-origin session loop (apex token ≠ admin token) | High | Medium | Apex never persists JWT; single storage origin | Frontend |
| R2 | `%VITE_API_URL%` not substituted in dev for root HTML | Med | Low | Verify via curl; fallback to inline dev middleware | Frontend |
| R3 | `admin.localhost` resolution / Vite host-check rejects | Med | Low | `server.host: '127.0.0.1'` + `allowedHosts: ['admin.localhost']`; fallback /etc/hosts | Frontend |
| R4 | Spoofed `x-forwarded-for` bypass of staging IP allowlist | High | Low | Use LAST header entry + trust proxy; exempt health path for Render probes | Backend |
| R5 | `trust proxy: 1` wrong hop count if additional LB layer added | Med | Low | Documented; bump count if proxies change | Backend |
| R6 | Health info disclosure (commit/uptime/DB latency) | Low | Med | Redacted payload: URLs shown, DB credentials stripped | Backend |
| R7 | QA and PROD point at the SAME Supabase project (`jmmpvycvbfdmvrievsfq`) | High | Med | Create a separate production Supabase project; point Render `DB_URL` + `config/.env.prod` at it; re-run `migration:run:prod` + `seed:prod` | User |
| R8 | Seeded test user `test@example.com / Test123!` live in production | Med | Med | Register a real account; remove/rotate seed creds | User |

## Blockers / Decisions Pending

- **User action (Render dashboard)**: set `VITE_SINGLE_ZONE=true` on the `bookkeeping-frontend-scey` service env vars and redeploy (gitignored `config/` files are not present at deploy time). Until then the deployed frontend still runs the subdomain architecture and post-login handoff will fail.
