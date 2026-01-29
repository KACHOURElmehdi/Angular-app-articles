# Load Tests (k6) - Local

These are lightweight load tests for the local RealWorld backend API.

Prereqs

- Backend running locally on `http://127.0.0.1:3000`
- Seeded demo user exists: `demo@example.com` / `password`
- k6 installed (Windows):
  - `winget install k6.k6`
  - or `choco install k6`

Recommended: run backend on a dedicated DB file for load tests

- In PowerShell (from repo root):

```powershell
cd backend
$env:DATABASE_URL="file:./loadtest.db"
npm ci
npx prisma db push
npm run seed
node src/server.js
```

Run tests (from repo root)

```powershell
# quick smoke (tags + articles list)
npm run load:smoke

# read-heavy (list + article details)
npm run load:read

# write scenario (create -> update -> delete)
npm run load:write
```

Tuning (optional)

- All scripts accept:
  - `BASE_URL` (default: `http://127.0.0.1:3000`)
  - `VUS` (virtual users)
  - `DURATION` (e.g. `30s`, `2m`)

Example:

```powershell
$env:BASE_URL="http://127.0.0.1:3000"
$env:VUS="10"
$env:DURATION="1m"
k6 run load/k6/articles-read.js
```
