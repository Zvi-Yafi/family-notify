# FamilyNotify — Automation Test Plan

**Version:** 1.0
**Owner:** Engineering + QA (SDET)
**Last Updated:** 2026-02-10
**Status:** Approved for implementation

---

## Table of Contents

- [Current State Assessment](#current-state-assessment)
- [1. Automation Goals](#1-automation-goals)
- [2. Testing Pyramid](#2-testing-pyramid-familynotify-specific)
- [3. Coverage Matrix](#3-coverage-matrix)
- [4. Tooling Recommendations](#4-tooling-recommendations)
- [5. Test Data Strategy](#5-test-data-strategy)
- [6. Environments](#6-environments)
- [7. CI/CD Pipeline](#7-cicd-pipeline-github-actions)
- [8. Flakiness & Stability Rules](#8-flakiness--stability-rules)
- [9. Ownership & Process](#9-ownership--process)
- [10. Implementation Roadmap](#10-implementation-roadmap)
- [Appendix A — Weekly Checklist](#appendix-a--what-we-implement-this-week)
- [Appendix B — Folder Structure](#appendix-b--proposed-test-folder-structure)

---

## Current State Assessment

### What already exists

| Area | Status | Details |
|---|---|---|
| Jest | Configured | `jest.config.js` with 70% coverage thresholds, `jest.setup.js` with env/router mocks |
| Test files (unit) | **2 files only** | `__tests__/api/admin/stats.test.ts`, `__tests__/lib/services/stats.service.test.ts` |
| Playwright | Configured | `playwright.config.ts` — Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari |
| E2E specs | **4 files, mostly skipped** | `auth.spec.ts`, `admin.spec.ts`, `home.spec.ts`, `preferences.spec.ts` — most tests skipped due to auth dependency |
| GitHub Actions CI | Operational | `.github/workflows/test.yml` — `unit-tests` (Node 18+20), `e2e-tests`, `test-summary` |
| Prisma ORM | Operational | 13 models, 6 enums, PostgreSQL via Supabase |
| RLS policies | Documented | `docs/RLS_POLICIES.md` — 10 tables with RLS enabled, policies defined in SQL |
| Notification providers | 4 implemented | Email (Resend), Push (web-push/VAPID), WhatsApp (Green API), SMS (Twilio stub) |
| Package manager | npm | `package-lock.json` present, scripts use `npm run` |

### Major gaps (high risk — no automated coverage)

1. **Auth helpers** (`lib/auth-helpers.ts`) — `getCurrentUser`, `isAuthenticated`, `requireAuth` are completely untested
2. **Dispatch service** (`lib/dispatch/dispatch.service.ts`) — 620 lines of critical business logic with zero tests
3. **Notification providers** — `email.provider.ts`, `push.provider.ts`, `whatsapp.provider.ts`, `sms.provider.ts` — zero adapter tests
4. **RLS behavior** — policies documented but never verified programmatically
5. **API routes** — only `admin/stats` tested; remaining ~25 route handlers untested (auth, groups, events, admin, cron, dispatch, user, preferences, invitations)
6. **Cross-family data isolation** — the single most critical security property is unverified
7. **E2E auth flows** — all auth-dependent E2E tests are skipped

---

## 1. Automation Goals

### Objectives (risk-ordered)

| Priority | Objective | Why |
|---|---|---|
| 1 | Prevent cross-family data leaks | Privacy breach is the highest business risk. RLS + server-side authorization must be verified. |
| 2 | Guarantee notification dispatch correctness | Users must receive the right notification, via the right channel, at the right time. |
| 3 | Stabilize core user journeys with E2E | Registration, group management, event creation, and preferences are the backbone of the product. |
| 4 | Reduce regression cycle time | Currently no confidence gate — regressions reach staging undetected. |

### What to automate first (P0 — weeks 1-3)

- Access control + RLS verification on all entities (`users`, `family_groups`, `memberships`, `events`, `announcements`, `preferences`, `delivery_attempts`)
- Auth flows: login success, invalid credentials, expired token, missing token, role mismatch
- Dispatch routing: correct channel selection based on user preferences, skip unverified channels
- E2E smoke: 3 critical journeys (register/login, create event + notify, update preferences)

### What NOT to automate (initially)

| Area | Reason |
|---|---|
| Visual/pixel-perfect regression | Low ROI at this stage; consider Playwright visual snapshots later |
| Third-party provider uptime | We test our integration boundary (payload shape, error handling) — not Resend/Green API availability |
| Full E2E coverage of every page | Keep E2E lean; push test depth into unit/integration/API layers |
| SMS end-to-end | Provider is a stub (`sms.provider.ts`) — test the adapter interface only |

### Measurable outcomes (KPIs)

| Metric | Target | Measurement |
|---|---|---|
| P0 scenario coverage | 100% of Coverage Matrix P0 rows | Test count vs. matrix |
| PR pipeline feedback time | < 10 minutes | GitHub Actions job duration |
| Weekly flaky test rate | < 2% of CI runs | Flaky tag count / total runs |
| Code coverage (critical libs) | >= 85% on `lib/auth-helpers.ts`, `lib/dispatch/`, `lib/providers/` | Istanbul/Jest coverage |
| Code coverage (global) | >= 70% (maintain current threshold) | Jest `--coverage` |
| Security baseline | ZAP baseline passes on staging | Nightly job exit code |

---

## 2. Testing Pyramid (FamilyNotify-specific)

```
          ┌──────────┐
          │   E2E    │  ~10-15 tests (P0 journeys only)
          │Playwright│
         ┌┴──────────┴┐
         │  API Tests  │  ~40-60 tests (HTTP contract + auth/authz)
         │node-mocks-http│
        ┌┴────────────┴┐
        │  Integration  │  ~30-40 tests (DB + RLS + dispatch)
        │ Jest + Prisma │
       ┌┴──────────────┴┐
       │   Unit Tests    │  ~100+ tests (services, utils, providers, guards)
       │      Jest       │
       └────────────────┘
```

Non-functional (targeted, not in pyramid):
- Performance smoke: k6 on critical endpoints (nightly)
- Security baseline: OWASP ZAP on staging (nightly)

---

### 2.1 Unit Tests (Jest)

**Scope:** Pure logic that does not require a database or network.

**Target modules:**

| Module | What to test | Priority |
|---|---|---|
| `lib/auth-helpers.ts` | `getCurrentUser` returns user from Supabase, `requireAuth` throws on null user, `isAuthenticated` boolean check | P0 |
| `lib/dispatch/dispatch.service.ts` | Channel routing logic, skip unverified preferences, delivery attempt creation mapping, `getTimeUntilEvent` output, WhatsApp message formatting | P0 |
| `lib/providers/email.provider.ts` | `send()` payload formation, `isConfigured()` states, error mapping from Resend errors, `sendVerificationCode` template | P0 |
| `lib/providers/push.provider.ts` | `send()` payload JSON, `isConfigured()` states, subscription parse errors | P0 |
| `lib/providers/whatsapp.provider.ts` | `normalizePhoneNumber` (Israeli formats), `send()` payload, `sendFile()` payload, `isConfigured()` states | P1 |
| `lib/providers/sms.provider.ts` | `send()` contract, `isConfigured()` states, `sendVerificationCode` | P1 |
| `lib/utils/` | Date/time helpers, Hebrew date utilities, email template builders | P1 |
| `lib/cache.ts` | Cache get/set/clear/TTL behavior | P2 |

**Mocking rules:**

| Mock | Do not mock |
|---|---|
| `prisma` (database calls) | Domain/business logic |
| Provider SDK clients (Resend, web-push, fetch) | Validation rules and Zod schemas |
| `process.env` values | Authorization decision logic |
| Time (`jest.useFakeTimers`) | Data transformation/formatting |
| Next.js `req`/`res` via `node-mocks-http` | Error mapping |

**Coverage targets:**
- `lib/auth-helpers.ts`: 100%
- `lib/dispatch/`: >= 85%
- `lib/providers/`: >= 85%
- Global: >= 70% (existing threshold)

---

### 2.2 Integration Tests (Jest + Prisma + Test DB)

**Scope:** Tests that require a real PostgreSQL database to verify data layer behavior, including RLS policies.

**Key integration suites:**

| Suite | Scenarios | Notes |
|---|---|---|
| RLS: Users | User can only SELECT/UPDATE own row; cannot access other users | Use two Supabase auth contexts |
| RLS: Family Groups | Member sees own group; non-member gets empty result | Cross-family isolation |
| RLS: Memberships | Member sees co-members; cannot see other family's members | Join/leave boundary |
| RLS: Events | Member sees family events; cannot see other family's events; only ADMIN/EDITOR can INSERT | IDOR prevention |
| RLS: Announcements | Member sees family announcements; only ADMIN/EDITOR can create; creator can update; admin can delete | Role-based write |
| RLS: Preferences | User manages own preferences only | Privacy |
| RLS: Delivery Attempts | User sees own attempts; admin sees group attempts | Cross-entity join policy |
| Dispatch + DB | `dispatchAnnouncement` creates correct `DeliveryAttempt` rows per member/channel | End-to-end dispatch with mocked providers |
| Cascade deletes | Deleting a `FamilyGroup` cascades to memberships, events, announcements | Prisma schema integrity |

**Approach:**
- **Preferred: `supabase start`** (Supabase CLI local dev) — provides real `auth.uid()`, real RLS enforcement, and a Postgres instance that closely mirrors production. This is the recommended path for RLS tests because it avoids the complexity of simulating `auth.uid()` manually.
- **Fallback: plain Postgres container** — suitable for non-RLS integration tests (Prisma queries, cascade deletes, dispatch DB logic). RLS cannot be meaningfully tested this way without significant shim work, so avoid it for RLS suites.
- Use Prisma migrations to set up schema on either approach
- Each test suite uses a transaction or truncation cleanup (see [Section 5](#5-test-data-strategy))
- In CI, use the `supabase/setup-cli` GitHub Action to run `supabase start` in the integration job (adds ~30s startup)

---

### 2.3 API Tests (Jest + node-mocks-http)

**Scope:** HTTP-level tests for Next.js API route handlers. Verify status codes, response shapes, auth/authz enforcement, and validation.

**Must-cover patterns for every protected endpoint:**

| Scenario | Expected | Test Type |
|---|---|---|
| No token | 401 Unauthorized | Negative |
| Invalid/expired token | 401 Unauthorized | Negative |
| Valid token, wrong role (member accessing admin route) | 403 Forbidden | Negative |
| Valid token, wrong family (IDOR attempt) | 403 Forbidden | Security |
| Valid token, correct role | 200/201 with correct body | Happy path |
| Invalid request body / missing required fields | 400 Bad Request | Validation |
| Unsupported HTTP method | 405 Method Not Allowed | Contract |

**Priority API routes to cover:**

| Route | Methods | Priority |
|---|---|---|
| `pages/api/auth/login.ts` | POST | P0 |
| `pages/api/auth/callback.ts` | GET | P0 |
| `pages/api/groups/*.ts` | GET, POST, PUT, DELETE | P0 |
| `pages/api/admin/members.ts` | GET, POST, PUT, DELETE | P0 |
| `pages/api/admin/events.ts` | GET, POST | P0 |
| `pages/api/admin/announcements.ts` | GET, POST | P0 |
| `pages/api/admin/event-reminders.ts` | GET, POST | P0 |
| `pages/api/preferences.ts` | GET, PUT | P0 |
| `pages/api/user/me.ts` | GET | P1 |
| `pages/api/invitations/*.ts` | GET, POST | P1 |
| `pages/api/cron/event-reminders.ts` | POST | P1 |
| `pages/api/cron/due-announcements.ts` | POST | P1 |
| `pages/api/admin/stats.ts` | GET | P1 (already started) |
| `pages/api/dispatch/*.ts` | POST | P1 |

**Implementation approach:**
- Use `node-mocks-http` (already a dev dependency) for all handler-level tests — fast, no HTTP overhead, no server startup
- Mock `createServerClient` to control auth state per test
- If a future need arises to test full HTTP middleware/cookies/headers behavior (e.g., adding Express or a custom server), add Supertest at that point — not before

---

### 2.4 E2E Tests (Playwright)

**Guiding principles:**
- E2E tests are smoke/regression only — not the primary coverage layer
- Use API-based login with `storageState` to avoid UI auth flakiness
- Test multi-user scenarios using two separate browser contexts
- Keep total E2E suite runtime under 5 minutes

**P0 E2E journeys:**

| Journey | Steps | Users |
|---|---|---|
| Register + Join Family | Navigate to login -> sign up -> complete onboarding -> create/join family -> dashboard loads | 1 |
| Create Event + Notify | Admin logs in -> creates event -> member logs in (separate context) -> sees event in feed | 2 |
| Update Preferences | User logs in -> navigates to preferences -> toggles email channel -> saves -> verify persistence on reload | 1 |
| Admin Announcement | Admin logs in -> creates announcement -> verify it appears in feed for member | 2 |

**P1 E2E additions (later phases):**

| Journey | Notes |
|---|---|
| Invitation flow | Admin invites via email -> recipient accepts via token URL |
| Mobile responsive smoke | Run P0 journeys on `Pixel 5` and `iPhone 12` viewports (already configured) |
| Basic accessibility scan | Use `@axe-core/playwright` on key pages |

---

### 2.5 Notification Testing

**Push notifications:**

| Test | Type | Approach |
|---|---|---|
| Subscription persistence | Integration | Create subscription via API, verify stored in `preferences.destination` |
| Payload correctness (title, body, data) | Unit | Test `pushProvider.send()` with mocked `webpush.sendNotification` |
| Invalid subscription handling | Unit | Pass malformed JSON as destination, verify graceful error |
| Service worker event handling | Manual/E2E | Verify `public/service-worker.js` shows notification with correct RTL text |

**Email:**

| Test | Type | Approach |
|---|---|---|
| Payload mapping (to, subject, html, text) | Unit | Mock `Resend.emails.send`, assert call args |
| Verification code template | Unit | Assert HTML contains code, expiry text |
| Invitation email template | Unit | Assert HTML contains group name, inviter, link |
| `isConfigured()` without API key | Unit | Verify returns false, `send()` returns error |
| Resend error handling (testing mode limit) | Unit | Simulate error response, verify mapped result |

**SMS (stub):**

| Test | Type | Approach |
|---|---|---|
| `send()` returns success in stub mode | Unit | Verify stub response shape |
| `isConfigured()` states | Unit | With/without env vars |

**WhatsApp (Green API):**

| Test | Type | Approach |
|---|---|---|
| `normalizePhoneNumber` — Israeli formats | Unit | `0541234567` -> `972541234567@c.us`, `+972-54-123-4567` -> `972541234567@c.us`, etc. |
| `send()` message payload | Unit | Mock `fetch`, assert request body shape |
| `sendFile()` file payload | Unit | Mock `fetch`, assert `urlFile`, `fileName`, `caption` |
| Green API error response handling | Unit | Mock 400/500 responses, verify error mapping |

**Dispatch service integration (providers mocked):**

| Test | Type | Approach |
|---|---|---|
| Routes to enabled + verified channels only | Unit | 3 members with different preference combos |
| Skips unverified preferences | Unit | `verifiedAt: null` -> no delivery attempt |
| Creates `DeliveryAttempt` per channel per member | Integration | Verify DB rows after dispatch |
| Marks attempt SENT on success | Integration | Mock provider success, verify status update |
| Marks attempt FAILED on provider error | Integration | Mock provider failure, verify status + error field |
| Welcome notification channel selection | Unit | Test EMAIL, WHATSAPP, SMS branches |

---

### 2.6 Performance (k6) — Smoke

**Endpoints to benchmark:**

| Endpoint | Scenario | Threshold |
|---|---|---|
| `POST /api/auth/login` | 50 concurrent users | P95 < 500ms, error rate < 1% |
| `GET /api/admin/events?familyGroupId=X` | 100 req/s for 30s | P95 < 300ms |
| `POST /api/admin/announcements` | 20 concurrent creates | P95 < 1s |
| `POST /api/dispatch/announcement/[id]` | 10 concurrent dispatches | P95 < 2s (fanout) |

**Run cadence:** Nightly on staging only. Not on PR pipeline.

**Alerting:** Fail nightly job if any threshold breached. Post summary to Slack/GitHub issue.

---

### 2.7 Security Baseline

**OWASP ZAP:**
- Run `zap-baseline.py` against staging URL nightly
- Fail on HIGH severity findings
- Maintain `zap-suppressions.conf` for accepted LOW/MEDIUM findings with documented justification

**Additional automated security checks:**
- `npm audit` on every PR (already implicit in `npm ci`)
- Verify `CRON_SECRET` is required on cron endpoints (API test)
- Verify service role key is never exposed in client-side responses (grep + API test)
- RLS bypass attempt scenarios (integration test — already in 2.2)

---

## 3. Coverage Matrix

> Source of truth for automation priority. Updated as features are added.

| # | Feature Area | Scenario | Priority | Test Type | Status | Notes |
|---|---|---|---|---|---|---|
| 1 | Auth | Login with valid credentials | P0 | API + E2E | Not started | |
| 2 | Auth | Login with invalid credentials | P0 | API | Not started | |
| 3 | Auth | Request without token -> 401 | P0 | API | Not started | All protected routes |
| 4 | Auth | Request with expired/invalid token -> 401 | P0 | Unit + API | Not started | `auth-helpers` |
| 5 | Auth | Logout invalidates session | P1 | API | Not started | |
| 6 | Auth | OAuth callback code exchange | P1 | API | Not started | `pages/api/auth/callback.ts` |
| 7 | Groups | Create family group | P0 | API + E2E | Not started | |
| 8 | Groups | Join family group | P0 | API + E2E | Not started | Membership created |
| 9 | Groups | Leave family group | P1 | API | Not started | |
| 10 | Groups | Member cannot access another family's data | P0 | Integration (RLS) + API | Not started | Cross-family isolation |
| 11 | Roles | Admin-only routes blocked for MEMBER role | P0 | API | Not started | 403 on admin endpoints |
| 12 | Roles | ADMIN can manage members (add, remove, change role) | P0 | API | Not started | `admin/members.ts` |
| 13 | Roles | MEMBER cannot manage other members | P0 | API | Not started | IDOR check |
| 14 | RLS | Users table: read/update own row only | P0 | Integration | Not started | |
| 15 | RLS | Family groups: members SELECT; admin UPDATE/DELETE | P0 | Integration | Not started | |
| 16 | RLS | Memberships: view within family only | P0 | Integration | Not started | |
| 17 | RLS | Events: restricted to family members | P0 | Integration | Not started | |
| 18 | RLS | Announcements: restricted to family members | P0 | Integration | Not started | |
| 19 | RLS | Preferences: user manages own only | P0 | Integration | Not started | |
| 20 | RLS | Delivery attempts: user sees own; admin sees group | P0 | Integration | Not started | |
| 21 | RLS | Topics: members view; admins manage | P1 | Integration | Not started | |
| 22 | Events | Create event (admin/editor) | P0 | API + E2E | Not started | |
| 23 | Events | Update event (creator/admin) | P0 | API | Not started | |
| 24 | Events | Delete event (admin) | P0 | API | Not started | |
| 25 | Events | MEMBER cannot create event | P0 | API | Not started | 403 |
| 26 | Events | IDOR: edit event from another family | P0 | API | Not started | |
| 27 | Announcements | Create announcement (admin/editor) | P0 | API | Not started | |
| 28 | Announcements | Creator updates own announcement | P1 | API | Not started | |
| 29 | Announcements | Admin deletes any announcement in group | P1 | API | Not started | |
| 30 | Preferences | Toggle EMAIL/SMS/PUSH/WHATSAPP | P0 | API + E2E | Not started | |
| 31 | Preferences | Persist and reload preferences | P0 | E2E | Not started | |
| 32 | Dispatch | Routes to enabled + verified channels only | P0 | Unit + Integration | Not started | Core business logic |
| 33 | Dispatch | Skips unverified preferences | P0 | Unit | Not started | `verifiedAt: null` |
| 34 | Dispatch | Creates DeliveryAttempt per member per channel | P0 | Integration | Not started | |
| 35 | Dispatch | Marks SENT/FAILED correctly | P0 | Integration | Not started | |
| 36 | Dispatch | Event reminder dispatch (new + legacy style) | P1 | Unit + Integration | Not started | `eventReminderId` vs `eventId` |
| 37 | Dispatch | Welcome notification dispatch | P1 | Unit | Not started | |
| 38 | Providers | Push payload mapping | P0 | Unit | Not started | |
| 39 | Providers | Email payload + error handling | P0 | Unit | Not started | |
| 40 | Providers | WhatsApp phone normalization | P1 | Unit | Not started | Israeli formats |
| 41 | Providers | WhatsApp send + sendFile | P1 | Unit | Not started | |
| 42 | Providers | SMS stub contract | P2 | Unit | Not started | |
| 43 | Invitations | Send invitation email | P1 | API + Unit | Not started | |
| 44 | Invitations | Accept invitation via token | P1 | API | Not started | |
| 45 | Invitations | Expired invitation rejected | P1 | API | Not started | |
| 46 | Cron | Event reminders cron triggers dispatch | P1 | API | Not started | Requires `CRON_SECRET` |
| 47 | Cron | Due announcements cron | P1 | API | Not started | |
| 48 | Admin | Stats endpoint correctness | P1 | API | Started | Existing tests |
| 49 | Admin | Stats caching behavior | P1 | Unit | Started | Existing tests |
| 50 | UI | Basic accessibility (axe-core) | P2 | E2E | Not started | Key pages only |
| 51 | UI | Mobile responsive smoke | P2 | E2E | Not started | Already configured in Playwright |
| 52 | Security | CRON_SECRET required on cron routes | P1 | API | Not started | |
| 53 | Security | Service role key not exposed in responses | P1 | API | Not started | |
| 54 | Security | ZAP baseline on staging | P2 | Security | Not started | Nightly |

---

## 4. Tooling Recommendations

### Keep (already configured and working)

| Tool | Purpose | Justification |
|---|---|---|
| **Jest 29** | Unit + integration + API handler tests | Already configured with `next/jest`, `jest.setup.js`, coverage thresholds. Stable, widely supported. |
| **Playwright** | E2E browser tests | Already configured with 5 browser/device projects. Superior auto-wait, trace, multi-browser support. |
| **node-mocks-http** | Next.js API route handler testing | Already a dev dependency. Creates mock `req`/`res` without HTTP overhead — ideal for handler-level tests. |
| **@testing-library/react** | Component rendering tests | Already installed with `user-event`. Follow Testing Library philosophy (test behavior, not implementation). |
| **jest-mock-extended** | Type-safe mocking | Already installed. Useful for mocking Prisma client with full type inference. |

### Add

| Tool | Purpose | Justification |
|---|---|---|
| **MSW (Mock Service Worker)** | Frontend API mocking | Intercepts `fetch` at the network level. Better than mocking `fetch` directly — tests real request/response flow. Use for component tests that call API routes. |
| **@axe-core/playwright** | Accessibility scanning in E2E | Lightweight a11y smoke. Run on key pages during E2E to catch WCAG violations early. |
| **k6** | Performance smoke testing | JavaScript-based, lightweight, CI-friendly. Better developer experience than JMeter. Run nightly on staging. |
| **OWASP ZAP** | Security baseline scanning | Industry standard. `zap-baseline.py` Docker image integrates cleanly into GitHub Actions. |

### Do NOT add (and why)

| Tool | Reason |
|---|---|
| Vitest | Jest is already configured and working with `next/jest`. Migration cost > benefit at this stage. |
| Cypress | Playwright is already configured and superior for multi-browser + mobile testing. |
| Supertest | Not needed now — `node-mocks-http` covers all Next.js API route handler tests. Revisit only if the project adds Express/custom server middleware that requires real HTTP-level testing. |
| Allure | Playwright HTML report + GitHub Actions summary is sufficient. Allure adds server infrastructure overhead. |

---

## 5. Test Data Strategy

### Principles

1. **Deterministic:** The same factory call with the same overrides produces predictable, reproducible data.
2. **Isolated:** Tests do not depend on execution order or shared mutable state.
3. **Fast:** Unit tests never touch the database. Integration tests minimize DB setup cost.
4. **Traceable:** Test-created data uses a `RUN_ID` prefix for cleanup identification.

### Factories (test/factories/)

Each factory returns a plain object matching the Prisma model shape. Factories support overrides for any field.

```typescript
// test/factories/user.factory.ts
export function buildUser(overrides?: Partial<User>): User {
  return {
    id: randomUUID(),
    email: `test-${randomUUID().slice(0, 8)}@example.com`,
    phone: null,
    name: 'Test User',
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  }
}

// For DB insertion (integration tests)
export async function createUser(overrides?: Partial<User>): Promise<User> {
  return prisma.user.create({ data: buildUser(overrides) })
}
```

**Required factories:**

| Factory | Key variants |
|---|---|
| `user.factory.ts` | Admin user, member user, user without email, user without phone |
| `family.factory.ts` | Group with slug, group with members pre-attached |
| `membership.factory.ts` | ADMIN role, MEMBER role, specific family+user combo |
| `event.factory.ts` | Future event, past event, event with reminders, event with location |
| `announcement.factory.ts` | GENERAL type, SIMCHA type, scheduled (future), published |
| `preference.factory.ts` | All channels enabled, single channel, unverified channel |
| `notification.factory.ts` | DeliveryAttempt in QUEUED/SENT/FAILED states |
| `invitation.factory.ts` | PENDING, ACCEPTED, EXPIRED statuses |

### Seeding (test/seed/)

- `test/seed/seed.ts` — Creates baseline data for E2E and API tests:
  - 2 family groups (Family A, Family B) for cross-family isolation testing
  - Admin user + member user in Family A
  - Admin user in Family B (should not see Family A data)
  - Preferences set for all channels on test users
  - Sample events and announcements in each family

- Seed is idempotent: running it twice produces the same state (upsert or check-before-create).

### Cleanup strategy

| Test type | Strategy |
|---|---|
| Unit tests | No DB — no cleanup needed |
| Integration tests (Jest) | Wrap each test in a Prisma `$transaction` that rolls back, OR truncate all tables in reverse dependency order after each suite |
| API tests | Same as integration if they use a real DB; otherwise mock-based (no cleanup) |
| E2E tests | Tag created entities with `RUN_ID` environment variable. After-all hook deletes rows matching the run prefix. Alternatively, use a dedicated test DB that gets reset before each E2E run. |

### Time-dependent tests

- Use `jest.useFakeTimers()` + `jest.setSystemTime(new Date('2026-03-15T10:00:00Z'))` for:
  - Scheduled announcement publishing
  - Event reminder timing (`getTimeUntilEvent` — today/tomorrow/this week/future)
  - Cron job trigger windows
- In E2E: avoid time-dependent assertions. Use polling (`expect.poll`) rather than `waitForTimeout`.

---

## 6. Environments

### Local Development

```
Developer machine
├── npm run test          → Jest unit tests (watch mode, no DB)
├── npm run test:ci       → Jest with coverage (CI mode)
├── npm run test:integration  → Jest integration tests (requires local Postgres)
├── npm run test:e2e      → Playwright (starts dev server, runs against localhost:3000)
└── npm run test:e2e:ui   → Playwright UI mode (interactive debugging)
```

**Local DB options:**
- **`supabase start`** (Supabase CLI) — recommended for all integration + RLS tests. Provides real `auth.uid()`, real RLS policies, and a local Postgres instance that mirrors production behavior.
- Docker Compose with PostgreSQL 16 — acceptable for non-RLS integration tests only (Prisma queries, cascade behavior). Not suitable for testing RLS policies.

### CI (GitHub Actions)

| Job | Environment | DB |
|---|---|---|
| Unit tests | `ubuntu-latest`, Node 20 | None (mocked) |
| Integration/API tests | `ubuntu-latest`, Node 20 | PostgreSQL 16 service container |
| E2E smoke | `ubuntu-latest`, Node 20 | PostgreSQL 16 service container + seeded data |

### Staging

- Closest to production configuration
- Deployed via Vercel (frontend) with staging Supabase project
- Nightly runs: full E2E regression, ZAP baseline, k6 smoke
- Uses staging-specific env vars (not production keys)

### Production Smoke (very limited)

Non-destructive checks only:
- Home page loads (200 status)
- `/api/health` endpoint responds (if implemented)
- Login page renders
- No write operations, no test data creation

### Environment Variables & Secrets

| Variable | Local | CI | Staging | Production |
|---|---|---|---|---|
| `DATABASE_URL` | `.env.local` | GitHub Actions service container | GitHub Secrets | N/A |
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | GitHub Secrets | GitHub Secrets | N/A |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | GitHub Secrets | GitHub Secrets | N/A |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` | GitHub Secrets | GitHub Secrets | N/A |
| `CRON_SECRET` | `.env.local` | Hardcoded test value | GitHub Secrets | N/A |
| `RESEND_API_KEY` | `.env.local` or omit | Omit (provider mocked) | Sandbox key | N/A |
| Provider keys (Twilio, Green API) | `.env.local` or omit | Omit (provider mocked) | Sandbox/test keys | N/A |

**Rules:**
- Never commit `.env.local` or any file containing real keys
- CI uses GitHub Actions secrets + environment protection rules
- Staging keys are separate from production — no shared credentials
- Test suites that mock providers do not need real provider keys

---

## 7. CI/CD Pipeline (GitHub Actions)

### Pipeline Design

```
PR opened / push to main or develop
│
├─ unit-tests (parallel with integration-api)
│   ├─ npm ci + cache
│   ├─ prisma generate
│   ├─ lint + typecheck
│   ├─ jest --ci --coverage
│   └─ upload coverage to Codecov
│
├─ integration-api (parallel with unit-tests)
│   ├─ npm ci + cache
│   ├─ start Postgres service container
│   ├─ prisma migrate deploy
│   ├─ jest --ci --testPathPattern="__tests__/integration|__tests__/api"
│   └─ upload test results
│
├─ e2e-smoke (depends on unit-tests + integration-api)
│   ├─ npm ci + cache
│   ├─ install Playwright browsers (cached)
│   ├─ start Postgres + seed
│   ├─ playwright test --grep @smoke
│   └─ upload Playwright report (always)
│
└─ test-summary (depends on all above)
    └─ gate: fail if any job failed

Nightly schedule (cron "0 2 * * *")
│
├─ All of the above, plus:
├─ e2e-full (all Playwright tests, not just @smoke)
├─ zap-baseline (OWASP ZAP against staging URL)
└─ k6-smoke (performance smoke against staging URL)
```

### Sample Workflow

```yaml
name: Tests

on:
  pull_request:
    branches: [main, develop]
  push:
    branches: [main, develop]
  schedule:
    - cron: '0 2 * * *'

env:
  NODE_VERSION: '20.x'

jobs:
  unit-tests:
    name: Unit Tests
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm

      - run: npm ci
      - run: npx prisma generate
      - run: npm run type-check
      - run: npm run lint
      - run: npm run test:ci

      - uses: codecov/codecov-action@v4
        with:
          files: ./coverage/lcov.info
          flags: unittests
          fail_ci_if_error: false

  integration-api:
    name: Integration & API Tests
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: familynotify_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgresql://test:test@localhost:5432/familynotify_test
      NEXT_PUBLIC_SUPABASE_URL: https://test.supabase.co
      NEXT_PUBLIC_SUPABASE_ANON_KEY: test-key
      SUPABASE_SERVICE_ROLE_KEY: test-service-key
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm

      - run: npm ci
      - run: npx prisma migrate deploy
      - run: npm run test:integration

  e2e-smoke:
    name: E2E Smoke
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-api]
    timeout-minutes: 15
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: familynotify_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgresql://test:test@localhost:5432/familynotify_test
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.STAGING_SUPABASE_ANON_KEY }}
      CI: true
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm

      - run: npm ci
      - run: npx prisma generate

      - name: Cache Playwright browsers
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ hashFiles('package-lock.json') }}

      - run: npx playwright install --with-deps chromium

      - name: Seed test data
        run: npm run prisma:seed
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/familynotify_test

      - name: Run E2E smoke tests
        run: npx playwright test --grep @smoke --project=chromium

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
          retention-days: 14

  e2e-full:
    name: E2E Full Regression
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    needs: [unit-tests, integration-api]
    timeout-minutes: 30
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: familynotify_test
        ports:
          - 5432:5432
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    env:
      DATABASE_URL: postgresql://test:test@localhost:5432/familynotify_test
      NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.STAGING_SUPABASE_URL }}
      NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.STAGING_SUPABASE_ANON_KEY }}
      CI: true
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: npm

      - run: npm ci
      - run: npx prisma generate

      - name: Cache Playwright browsers
        uses: actions/cache@v4
        with:
          path: ~/.cache/ms-playwright
          key: playwright-${{ hashFiles('package-lock.json') }}

      - run: npx playwright install --with-deps

      - name: Seed test data
        run: npm run prisma:seed

      - name: Run full E2E regression
        run: npx playwright test

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report-full
          path: playwright-report/
          retention-days: 30

  zap-baseline:
    name: ZAP Security Baseline
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    steps:
      - uses: actions/checkout@v4

      - name: ZAP Baseline Scan
        uses: zaproxy/action-baseline@v0.12.0
        with:
          target: ${{ secrets.STAGING_URL }}
          rules_file_name: zap-suppressions.conf
          fail_action: true

      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: zap-report
          path: zap-report/

  k6-smoke:
    name: k6 Performance Smoke
    runs-on: ubuntu-latest
    if: github.event_name == 'schedule'
    steps:
      - uses: actions/checkout@v4

      - name: Run k6 smoke test
        uses: grafana/k6-action@v0.3.1
        with:
          filename: test/performance/smoke.js
        env:
          K6_BASE_URL: ${{ secrets.STAGING_URL }}

  test-summary:
    name: Test Summary
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-api, e2e-smoke]
    if: always()
    steps:
      - name: Check results
        run: |
          if [ "${{ needs.unit-tests.result }}" == "failure" ] || \
             [ "${{ needs.integration-api.result }}" == "failure" ] || \
             [ "${{ needs.e2e-smoke.result }}" == "failure" ]; then
            echo "Tests failed"
            exit 1
          else
            echo "All tests passed"
          fi
```

### Parallelization Strategy

- `unit-tests` and `integration-api` run in parallel (no dependency)
- `e2e-smoke` waits for both to pass (fail-fast: no point running E2E if unit/integration fail)
- Nightly-only jobs (`e2e-full`, `zap-baseline`, `k6-smoke`) run in parallel

### Caching

| What | Cache key | Saves |
|---|---|---|
| npm dependencies | `npm-${{ hashFiles('package-lock.json') }}` | ~30s per job |
| Playwright browsers | `playwright-${{ hashFiles('package-lock.json') }}` | ~60s per E2E job |
| Prisma client | Included in `node_modules` via `postinstall` | Automatic |

---

## 8. Flakiness & Stability Rules

### Playwright Conventions

| Rule | Implementation |
|---|---|
| Prefer stable selectors | Use `getByRole()`, `getByText()`, `getByTestId()` — never raw CSS selectors |
| Auth via storageState | Login once via API in `globalSetup`, save cookie/token to `storageState.json`, reuse across tests |
| Retries | PR: `retries: 1`, Nightly: `retries: 2` |
| Trace capture | `trace: 'on-first-retry'` (already configured) |
| Screenshots | `screenshot: 'only-on-failure'` (already configured) |
| No `waitForTimeout` | Use `expect(locator).toBeVisible()`, `page.waitForResponse()`, or `expect.poll()` |
| Test isolation | Each test gets a fresh page. Use `test.describe.serial` only when absolutely necessary. |

### Timeout Conventions

| Scope | Timeout | Notes |
|---|---|---|
| Unit test (single) | 5s (Jest default) | If a unit test needs more, it's doing too much |
| Integration test suite | 60s | DB setup + queries |
| API test (single) | 10s | Handler + mock |
| E2E test (single) | 30s (Playwright default) | Includes navigation + assertions |
| E2E suite (total) | 5 min (smoke) / 15 min (full) | CI timeout-minutes setting |
| CI job | 15 min (smoke) / 30 min (full) | GitHub Actions timeout-minutes |

### Notification Test Stability

| Challenge | Mitigation |
|---|---|
| Push notifications depend on browser permission | Mock `Notification.requestPermission()` in Playwright context. Test server-side payload separately. |
| Email delivery timing | Never test actual email delivery in CI. Mock provider, assert `send()` was called with correct args. |
| WhatsApp Green API rate limits | Mock `fetch` in provider tests. Never hit real API in CI. |
| Cron timing | Use `jest.useFakeTimers()` for scheduling tests. Never depend on wall-clock time. |

### Flaky Test Quarantine Process

1. A test that fails intermittently (passes on retry) is flagged.
2. If a test flakes **twice in one week**, it gets the `@flaky` tag and is moved to a quarantine suite.
3. Quarantined tests still run nightly but do **not block** the PR pipeline.
4. A Jira/GitHub issue is created for root cause analysis.
5. Fix must be merged within **3 business days** (see SLA below).
6. After fix, the `@flaky` tag is removed and the test returns to the main suite.

---

## 9. Ownership & Process

### Ownership Model

| Role | Responsibility |
|---|---|
| Feature developer | Writes unit + API tests for new code. Maintains > 70% coverage on touched files. |
| SDET / QA engineer | Writes E2E tests, integration tests, RLS verification. Maintains test infrastructure. |
| Test Sheriff (weekly rotation) | Triages CI failures each morning. Escalates blockers. Updates flaky test tracker. |
| Tech Lead | Approves test plan changes. Reviews quarantine/removal decisions. |

### Definitions

| Term | Definition |
|---|---|
| **Red build** | Any required CI job (unit, integration, e2e-smoke) fails. PR cannot merge. |
| **Blocked build** | Failure caused by infrastructure (CI runner, Docker, network) — not code. Acknowledged by Test Sheriff, rerun permitted. |
| **Flaky test** | Test that fails intermittently without code changes. Subject to quarantine process. |

### SLAs

| Situation | Response Time | Fix Time |
|---|---|---|
| Red build on PR | Immediate (author notified) | Before merge (same day) |
| Red build on main | Test Sheriff triages within 2 hours | Fix within 24 hours |
| Flaky test identified | Tag within 1 business day | Root cause fix within 3 business days |
| Nightly regression failure | Triage by next business morning | Fix within 2 business days |
| ZAP HIGH finding | Triage within 24 hours | Fix within 1 sprint |

### Test Labeling

| Tag | Meaning | When it runs |
|---|---|---|
| `@smoke` | Critical path, must always pass | Every PR + merge |
| `@regression` | Full coverage | Nightly |
| `@extended` | Edge cases, perf, security | Weekly or on-demand |
| `@flaky` | Quarantined — known unstable | Nightly only, non-blocking |
| `@wip` | Work in progress — not yet stable | Skipped in CI |

---

## 10. Implementation Roadmap

### Phase 1 — Foundation (Week 1)

**Goal:** Establish test infrastructure and first meaningful coverage.

| Task | Details |
|---|---|
| Create test folder structure | `test/factories/`, `test/seed/`, `test/helpers/` (see Appendix B) |
| Add factories | `user.factory.ts`, `family.factory.ts`, `membership.factory.ts` |
| Unit tests: `auth-helpers` | Test `getCurrentUser`, `isAuthenticated`, `requireAuth` with mocked Supabase client |
| Unit tests: provider `isConfigured()` | All 4 providers — with and without env vars |
| Fix Playwright auth | Implement `storageState` global setup, remove skipped tests that now work |
| Add `test:integration` script | New npm script pointing to integration test path pattern |
| Update CI | Add `integration-api` job with Postgres service container |

**Exit criteria:** auth-helpers at 100% coverage, E2E auth specs no longer skipped, CI runs integration job.

### Phase 2 — API Coverage + Integration + RLS (Weeks 2-3)

**Goal:** Cover all P0 API authorization scenarios and verify RLS.

| Task | Details |
|---|---|
| API tests: auth routes | Login success/failure, callback, token validation |
| API tests: group routes | CRUD + membership + authorization checks |
| API tests: admin routes | Members, events, announcements — role enforcement |
| API tests: IDOR scenarios | Cross-family access attempts on all entity routes |
| RLS integration tests | 7 RLS suites from coverage matrix rows 14-21 |
| Factories | Add `event.factory.ts`, `announcement.factory.ts`, `preference.factory.ts` |

**Exit criteria:** All P0 API scenarios green, RLS suites pass against test DB, IDOR tests verify 403.

### Phase 3 — E2E P0 Journeys (Weeks 3-4)

**Goal:** Reliable E2E smoke suite for critical user paths.

| Task | Details |
|---|---|
| E2E: Register + Join Family | Full onboarding flow |
| E2E: Create Event + Notify | Admin creates, member sees (two browser contexts) |
| E2E: Update Preferences | Toggle channels, verify persistence |
| E2E: Admin Announcement | Create + verify in feed |
| Tag all E2E as `@smoke` or `@regression` | Proper labeling for CI filtering |
| Mobile viewport smoke | Run `@smoke` on Mobile Chrome + Mobile Safari projects |

**Exit criteria:** 4 P0 E2E journeys green on Chromium, mobile smoke passes, < 5 min total.

### Phase 4 — Dispatch + Notification Automation (Weeks 4-5)

**Goal:** Comprehensive coverage of the notification dispatch pipeline.

| Task | Details |
|---|---|
| Unit tests: `DispatchService` | Channel routing, preference filtering, delivery attempt creation |
| Unit tests: provider adapters | Email payload, push payload, WhatsApp normalization + payload, SMS stub |
| Integration tests: dispatch end-to-end | `dispatchAnnouncement` + `dispatchEventReminder` with mocked providers, verify DB state |
| Unit tests: `getTimeUntilEvent` | Today, tomorrow, this week, future — with fake timers |
| Unit tests: WhatsApp message builder | Verify Hebrew formatting, location links, date formatting |
| Cron API tests | `event-reminders` + `due-announcements` — verify `CRON_SECRET` enforcement |

**Exit criteria:** Dispatch coverage >= 85%, all provider adapters tested, cron auth verified.

### Phase 5 — Performance + Security Baseline (Week 6)

**Goal:** Non-functional quality gates.

| Task | Details |
|---|---|
| k6 smoke script | 4 endpoint scenarios (login, list events, create event, dispatch) |
| ZAP baseline config | `zap-suppressions.conf` with initial suppressions |
| Nightly CI jobs | Add `e2e-full`, `zap-baseline`, `k6-smoke` to workflow |
| Security API tests | `CRON_SECRET` enforcement, service key non-exposure |

**Exit criteria:** Nightly pipeline runs all jobs, ZAP baseline passes, k6 baselines established.

### Phase 6 — Hardening + Scaling (Ongoing)

**Goal:** Continuous improvement and maintenance.

| Task | Details |
|---|---|
| Flaky test reduction | Review quarantine backlog weekly, target < 2% flake rate |
| Coverage gap analysis | Monthly review of coverage matrix vs. actual test count |
| New feature coverage | Every PR touching business logic includes tests (enforced in review) |
| P1/P2 E2E journeys | Invitation flow, accessibility, extended mobile |
| Visual regression | Evaluate Playwright visual comparison for key pages |
| Contract testing | If external API integrations grow, consider Pact or similar |

---

## Appendix A — What We Implement This Week

Phase 1 checklist for the first sprint:

- [ ] Create `test/factories/user.factory.ts` with `buildUser()` and `createUser()`
- [ ] Create `test/factories/family.factory.ts` with `buildFamily()` and `createFamily()`
- [ ] Create `test/factories/membership.factory.ts`
- [ ] Create `test/helpers/auth.ts` — mock auth context builder
- [ ] Create `test/helpers/db.ts` — cleanup utilities
- [ ] Write unit tests for `lib/auth-helpers.ts` (target: 100% coverage)
- [ ] Write unit tests for all provider `isConfigured()` methods
- [ ] Implement Playwright `storageState` global setup for authenticated tests
- [ ] Enable skipped E2E auth tests that can now use `storageState`
- [ ] Add `test:integration` npm script to `package.json`
- [ ] Update `.github/workflows/test.yml` — add `integration-api` job with Postgres service
- [ ] Add Playwright browser caching to CI
- [ ] Verify coverage report uploads correctly to Codecov

---

## Appendix B — Proposed Test Folder Structure

```
Family_Notify/
├── __tests__/
│   ├── unit/
│   │   ├── lib/
│   │   │   ├── auth-helpers.test.ts
│   │   │   ├── cache.test.ts
│   │   │   └── utils/
│   │   │       └── hebrew-date-utils.test.ts
│   │   ├── providers/
│   │   │   ├── email.provider.test.ts
│   │   │   ├── push.provider.test.ts
│   │   │   ├── sms.provider.test.ts
│   │   │   └── whatsapp.provider.test.ts
│   │   └── dispatch/
│   │       └── dispatch.service.test.ts
│   ├── integration/
│   │   ├── rls/
│   │   │   ├── users.rls.test.ts
│   │   │   ├── family-groups.rls.test.ts
│   │   │   ├── memberships.rls.test.ts
│   │   │   ├── events.rls.test.ts
│   │   │   ├── announcements.rls.test.ts
│   │   │   ├── preferences.rls.test.ts
│   │   │   └── delivery-attempts.rls.test.ts
│   │   └── dispatch/
│   │       ├── dispatch-announcement.test.ts
│   │       └── dispatch-event-reminder.test.ts
│   ├── api/
│   │   ├── auth/
│   │   │   ├── login.test.ts
│   │   │   └── callback.test.ts
│   │   ├── groups/
│   │   │   ├── crud.test.ts
│   │   │   ├── membership.test.ts
│   │   │   └── invitations.test.ts
│   │   ├── admin/
│   │   │   ├── members.test.ts
│   │   │   ├── events.test.ts
│   │   │   ├── announcements.test.ts
│   │   │   ├── event-reminders.test.ts
│   │   │   └── stats.test.ts          # (existing, move here)
│   │   ├── user/
│   │   │   ├── me.test.ts
│   │   │   └── preferences.test.ts
│   │   ├── cron/
│   │   │   ├── event-reminders.test.ts
│   │   │   └── due-announcements.test.ts
│   │   └── dispatch/
│   │       └── announcement.test.ts
│   └── lib/
│       └── services/
│           └── stats.service.test.ts   # (existing, keep here)
│
├── e2e/
│   ├── global-setup.ts                # storageState login
│   ├── auth.setup.ts                  # authenticated state fixture
│   ├── smoke/
│   │   ├── register-join-family.spec.ts
│   │   ├── create-event-notify.spec.ts
│   │   ├── update-preferences.spec.ts
│   │   └── admin-announcement.spec.ts
│   ├── regression/
│   │   ├── invitation-flow.spec.ts
│   │   ├── mobile-responsive.spec.ts
│   │   └── accessibility.spec.ts
│   ├── auth.spec.ts                   # (existing, refactor)
│   ├── admin.spec.ts                  # (existing, refactor)
│   ├── home.spec.ts                   # (existing, keep)
│   └── preferences.spec.ts            # (existing, refactor)
│
├── test/
│   ├── factories/
│   │   ├── user.factory.ts
│   │   ├── family.factory.ts
│   │   ├── membership.factory.ts
│   │   ├── event.factory.ts
│   │   ├── announcement.factory.ts
│   │   ├── preference.factory.ts
│   │   ├── notification.factory.ts
│   │   └── invitation.factory.ts
│   ├── seed/
│   │   └── seed.ts
│   ├── helpers/
│   │   ├── auth.ts                    # mock auth context builder
│   │   ├── db.ts                      # cleanup, transaction helpers
│   │   └── time.ts                    # fake timer utilities
│   └── performance/
│       └── smoke.js                   # k6 script
│
├── zap-suppressions.conf              # OWASP ZAP accepted findings
├── jest.config.js                     # (existing, update collectCoverageFrom)
├── jest.setup.js                      # (existing)
├── playwright.config.ts               # (existing, add globalSetup)
└── .github/
    └── workflows/
        └── test.yml                   # (existing, expand)
```

### npm script additions for `package.json`

```json
{
  "scripts": {
    "test:unit": "jest --testPathPattern='__tests__/unit'",
    "test:integration": "jest --testPathPattern='__tests__/integration' --runInBand",
    "test:api": "jest --testPathPattern='__tests__/api'",
    "test:e2e:smoke": "playwright test --grep @smoke --project=chromium",
    "test:e2e:regression": "playwright test --grep @regression"
  }
}
```

---

## Revision History

| Version | Date | Author | Changes |
|---|---|---|---|
| 1.0 | 2026-02-10 | Engineering + QA | Initial plan |
