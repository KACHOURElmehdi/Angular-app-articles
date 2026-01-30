# K6 Load Tests - Quick Reference

## 🚀 Quick Start

### 1. Install K6 (PowerShell as Admin)
```powershell
choco install k6 -y
```

### 2. Start Backend
```powershell
cd backend
$env:DATABASE_URL="file:./loadtest.db"
npx prisma db push && npm run seed && node src/server.js
```

### 3. Run Tests
```powershell
# Smoke test (1 VU, 20s)
npm run load:smoke

# Read test (5 VUs, 30s)
npm run load:read

# Write test (2 VUs, 30s)
npm run load:write
```

---

## 📊 Available Tests

| Command | VUs | Duration | Tests |
|---------|-----|----------|-------|
| `npm run load:smoke` | 1 | 20s | Tags + Articles list |
| `npm run load:read` | 5 | 30s | List + Details |
| `npm run load:write` | 2 | 30s | Create → Update → Delete |

---

## ⚙️ Customize

```powershell
# Change VUs and duration
$env:VUS="10"
$env:DURATION="2m"
npm run load:read

# Different backend
$env:BASE_URL="http://localhost:8080"
npm run load:smoke
```

---

## ✅ Success Criteria

- ✓ All checks = 100%
- ✓ `http_req_failed` = 0.00%
- ✓ `http_req_duration` p95 < threshold

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "k6: command not found" | Install K6 or add to PATH |
| "login: status 200 failed" | Start backend + seed database |
| High failure rate | Reduce VUs or increase duration |

---

## 📁 Files

```
load/k6/
├── _helpers.js         # Shared utilities
├── smoke.js            # Quick health check
├── articles-read.js    # Read workload
├── articles-write.js   # Write workload
└── README.md           # Full documentation
```

---

## 📖 Full Documentation

See [K6_LOAD_TESTS.md](./K6_LOAD_TESTS.md) for complete guide.
