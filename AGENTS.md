# AGENTS.md

## Project overview

Company Management is a frontend-only React 19 / TypeScript / Vite application for the sibling FastAPI backend. Use Material UI as the single UI library, React Router for routes and TanStack Query for server state. It is an administrative application with a grayscale light theme.

The backend repository is ../company-users-projects-backend. Read its docs/openapi.json before changing API integrations. Do not invent endpoints or modify backend code as part of routine frontend work.

## Setup and commands

Run commands from this repository in PowerShell. Use Node.js 24 and npm with package-lock.json.

- Install: npm install (npm ci for reproducible CI installs).
- Environment: Copy-Item .env.local.sample .env.local, only if the local file does not exist.
- Start: npm run dev at http://localhost:5173.
- Lint: npm run lint.
- Format: npm run format; verify formatting with npm run format:check.
- Unit/component tests: npm test.
- Focused tests: npm test -- src/api/client.test.ts.
- Watch: npm run test:watch.
- Production build: npm run build.
- Browser install: npx playwright install chromium.
- Browser tests without backend: npm run test:e2e -- e2e/errors.spec.ts.
- Live browser integration: npm run test:e2e -- e2e/live.spec.ts.

The backend must already be running and demo-seeded for live integration tests. E2E_PASSWORD can override the known development fixture password. These tests mutate only a newly created disposable company. Never run them against production.

## Architecture and file organization

- src/api/types.ts mirrors backend wire types.
- src/api/client.ts is the only application fetch boundary; resource functions belong in src/api/resources.ts.
- src/api/query.ts defines the QueryClient and cache refresh policy.
- src/auth/session.ts manages the memory-only session state and CSRF token.
- Feature screens live under companies, employees and projects.
- Shared forms/dialogs/feedback belong in src/shared.
- All application colors are managed in src/layout/theme.ts.
- Route components are lazy-loaded in src/App.tsx.
- Unit tests are colocated as *.test.ts or *.test.tsx.
- e2e contains Playwright tests. Do not enable traces containing login credentials.

## Contracts and security

- Every request uses credentials: include. Never read the HttpOnly cookie or persist it manually.
- Login uses X-CSRF-Protection: 1. Other mutations use the in-memory X-CSRF-Token.
- Restore both the current account and CSRF token on reload.
- Clear the session and all cached tenant data on logout/401. Reject responses from an older session.
- Company, employee and project PATCH/DELETE operations use the ETag from the editor's fetched snapshot. Never fetch a new version immediately before saving an old draft.
- After 412/428, preserve the draft until the user chooses Reload; do not retry writes automatically.
- Lists use signed cursors and limit=25, never offsets or global totals.
- Query keys include company ID and filters; forward AbortSignal and reset pagination on scope changes.
- Viewer is read-only; admin can mutate ordinary data; owner alone manages access, transfers ownership and deletes the company.
- API 403 responses remain authoritative even when UI controls were enabled.
- Grant access by UUID. There is no account-search API.
- Only active employees can be assigned. Terminal projects cannot accept new assignments.
- Employee end dates are required only for terminated employees. Validate dates and allowed project transitions.
- Handle 204 without JSON parsing. Display Problem Details field errors next to inputs and hide 500 internals.

## Coding conventions

Use strict TypeScript and English code/UI text. Keep functions focused and feature boundaries explicit. Avoid inline code comments and speculative abstractions. Import Material UI components from individual component paths.

Derive values during render instead of mirroring them through useEffect. Keep interaction logic in event handlers and use TanStack Query for request lifecycles. Never share query data across authenticated sessions.

Use MUI sx and the theme palette. MUI 9 layout properties such as alignItems belong in sx. Keep long labels and identifiers bounded, preserve accessible labels, and check narrow screens. Destructive actions need a MUI confirmation dialog. Pending mutations disable duplicate submission and dialog dismissal.

## Verification and commits

Run npm run lint, npm test and npm run build before committing changes. Update relevant tests for behavioral changes. For UI/API changes, run the mocked browser suite and the live suite when a seeded backend is available. Work in reviewable commits with short one-line messages.

Do not stage unrelated user files such as implementation-plan.txt. Do not commit local secrets, node_modules, dist, test-results or playwright-report. Keep README and this file consistent with commands and repository structure.

## Build and deployment

Vite embeds VITE_API_BASE_URL at build time. Use an origin without /api/v1 or a trailing slash. The local sample uses http://localhost:8080. Restart Vite after environment changes.

Docker builds with npm ci and serves dist through Nginx on container port 8080. Run docker compose --env-file .env.local up -d --build after stopping Vite; Compose maps host 5173 to container 8080 so the backend can keep host 8080. Preserve SPA fallback and separate asset caching.

CI in .github/workflows/ci.yaml runs lint, unit tests, build and mocked browser tests. No frontend migrations or database access are required.

## Troubleshooting

Use localhost consistently. The backend must allow http://localhost:5173 for CORS/CSRF and expose ETag. Vite uses strictPort to avoid silently switching origins. Treat backend outages as retryable UI errors without discarding a valid session; 401 alone invalidates authentication.
