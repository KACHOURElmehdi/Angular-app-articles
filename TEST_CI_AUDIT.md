# Test & CI/CD Audit — angular-realworld (2026-01-30)

## Test Run Summary
- Commands executed locally: `npx vitest run`.
- Result: 10/10 spec files, 209/209 tests **passed**. Wall-clock ≈92s; Vitest reported duration 20.6s (threads pool). One expected `HttpErrorResponse 401` log emitted during `UserService should call purgeAuth on error` but test passed.
- `npm test` without `run` flag hung in watch mode (timed out at 124s); avoid in automation.
- Playwright / k6 suites **not executed** in this run (require running frontend+backend and browsers); latest recorded Playwright status in `test-results/.last-run.json` is `passed`.

## Pipeline Explanation
- **Format Check (`.github/workflows/lint.yml`)**
  - Triggers: push/PR on `main` or `master`.
  - Steps: checkout → setup Node 20 (npm cache) → `npm ci` → `npm run format:check` (Prettier).
  - Tests executed: none (format only).
- **Playwright E2E (`.github/workflows/playwright.yml`)**
  - Triggers: push/PR on `main` or `master`.
  - Steps: checkout → setup Node 20 (npm cache) → `npm ci` (frontend) → `npm ci` in `backend` → `npm run backend:db` + `npm run backend:seed` → install Playwright chromium deps → `npm run test:e2e` (sets `CI=true`, starts `npm run start:full` via Playwright `webServer`) → upload HTML report always, raw results on failure.
  - Tests executed: Playwright suite (`e2e/*.spec.ts`), serial on Chromium. No unit/coverage/build checks in pipeline.
  - Notes: DB prep runs twice (explicit step + again inside `start:backend`), backend npm cache not configured, Playwright browser cache not reused.

## Test Inventory by Type (code-based)
- **Unit / Service (Vitest + Angular TestBed)**
  - Location: `src/**/*.spec.ts`.
  - Run: `npx vitest run` (jsdom, pool=threads, setup `src/test-setup.ts`, coverage via `vitest --coverage`).
  - Example: `src/app/features/article/services/articles.service.spec.ts` checks `/articles` queries with `HttpTestingController`, ensuring filters and pagination params are sent.
  - Coverage: auth services, JWT, profile service, article/tag/comment services, token interceptor, article-comment component.
- **Component Unit (Vitest + Angular)**  
  - Location: `src/app/features/article/components/article-comment.component.spec.ts`.
  - Run: same Vitest command.
  - Example: renders comment card and asserts delete button conditions.
- **HTTP-facing Unit (Vitest)**  
  - Location: `src/app/features/article/services/articles.service.http.spec.ts`.
  - Run: `npx vitest run`.
  - Example: verifies HTTP methods/paths for create/update/delete article calls.
- **Interceptor Unit (Vitest)**  
  - Location: `src/app/core/interceptors/token.interceptor.spec.ts`.
  - Run: `npx vitest run`.
  - Example: attaches `Authorization: Token ...` when JWT present via `provideHttpClientTesting`.
- **E2E / UI (Playwright)**  
  - Location: `e2e/*.spec.ts`; config `playwright.config.ts` (workers=1, retries=2 on CI, html reporter, webServer `npm run start:full`).
  - Run: `npm run test:e2e` (or `npx playwright test`); supports `--ui`, `--headed`, `--debug`.
  - Example: `e2e/auth.spec.ts` registers/logins users and asserts header/profile visibility using helpers in `e2e/helpers/auth.ts`.
- **Functional API+UI Hybrid (Playwright)**  
  - Location: `e2e/functional.spec.ts` (serial).
  - Run: `npm run test:functional`.
  - Example: creates articles via REST (`request.newContext`) then edits/deletes through UI, cleans up slugs after each test.
- **Load / Performance (k6)**
  - Location: `load/k6/*.js`, docs in `load/k6/README.md`.
  - Run: `npm run load:smoke|load:read|load:write` (requires local backend on `http://127.0.0.1:3000`, seed user).
  - Example: `load/k6/smoke.js` hits `/api/tags` and `/api/articles` with thresholds `http_req_failed<1%`, `p95<500ms`.

## Issues & Risks
- No CI stage for **unit tests** (`vitest`) or **coverage**; regressions can merge unnoticed.
- No **build/TS/ESLint** stage; only Prettier formatting is checked.
- Playwright job duplicates DB prep (workflow step + `start:backend`), slowing runs and risking race on the SQLite file.
- `npm test` script runs Vitest in watch mode locally; previous command hung for 2m. Misleading for CI/local automation unless `CI=true`.
- Backend dependencies not cached; Playwright browsers downloaded each run; wastes minutes per job.
- E2E uses dev servers (`ng serve` + Node backend) rather than production build; slower and less representative.
- Limited **component/UI coverage** (only `article-comment.component`); core flows (editor, settings, routing guards, error states) lack unit coverage.
- No **backend tests** (unit/integration) despite Prisma API surface; only indirectly exercised via Playwright.
- Parallel threads in Vitest with Angular `TestBed` could become flaky under load; single pool may be safer.
- Extra project copy `Angular-app-articles/` contains its own configs/tests but is unused by pipeline—risk of drift/confusion.
- Load tests exist but are manual; not gated or smoke-run in CI/CD.

## Recommendations (prioritized)
1) Add a **Unit Test job** to CI: `npm ci && npm run test -- --runInBand` or change script to `vitest run`; publish coverage (`--coverage`) and fail under threshold (e.g., lines 80%).  
2) Add **Lint/Type safety & Build jobs**: run `ng lint`/ESLint (or add ESLint if missing) and `ng build --configuration production` to catch compilation issues before Playwright.  
3) Optimize Playwright pipeline: cache `~/.npm` for backend (set `cache-dependency-path: | package-lock.json\nbackend/package-lock.json`), cache `~/.cache/ms-playwright`, remove duplicate `backend:db/seed` call (do it once before `npm run test:e2e` or drop from `start:backend`).  
4) Make tests deterministic: set `vitest` script to `vitest run --silent=false` (no watch), consider `pool: 'threads'` → `pool: 'forks'` or `pool: 'vmThreads'`/`maxWorkers=1` for Angular TestBed stability.  
5) Expand unit/component coverage: add specs for `editor`, `settings`, `profile`, routing guards, error banners; mock services to isolate UI. Target quick wins with shallow component tests around form validation and navigation.  
6) Add **backend API tests** (Jest/Vitest + supertest) for auth, articles CRUD, tags; run in CI against SQLite `file:./ci.db`.  
7) Integrate **smoke Playwright** job on PRs (e.g., tag subset like `e2e/health.spec.ts`, `e2e/navigation.spec.ts`) and keep full suite on nightly to reduce PR latency.  
8) Wire **load smoke (k6)** as optional pipeline stage (manual dispatch) with low VUs to detect performance regressions post-deploy.  
9) Publish artifacts: always upload Vitest coverage HTML and Playwright HTML report for failed and successful runs; surface key metrics in GitHub summary.  
10) Clean repo structure: document or remove `Angular-app-articles/` duplicate to avoid stale configs; ensure only one app drives CI.
