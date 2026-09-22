# Company Management

A React + TypeScript frontend for the Company Management API.

## Run locally

Use Node.js 24 and npm. The backend must be running at http://localhost:8080.
Create `.env.local` from `.env.local.sample`. Then run:
```powershell
npm install
npm run dev
```

Open **http://localhost:5173**. Remember that to use other port, you need to re-configure backend CORS/CSRF checks.

After the backend's demo seed, sign in with `owner@demo.example` and a demo password `demo-password-123`. Demo accounts also include `admin@demo.example`, `viewer@demo.example` and `outsider@demo.example`. Same demo pasword for all of them. These are development fixtures only. Account creation and password resets are backend admin operations within the scope of operations managed by company.

## Features

- Cookie login, in-memory CSRF, session restoration and logout.
- Company CRUD, role filtering and cursor pagination.
- Employee CRUD, employment status filtering, date/email/phone validation.
- Project CRUD, status filtering and project lifecycle transitions.
- Paginated assignments and active employee selection; assign and remove employees.
- Role changes, ownership transfer and revocation.
- Resource ETags for edits/deletes, explicit reload after concurrent modifications, field-level validation and Problem Details handling.
- Loading, empty, error and success states; confirmation dialogs; responsive layouts and Material UI controls.

All collections use a 25-record cursor page and "Load more" button. Changing the company or filter starts a new list. Mutations refresh the affected data. Reads consume AbortSignal; tenant/filter query keys isolate out-of-order responses. Logout and 401 responses clear session and cached data.

## Checks

```powershell
npm run lint
npm run format:check
npm test
npm run build
```

Unit/component tests cover API headers, 204 responses, session invalidation, ETags, form validation, stale edit recovery, domain rules and pagination.

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

The backend's docs/openapi.json is the contract source. TypeScript models and endpoint functions mirror it; recheck them whenever the backend changes.

Design and implementation references: [Material UI fields](https://mui.com/material-ui/react-text-field/), [TanStack infinite queries](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries), and [AGENTS.md guidance](https://agents.md/).
