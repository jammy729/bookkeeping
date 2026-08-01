# Workflow State

## Current Feature

**Feature**: Admin subdomain (`admin.<domain>`) + JWT hash handoff + health-check hardening
**Spec path**: N/A — plan approved directly via Conductor Q&A (2026-08-01)
**Status**: Phase 4 — Implementation (in progress)

## Per-Phase Progress

| Phase | Status | Artifacts | Gate |
|---|---|---|---|
| 0. Requirements | ✅ Approved | Conductor plan (Q&A consensus) | User approved plan + `proceed` |
| 1. Architecture | ✅ Approved | Subdomain zones, origin-split analysis, token handoff decision (URL hash) | User approved |
| 2. UX/Design | ⏭️ Skipped | Backend+infra focused; no new UI states (health page is static) | N/A |
| 3. Tasks | ✅ Inline | Decomposition in Conductor todos | Inline |
| 4. Implementation | 🔄 In progress | Backend + Frontend delegated to @senior-engineer (parallel) | Pending |
| 5. QA & Review | ⏳ Pending | — | Pending |
| 6. Convergence | ⏳ Pending | — | Pending |
| 7. Docs & Ship | ⏳ Pending | — | Pending |

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

## Risk Register

| # | Risk | Impact | Likelihood | Mitigation | Owner |
|---|---|---|---|---|---|
| R1 | Cross-origin session loop (apex token ≠ admin token) | High | Medium | Apex never persists JWT; single storage origin | Frontend |
| R2 | `%VITE_API_URL%` not substituted in dev for root HTML | Med | Low | Verify via curl; fallback to inline dev middleware | Frontend |
| R3 | `admin.localhost` resolution / Vite host-check rejects | Med | Low | `server.host: '127.0.0.1'` + `allowedHosts: ['admin.localhost']`; fallback /etc/hosts | Frontend |
| R4 | Spoofed `x-forwarded-for` bypass of staging IP allowlist | High | Low | Use LAST header entry + trust proxy; exempt health path for Render probes | Backend |
| R5 | `trust proxy: 1` wrong hop count if additional LB layer added | Med | Low | Documented; bump count if proxies change | Backend |
| R6 | Health info disclosure (commit/uptime/DB latency) | Low | Med | Trimmed payload to `{status, timestamp}` | Backend |

## Blockers / Decisions Pending

- None. Vercel domain attachment + DNS is a manual dashboard step for the user after code lands.
