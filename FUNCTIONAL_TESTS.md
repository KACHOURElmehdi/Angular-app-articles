# Functional Tests (Playwright)

Scenarios covered

- Auth login success + failure (token persistence, UI state)
- Create, edit, delete article (via UI) with backend-backed verification

Why Playwright

- Already present in the repo, fast headless runs, good API for localStorage checks and backend API calls used for seeding/cleanup.

Data strategy

- A unique user is created once via API in `e2e/functional.spec.ts`.
- Each test uses timestamped titles; all created slugs are deleted via API in `afterEach` to keep the DB clean.
- Delete scenario additionally polls the API to confirm 404 after UI delete.

Prereqs (first run)

```bash
npx playwright install chromium
```

Run order (3 terminals recommended)

1. Backend (port 3000):
   ```bash
   cd backend
   npm start
   ```
2. Frontend (port 4200, uses proxy /api -> 3000):
   ```bash
   npm start
   ```
3. Functional tests (Chromium, serial):
   ```bash
   npm run test:functional
   ```
   UI/debug mode:
   ```bash
   npm run test:functional:ui
   ```

Key selectors (data-testid)

- Auth: `auth-email`, `auth-password`, `auth-submit`
- Nav: `nav-username`, `nav-new-article`
- Editor: `editor-title`, `editor-description`, `editor-body`, `editor-submit`
- Article: `article-title`, `article-body`, `article-edit`, `article-delete`

Reports

- Playwright HTML report: `npx playwright show-report`
