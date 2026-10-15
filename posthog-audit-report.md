# PostHog Audit Report

## Summary

The client-side Next.js integration is current, initialized correctly in the canonical browser entry point, uses configured environment variables, and has static custom event names. The main gaps are missing user identification, direct browser ingestion without a first-party reverse proxy, and an incomplete live-data sweep due to MCP permissions.

**Project changes**

- No application source, configuration, dependency, or environment files were modified.
- Created `posthog-audit-report.md` only.
- Manual next steps: review the prioritized actions below, reauthorize the PostHog MCP connection with `error_tracking:read`, and rerun the audit after fixes.

**Counts**

- **Errors**: 0 (must fix)
- **Warnings**: 3 (should fix)
- **Suggestions**: 1 (nice to have)
- **Passes**: 8

**Problematic items**

| Severity | Area | Check | File | Details |
|----------|------|-------|------|---------|
| `warning` | Identification | Stable distinct_id (not session UUID) | — | No application `posthog.identify()` call exists, so authenticated users are not identified; no auth/session source was found. |
| `warning` | Identification | identify() called before captures / flag evals | `components/ExploreBtn.tsx:14` | Capture calls exist, but no application `posthog.identify()` call was found, so events remain anonymous. |
| `warning` | Event Capture | Captures route through a reverse proxy | `instrumentation-client.ts:20` | Browser PostHog uses the default US PostHog ingest host rather than a first-party reverse proxy. |
| `suggestion` | Live Data | Open findings in PostHog | — | Skipped: error-tracking recommendations are unavailable because the MCP connection lacks `error_tracking:read`. Source-tree checks are unaffected; the data-side of this audit was not covered. |

## Recommended actions

1. **Identification · Stable distinct_id (not session UUID)** — The application has no `posthog.identify()` call, so any future authenticated users will remain anonymous. _Why it matters:_ Missing stable identity fragments one human across persons and contaminates person counts, funnels, and retention. _Fix:_ When authentication is introduced, identify with the stable application user ID immediately after session restoration or login. See [identifying users](https://posthog.com/docs/product-analytics/identify).

2. **Identification · identify() called before captures / flag evals** — Custom captures occur without prior user identification at `components/ExploreBtn.tsx:14`. _Why it matters:_ Events captured before identification remain anonymous at evaluation time and can produce incorrect user-level funnels and feature-flag behavior. _Fix:_ Establish identity at session start before the captures reached from `components/ExploreBtn.tsx:14`. See [identifying users](https://posthog.com/docs/product-analytics/identify).

3. **Event Capture · Captures route through a reverse proxy** — Browser events use the default PostHog ingest host at `instrumentation-client.ts:20`. _Why it matters:_ Tracking blockers can drop direct browser requests, undercounting events in funnels, trends, and retention. _Fix:_ Configure a first-party reverse proxy and point the `api_host` environment value used at `instrumentation-client.ts:20` to it. See [reverse proxy docs](https://posthog.com/docs/advanced/proxy).

4. **Live Data · Open findings in PostHog** — The server-side findings sweep was skipped because the MCP connection lacks `error_tracking:read`. _Why it matters:_ Unchecked live findings can hide unresolved stack frames, failed syncs, ingestion warnings, or other defects static analysis cannot observe. _Fix:_ Reauthorize the PostHog MCP connection with error-tracking read access, then rerun the audit. See [PostHog MCP docs](https://posthog.com/docs/model-context-protocol).

## Full audit

### Installation

Whether the PostHog SDK is present, current, and initialized the way the framework expects. Everything downstream depends on this: a missing or stale SDK silently changes which events exist and which config options are honoured.

| Check | Status | File | Details |
|-------|--------|------|---------|
| PostHog SDK installed | `pass` | — | posthog-js@1.438.10 |
| SDK version up to date | `pass` | — | installed 1.438.10, latest 1.438.10 |
| Initialization is correct | `pass` | `instrumentation-client.ts:19` | Canonical Next.js 15.3+ browser initialization uses configured NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN and NEXT_PUBLIC_POSTHOG_HOST variables. |
| One initialization per runtime | `pass` | `instrumentation-client.ts:19` | One browser-runtime `posthog.init()` site found. |

#### Assumptions and blind spots

The scan covered dependency manifests and explicit initialization sites, but did not execute the application in a real browser. Runtime substitution of public environment variables and successful network delivery remain unproven by static code. A stale lockfile or deployment cache could also cause the deployed SDK version to differ from the manifest. Verify the loaded SDK version and successful initialization in a production browser session.

### Identification

Whether the same human maps to one stable `distinct_id` across sessions, runtimes, and logins. Identity defects are the most expensive kind to fix after the fact, because they corrupt person counts, funnels, and retention retroactively rather than going forward.

| Check | Status | File | Details |
|-------|--------|------|---------|
| Stable distinct_id (not session UUID) | `warning` | — | No application `posthog.identify()` call exists, so authenticated users are not identified; no auth/session source was found. |
| identify() called before captures / flag evals | `warning` | `components/ExploreBtn.tsx:14` | Capture calls occur with no application `posthog.identify()` flow, so events remain anonymous. |
| Same distinct_id across client and server | `pass` | `instrumentation-client.ts:19` | single runtime: only the browser runtime initializes PostHog. |
| reset() called on logout / account switch | `pass` | `components/Navbar.tsx:4` | no logout/account-switch flow found |

#### Assumptions and blind spots

No authentication, logout, or account-switching path was detected, so the missing-identification warnings matter only if authenticated state exists now or is later introduced. Identity could be established indirectly by code patterns outside the explicit SDK calls searched. The single-runtime conclusion assumes there is no external service sending server events into the same project. Verify person profiles and distinct IDs in PostHog after exercising any authenticated flow.

### Event Capture

Whether events are named consistently, reach PostHog reliably, and cover the moments the business actually reasons about. Gaps here don't break anything visibly; they just leave the questions you want to ask unanswerable.

| Check | Status | File | Details |
|-------|--------|------|---------|
| Event names are static and consistent | `pass` | `components/ExploreBtn.tsx:14` | All `posthog.capture()` calls use static string literals as event names. |
| Captures route through a reverse proxy | `warning` | `instrumentation-client.ts:20` | Browser PostHog resolves `api_host` to the default PostHog ingest host rather than a first-party reverse proxy, so blockers may drop events. |
| Key activation events captured | `pass` | `app/globals.css` | no auth/billing paths detected |

#### Assumptions and blind spots

The scan evaluated explicit capture calls and likely growth surfaces, but autocaptured interactions and dynamically imported code were not observed at runtime. The absence of auth or billing paths may reflect the application's current scope rather than complete business-event coverage. Network blockers are an alternative explanation for missing events even when capture code executes correctly. Verify the named custom events and delivery rates in PostHog while testing with and without common tracking blockers.

### Live Data

What PostHog itself has already flagged for this project, read from its recommendations and health checks. These come from ingested data rather than source code, so they catch problems no static scan can see — stack frames that never resolve, syncs that keep failing, alerts nobody wired up.

| Check | Status | File | Details |
|-------|--------|------|---------|
| Open findings in PostHog | `suggestion` | — | Skipped: error-tracking recommendations are unavailable because the MCP connection lacks `error_tracking:read`. Source-tree checks are unaffected; the data-side of this audit was not covered. |

#### Assumptions and blind spots

The live-data area was not inspected because the MCP connection lacked the required scope. These findings normally reflect PostHog's recent lookback window, so newly sending projects or findings that have not been recomputed can appear clean without being clean. Reauthorize the connection and rerun the audit to confirm recommendations and health issues directly.

### Write report

Whether the local markdown audit report was created successfully.

| Check | Status | File | Details |
|-------|--------|------|---------|
| Create posthog-audit-report.md | `pending` | — | — |

#### Assumptions and blind spots

The row was pending at render time because the report cannot mark itself complete until it exists on disk. Verify the final file opens and contains all sections.

### Upload notebook

Whether the local report was mirrored into a shareable PostHog notebook.

| Check | Status | File | Details |
|-------|--------|------|---------|
| Write the report into a PostHog notebook | `pending` | — | — |

#### Assumptions and blind spots

The row was pending at render time because notebook upload follows local report creation. The notebook must be read back and checked for every report section before this workflow is considered complete.

## About this audit

The PostHog wizard runs this audit in stages: SDK installation → init correctness → identification → event capture → live data → this report. The early stages resolve checks against the project's source tree. The live-data stage reads what PostHog already computed from your ingested data — things no source scan can see, like whether stack frames actually resolve. Every result, pass or otherwise, is recorded in the ledger this report was generated from.

- `error` items break correctness now (events lost, identity broken). Fix first.
- `warning` items work today but cause subtle data-quality bugs. Fix when convenient.
- `suggestion` items are best-practice improvements with measurable upside.

Re-run `posthog-wizard audit` after applying fixes to refresh the ledger.
