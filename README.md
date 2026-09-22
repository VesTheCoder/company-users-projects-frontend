# Company Management

A React + TypeScript frontend for the sibling Company Management API. Material UI provides a restrained light theme, React Router provides deep links, and TanStack Query manages server data.

## Run locally

Use Node.js 24 and npm. The backend must be running at http://localhost:8080.

```powershell
npm install
Copy-Item .env.local.sample .env.local
npm run dev
```

Open **http://localhost:5173**. Vite uses a strict port so an unexpected port cannot silently break backend CORS/CSRF checks.

The local configuration is:

```dotenv
VITE_API_BASE_URL=http://localhost:8080
```

Use the origin only, without a trailing slash or /api/v1. Vite embeds this public value at build time. Restart Vite after changing it. No secrets belong in VITE_* variables.

The backend must allow http://localhost:5173 in CORS_ALLOWED_ORIGINS and expose ETag. Its supplied development configuration already supports this. Use localhost consistently rather than mixing localhost and 127.0.0.1.

After the backend's demo seed, sign in with owner@demo.example and the documented demo password demo-password-123. Demo accounts also include admin@demo.example, viewer@demo.example and outsider@demo.example. These are development fixtures only. Account creation and password resets remain backend CLI operations.

## Features

- Cookie login, in-memory CSRF, session restoration and logout.
- Company CRUD, role filtering and cursor pagination.
- Employee CRUD, employment status filtering, date/email/phone validation.
- Project CRUD, status filtering and allowed lifecycle transitions.
- Paginated assignments and active employee selection; assign and remove employees.
- Owner-only access grants by existing account UUID, role changes, revocation and ownership transfer.
- Owner/admin/viewer controls derived from each company's current_role.
- Resource ETags for edits/deletes, explicit reload after concurrent modifications, field-level validation and Problem Details handling.
- Loading, empty, error and success states; confirmation dialogs; responsive layouts and keyboard-accessible Material UI controls.

All collections use a 25-record cursor page and Load more. Changing the company or filter starts a new list. Mutations refresh the affected data. Reads consume AbortSignal; tenant/filter query keys isolate out-of-order responses. Logout and 401 responses clear session and cached data.

## Checks

```powershell
npm run lint
npm run format:check
npm test
npm run build
npm run test:watch
```

Unit/component tests are colocated under src. They cover API headers, 204 responses, session invalidation, ETags, form validation, stale edit recovery, domain rules and pagination.

Browser tests use Chromium:

```powershell
npx playwright install chromium
npm run test:e2e -- e2e/errors.spec.ts
npm run test:e2e -- e2e/live.spec.ts
```

The error suite mocks the API and needs no backend. The live suite needs the running, seeded development backend with owner and viewer demo accounts. It creates a disposable company, tests CRUD, assignments, ownership transfer in both directions and owner/admin/viewer permissions, and deletes its test records. It does not modify the seeded companies. If the demo password differs, set E2E_PASSWORD in your shell. Do not run the live suite against production. Tracing is off so credentials are not captured in trace artifacts.

The browser runner starts Vite if necessary and reuses an existing localhost:5173 server. Screenshots and failure artifacts are ignored under test-results. CI runs lint, unit tests, build and the mocked browser suite; the live suite is a local integration check.

## Docker

The production image serves the compiled SPA with Nginx listening on container port **8080**. Compose maps it to host **5173**, keeping host 8080 available for the existing backend.

Stop Vite before starting Compose:

```powershell
docker compose --env-file .env.local up -d --build
docker compose --env-file .env.local down
```

Open http://localhost:5173. Nested routes fall back to index.html. Hashed assets have immutable caching; the application entry is revalidated. Changing the API origin requires rebuilding the frontend image. The backend remains independently managed in its own repository.

For a standalone image:

```powershell
docker build --build-arg VITE_API_BASE_URL=http://localhost:8080 -t company-management-frontend .
docker run --rm -p 5173:8080 company-management-frontend
```

## Structure

| Directory     | Responsibility                                                                   |
| ------------- | -------------------------------------------------------------------------------- |
| src/api       | Typed API contracts, HTTP transport, resource operations and query configuration |
| src/auth      | Session lifecycle and sign-in page                                               |
| src/layout    | Application shell and central theme palette                                      |
| src/companies | Company list/details and access administration                                   |
| src/employees | Employee management                                                              |
| src/projects  | Projects and assignments                                                         |
| src/shared    | Forms, confirmation, feedback and cursor collection controls                     |
| e2e           | Mocked browser regression tests and live integration journey                     |
| docker        | Nginx SPA configuration                                                          |

The backend's docs/openapi.json is the contract source. TypeScript models and endpoint functions mirror it; recheck them whenever the backend changes. API types are maintained explicitly rather than generated.

Design and implementation references: [Material UI fields](https://mui.com/material-ui/react-text-field/), [TanStack infinite queries](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries), and [AGENTS.md guidance](https://agents.md/).

## Boundaries

There is no user directory or account provisioning UI because the API does not expose those capabilities. Company employee records are not authentication accounts. The app does not load all records or calculate global totals. Closed projects retain existing assignments but cannot accept new ones. Server-side authorization remains authoritative if a role changes while a page is open.

Production hosting needs HTTPS, secure session cookies and explicitly configured backend CORS/trusted origins. The included Compose configuration is for local development and demonstration.
