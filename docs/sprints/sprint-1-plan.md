# Sprint 1 Plan — Marshanta (Greenfield, UI)

## Sprint Meta

- Sprint: 1
- Dates: TBA (2 weeks recommended)
- Team: PO + @dev (fullstack)
- Scope Type: Foundation setup + first user flow

## Sprint Goal

Establish the monorepo foundation, core auth and data models, and a minimal PWA onboarding flow so a new client can install the PWA, register/login, and see a guided intro.

Success = A user can install the PWA, create an account, log in, and receive a welcome guide via chat. Repo scaffolding and core models are committed with passing basic checks.

## Sprint Backlog (Stories)

- Story 1.1: Project Scaffolding (`docs/stories/1.1.project-scaffolding.md`)
- Story 1.2: User Authentication & Authorization (`docs/stories/1.2.user-authentication-authorization.md`)
- Story 1.3: Core Data Models (`docs/stories/1.3.core-data-models.md`)
- Story 2.1: Client Onboarding (PWA + Intro Chat) (`docs/stories/2.1.client-onboarding.md`)

Rationale: Epic 1 foundations first, then first interaction slice from Epic 2.

## Definition of Done (DoD)

Use BMAD Story DoD checklist: `.bmad-core/checklists/story-dod-checklist.md`.

- Code compiles/builds with no blocking warnings.
- Lint/scripts pass (if configured; otherwise basic CI placeholder passes).
- Minimal tests per story pass (unit where applicable; e2e smoke for onboarding).
- Secrets via env only; no secrets in repo.
- Docs updated (README snippet for setup + any story change logs).
- Acceptance criteria demonstrated.

## Acceptance Demo Plan

- Demonstrate running workspace install and project structure (1.1).
- Register/login/logout via API and basic chat-integrated prompts (1.2).
- Show DB/migrations applied with models present and unique index on `User.email` (1.3).
- Installable PWA; first-time vs returning chat intro (2.1).

## Dependencies & Sequencing

- 1.1 → 1.2 → 1.3 → 2.1
- 1.2 depends on `User` model from 1.3 for persistence wiring; perform model stub early within 1.2 branch or land 1.3 migration first.
- 2.1 depends on auth endpoints (1.2) and PWA bootstrap from 1.1.

## Risks & Mitigations

- Ambiguity in token strategy (JWT vs session): abstract and decide later; keep adapter boundary.
- Tooling sprawl risk: keep dependencies minimal; defer choices to architecture docs.
- PWA install variability across browsers: validate with Lighthouse and real device tests.

## Environments & Secrets

- Use `.env.example` and local `.env` (untracked).
- No secrets committed. Payment provider not in scope this sprint.

## Deliverables

- Monorepo structure with workspaces and basic manifests.
- Auth endpoints: register, login, logout; middleware guard; basic rate limiting.
- DB schema/migration: User, Restaurant, DeliveryPartner; indices per story notes.
- PWA baseline (manifest, SW), intro chat flow.

## Handoff to @dev — Implementation Checklist

- Read stories and follow AC strictly: `docs/stories/1.1... 2.1`.
- Respect adapters/abstractions (no provider lock-in yet).
- Add README setup steps; update change logs in stories.
- Provide small PRs per story with demo notes.

## Tracking

- Link this plan in the repo README under a Sprint Plans section.
- Use labels: `sprint-1`, `story-1.1`, `story-1.2`, `story-1.3`, `story-2.1` on PRs/issues.
