# Agent Restructure — Task List

Restructure the agent ecosystem: create new primary agent (conductor), add/update all agent descriptions in opencode.json, update all agent `.md` files, remove obsolete agents, and create WORKFLOW_STATE.md template.

---

## Phase 1: Setup — New files & configuration

- [X] T001 [P] [Setup] Create `specs/000-agent-restructure/` directory structure
- [X] T002 [P] [Setup] Create `.opencode/agents/conductor.md` — new primary pipeline orchestrator agent with full body (7-phase pipeline, gate rules, delegation protocol, handoff)
- [X] T003 [P] [Setup] Create `WORKFLOW_STATE.md` template at project root for conductor status tracking
- [X] T004     [Setup] Update `opencode.json` with all changes:
  - Change `default_agent` from `"plan"` to `"conductor"`
  - Add `"conductor"` entry to `"agent"` dict (mode: primary, temp: 0.15, permission: edit:allow, bash:allow)
  - Change `"plan"` mode from `"primary"` to `"subagent"` (within agent entry, not top-level)
  - Add missing agent entries: analyze, checklist, clarify, specify, tasks, taskstoissues
  - Update ALL agent descriptions (16 agents + conductor = 17 total)
  - Update ALL agent temperatures per spec
  - (depends on T001, T002 — directory and conductor file must exist)

## Phase 2: Agent .md File Updates

- [X] T005 [P] [Agents] Update `.opencode/agents/architect.md`:
  - Description: architecture governance, ADRs, constitution validation
  - Output section: change from data-model.md + contracts/ + adrs/ + plan.md to: only `specs/NNN-feature-name/adrs/` + architecture notes in `plan.md`
  - Phase 2 workflow: change to "Design ADRs and validate against constitution"
  - Handoff: change from suggesting `@plan` to: "suggest handoff to @plan — to produce data model, contracts, and implementation plan from ADRs"

- [X] T006 [P] [Agents] Update `.opencode/agents/plan.md`:
  - Mode frontmatter: change from `primary` to `subagent` (must match opencode.json)
  - Description: research-driven implementation planner — investigations, research.md, then plan/data-model/contracts/quickstart
  - Workflow Phase 0: extract unknowns + generate research tasks → consolidate into research.md
  - Workflow Phase 1: produce plan.md, data-model.md, contracts, quickstart.md
  - Handoff: suggest handoff to `@tasks`, `@checklist` (remove `@implement`)

- [X] T007 [P] [Agents] Update `.opencode/agents/project-manager.md`:
  - Description: risk-first project manager — risk register, scope/priority delegation
  - Permission: edit: `{ "*": "deny", "WORKFLOW_STATE.md": "allow", "specs/*": "allow" }`, bash: deny
  - Phase 3 workflow: replace detailed task creation with "Define high-level sprint structure in WORKFLOW_STATE.md — phases, agent assignments, risk register, blockers. Do NOT create individual tasks — delegate task generation to @tasks."
  - Handoff: suggest handoff to `@tasks`, `@architect`

- [X] T008 [P] [Agents] Update `.opencode/agents/specify.md`:
  - Description: feature specification writer — structured spec.md with FR-### and SC-###, verifiable requirements
  - Handoff: change from `@plan` to: "`@clarify` — to resolve ambiguities" then "`@plan` — after clarifications are resolved"

- [X] T009 [P] [Agents] Update `.opencode/agents/clarify.md`:
  - Description: clarification specialist — 10-dimension scan, sequential questioning (one at a time, max 5 questions, multiple-choice with recommended answer)

- [X] T010 [P] [Agents] Update `.opencode/agents/checklist.md`:
  - Description: requirements quality auditor — domain-specific checklists per file (api/security/ux/data/financial/audit/compliance/performance), "unit tests for requirements"

- [X] T011 [P] [Agents] Update `.opencode/agents/tasks.md`:
  - Description: task decomposition with rigorous dependency ordering
  - Keep handoff to `@implement`? NO — change handoff to: "After completing, suggest handoff to @senior-engineer — to execute the tasks; @analyze — to validate task coverage" (since implement.md will be deleted)
  - Add dependency ordering rules to body

- [X] T012 [P] [Agents] Update `.opencode/agents/senior-engineer.md`:
  - Description: TDD implementer — Red-Green-Refactor mandatory, financial rules (decimal types, soft deletes, reversing entries, audit fields, debits=credits, fiscal period validation, idempotency), coverage gate 80%

- [X] T013 [P] [Agents] Update `.opencode/agents/design-engineer.md`:
  - Description: design-to-code translator — financial UI patterns (CurrencyInput, AccountSelect, TransactionTable, BalanceDisplay, ConfirmationDialog, DateRangePicker), shadcn/ui + Radix + Tailwind, WCAG AA

- [X] T014 [P] [Agents] Update `.opencode/agents/ux-designer.md`:
  - Description: UX designer for financial apps — strictly read-only, produces design documents only (user-flows.md, screens.md, components.md, accessibility.md)

- [X] T015 [P] [Agents] Update `.opencode/agents/qa-engineer.md`:
  - Description: QA/test strategist — CI pipeline gates (lint, build, unit, integration, coverage ≥80%, E2E), 10 mandatory financial test scenarios
  - Permission: edit: `{ "*": "deny", "WORKFLOW_STATE.md": "allow", "specs/*": "allow" }`, bash: ask

- [X] T016 [P] [Agents] Update `.opencode/agents/code-reviewer.md`:
  - Description: rigorous code reviewer — 5-pass review (Constitution, Financial, Security, Code Quality, Test Quality), TWO-REVIEWER rule for financial calculations, severity levels

- [X] T017 [P] [Agents] Update `.opencode/agents/analyze.md`:
  - Description: quality analyst — 7-pass read-only analysis (duplication, ambiguity, underspecification, constitution, coverage gaps, inconsistency, IMPLEMENTATION CONVERGENCE)
  - Add Pass G (Implementation Convergence) description — maps every FR/SC to code, classifies gaps (missing/partial/contradicts/unrequested), appends remediation tasks to tasks.md

- [X] T018 [P] [Agents] Update `.opencode/agents/tech-writer.md`:
  - Description: technical writer — developer API docs + end-user accountant docs (month-end close, reconciliation, correcting entries, tax prep)

- [X] T019 [P] [Agents] Update `.opencode/agents/taskstoissues.md`:
  - Description: GitHub issue converter — reads tasks.md, deduplicates, auto-labels (P0-P3, TDD, FE/BE, financial), safety checks

## Phase 3: Cleanup — Remove obsolete agents

- [X] T020     [Cleanup] Delete `.opencode/agents/implement.md` — redundant with `senior-engineer`
  - (depends on T011 — tasks.md handoff references `@implement` and must be updated first)

- [X] T021     [Cleanup] Delete `.opencode/agents/converge.md` — merged into `analyze.md`
  - (depends on T017 — analyze.md now includes convergence pass G)

## Phase 4: Polish — Verification

- [X] T022 [P] [Polish] Verify all cross-references in `opencode.json` — confirm every agent name in the `"agent"` dict has a corresponding `.md` file in `.opencode/agents/`, and vice versa (excluding `constitution.md` which is exempt and the two deleted files)

- [X] T023 [P] [Polish] Validate `opencode.json` loads without errors — confirm file is valid JSON, check that `default_agent` references an agent that exists in the `"agent"` dict, verify all permission block shapes are correct

- [X] T024 [P] [Polish] Verify `conductor.md` `description:` frontmatter matches the `"conductor"` entry in `opencode.json`

- [X] T025 [P] [Polish] Verify `plan.md` `mode:` frontmatter is `subagent` (matching opencode.json change from `primary`)

- [X] T026 [P] [Polish] Verify that no files in `.opencode/agents/` reference `@implement` or `@converge` in their handoff or body sections
