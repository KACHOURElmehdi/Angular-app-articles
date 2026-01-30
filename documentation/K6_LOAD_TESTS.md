# 🚀 K6 Load Testing Guide

## 📋 Overview

This project includes **K6 load tests** to measure performance and identify bottlenecks in the RealWorld API backend.

### Test Suites Available

| Test Suite | File | Purpose | Default Config |
|------------|------|---------|----------------|
| **Smoke Test** | `load/k6/smoke.js` | Quick health check (tags + articles list) | 1 VU, 20s |
| **Read Test** | `load/k6/articles-read.js` | Read-heavy workload (list + details) | 5 VUs, 30s |
| **Write Test** | `load/k6/articles-write.js` | Write operations (create → update → delete) | 2 VUs, 30s |

---

## 🔧 Installation

### Option 1: Chocolatey (Recommended for Windows)

**Run PowerShell as Administrator**, then:

```powershell
choco install k6 -y
```

### Option 2: Manual Download

1. Download K6 from: https://k6.io/docs/get-started/installation/
2. Extract to a folder (e.g., `C:\k6`)
3. Add to PATH:
   ```powershell
   $env:Path += ";C:\k6"
   ```

### Option 3: Scoop

```powershell
scoop install k6
```

### Verify Installation

```powershell
k6 version
# Expected: k6 v0.xx.x
```

---

## 🏃 Running Tests

### Prerequisites

1. **Backend must be running** on `http://127.0.0.1:3000`
2. **Database must be seeded** with demo user: `demo@example.com` / `password`

### Start Backend for Load Testing

**Recommended**: Use a dedicated database for load tests to avoid polluting dev data.

```powershell
# Terminal 1: Start backend with load test database
cd backend
$env:DATABASE_URL="file:./loadtest.db"
npm ci
npx prisma db push
npm run seed
node src/server.js
```

### Run Tests

```powershell
# Terminal 2: Run load tests

# Quick smoke test (1 VU, 20s)
npm run load:smoke

# Read-heavy test (5 VUs, 30s)
npm run load:read

# Write operations test (2 VUs, 30s)
npm run load:write
```

---

## 📊 Understanding Results

### Key Metrics

| Metric | Description | Good Threshold |
|--------|-------------|----------------|
| `http_req_duration` | Request latency | p95 < 500ms (smoke), p95 < 800ms (read), p95 < 1000ms (write) |
| `http_req_failed` | Failed requests rate | < 1% |
| `http_reqs` | Total requests | Higher is better |
| `vus` | Virtual users | As configured |
| `iterations` | Completed iterations | Higher is better |

### Sample Output

```
     ✓ tags: 200
     ✓ articles: 200

     checks.........................: 100.00% ✓ 40       ✗ 0
     data_received..................: 156 kB  7.8 kB/s
     data_sent......................: 4.8 kB  240 B/s
     http_req_blocked...............: avg=1.2ms    min=0s      med=0s      max=24ms    p(90)=0s      p(95)=12ms
     http_req_connecting............: avg=1.1ms    min=0s      med=0s      max=23ms    p(90)=0s      p(95)=11ms
   ✓ http_req_duration..............: avg=45.3ms   min=12ms    med=38ms    max=156ms   p(90)=78ms    p(95)=95ms
     http_req_failed................: 0.00%   ✓ 0        ✗ 40
     http_req_receiving.............: avg=1.2ms    min=0s      med=0s      max=12ms    p(90)=3ms     p(95)=5ms
     http_req_sending...............: avg=0.1ms    min=0s      med=0s      max=1ms     p(90)=0s      p(95)=0s
     http_req_tls_handshaking.......: avg=0s       min=0s      med=0s      max=0s      p(90)=0s      p(95)=0s
     http_req_waiting...............: avg=44ms     min=11ms    med=37ms    max=154ms   p(90)=76ms    p(95)=93ms
     http_reqs......................: 40      2/s
     iteration_duration.............: avg=1.04s    min=1.01s   med=1.03s   max=1.18s   p(90)=1.07s   p(95)=1.09s
     iterations.....................: 20      1/s
     vus............................: 1       min=1      max=1
     vus_max........................: 1       min=1      max=1
```

**✅ Pass Criteria**:
- All checks are ✓ (100%)
- `http_req_failed` = 0.00%
- `http_req_duration` p95 meets thresholds

---

## ⚙️ Customizing Tests

### Environment Variables

All tests support these environment variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `BASE_URL` | Backend API URL | `http://127.0.0.1:3000` |
| `VUS` | Number of virtual users | Varies by test |
| `DURATION` | Test duration | Varies by test |
| `DEMO_EMAIL` | Login email | `demo@example.com` |
| `DEMO_PASSWORD` | Login password | `password` |

### Examples

```powershell
# Run smoke test with 10 VUs for 1 minute
$env:VUS="10"
$env:DURATION="1m"
npm run load:smoke

# Run read test against different backend
$env:BASE_URL="http://localhost:8080"
npm run load:read

# Run write test with custom credentials
$env:DEMO_EMAIL="testuser@example.com"
$env:DEMO_PASSWORD="secret123"
npm run load:write
```

### Direct K6 Execution

```powershell
# More control with k6 CLI
k6 run --vus 10 --duration 2m load/k6/articles-read.js

# Output results to JSON
k6 run --out json=results.json load/k6/smoke.js

# Run with custom thresholds
k6 run --vus 20 --duration 5m \
  --threshold "http_req_duration=p(95)<300" \
  load/k6/articles-read.js
```

---

## 📁 Test Files Explained

### `load/k6/_helpers.js`

Shared utilities:
- `baseUrl()` - Get API base URL
- `jsonHeaders()` - JSON content-type headers
- `authHeaders(token)` - Authorization headers
- `loginAndGetToken()` - Authenticate and get JWT
- `getArticles(token, limit, offset)` - Fetch articles list

### `load/k6/smoke.js`

**Purpose**: Quick health check  
**Endpoints tested**:
- `GET /api/tags`
- `GET /api/articles?limit=10&offset=0`

**Thresholds**:
- `http_req_failed` < 1%
- `http_req_duration` p95 < 500ms

### `load/k6/articles-read.js`

**Purpose**: Read-heavy workload simulation  
**Flow**:
1. Login (setup phase)
2. Fetch articles list (random offset)
3. Pick random article
4. Fetch article details

**Thresholds**:
- `http_req_failed` < 1%
- `http_req_duration` p95 < 800ms

### `load/k6/articles-write.js`

**Purpose**: Write operations stress test  
**Flow**:
1. Login (setup phase)
2. Create article (unique title per VU/iteration)
3. Update article body
4. Delete article
5. Verify deletion (404)

**Thresholds**:
- `http_req_failed` < 1%
- `http_req_duration` p95 < 1000ms

---

## 🎯 Best Practices

### 1. Use Dedicated Database

```powershell
# Don't pollute dev database
$env:DATABASE_URL="file:./loadtest.db"
```

### 2. Start Small, Scale Up

```powershell
# Start with 1 VU to verify tests work
$env:VUS="1"
npm run load:read

# Then increase gradually
$env:VUS="5"
$env:VUS="10"
$env:VUS="50"
```

### 3. Monitor Backend

Watch backend logs and system resources (CPU, memory, DB connections) during tests.

### 4. Clean Up After Write Tests

Write tests create and delete articles automatically, but verify cleanup:

```powershell
# Check article count before/after
curl http://127.0.0.1:3000/api/articles?limit=100
```

### 5. Run Tests Regularly

```powershell
# Add to CI/CD pipeline (optional)
# .github/workflows/performance.yml
```

---

## 🐛 Troubleshooting

### Error: "login: status 200" check failed

**Cause**: Backend not running or wrong credentials  
**Solution**:
```powershell
# Verify backend is running
curl http://127.0.0.1:3000/api/tags

# Check demo user exists
cd backend
npm run seed
```

### Error: "k6: command not found"

**Cause**: K6 not installed or not in PATH  
**Solution**:
```powershell
# Reinstall K6
choco install k6 -y

# Or add to PATH manually
$env:Path += ";C:\path\to\k6"
```

### High Failure Rate

**Cause**: Backend overloaded or database locked  
**Solution**:
```powershell
# Reduce VUs
$env:VUS="2"

# Increase duration (spread load)
$env:DURATION="2m"

# Check backend logs for errors
```

### Slow Response Times

**Possible causes**:
- Database not optimized (missing indexes)
- Backend running in debug mode
- Insufficient system resources
- Network latency (if backend is remote)

**Solutions**:
- Run backend in production mode
- Use local backend (not remote)
- Optimize database queries
- Add database indexes

---

## 📈 Advanced: Load Testing Scenarios

### Scenario 1: Spike Test

Simulate sudden traffic spike:

```javascript
// load/k6/spike.js
export const options = {
  stages: [
    { duration: '10s', target: 5 },   // Ramp up
    { duration: '30s', target: 50 },  // Spike!
    { duration: '10s', target: 5 },   // Ramp down
  ],
};
```

### Scenario 2: Stress Test

Find breaking point:

```javascript
// load/k6/stress.js
export const options = {
  stages: [
    { duration: '2m', target: 10 },
    { duration: '5m', target: 50 },
    { duration: '2m', target: 100 },
    { duration: '5m', target: 100 },
    { duration: '2m', target: 0 },
  ],
};
```

### Scenario 3: Soak Test

Long-running stability test:

```powershell
$env:VUS="10"
$env:DURATION="30m"
npm run load:read
```

---

## 🔗 Resources

- **K6 Documentation**: https://k6.io/docs/
- **K6 Examples**: https://k6.io/docs/examples/
- **K6 Cloud**: https://k6.io/cloud/ (optional paid service)
- **Grafana + K6**: https://k6.io/docs/results-output/real-time/grafana/

---

## 📝 Adding New Tests

### Template

```javascript
// load/k6/my-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseUrl, authHeaders, loginAndGetToken } from './_helpers.js';

export const options = {
  vus: Number(__ENV.VUS || 5),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

export function setup() {
  return { token: loginAndGetToken() };
}

export default function (data) {
  const token = data?.token;
  
  // Your test logic here
  const res = http.get(`${baseUrl()}/api/endpoint`, {
    headers: authHeaders(token),
  });
  
  check(res, {
    'status is 200': (r) => r.status === 200,
  });
  
  sleep(1);
}
```

### Add to package.json

```json
{
  "scripts": {
    "load:mytest": "k6 run load/k6/my-test.js"
  }
}
```

---

## ✅ Summary

You now have:
- ✅ 3 ready-to-use K6 load tests
- ✅ npm scripts for easy execution
- ✅ Configurable via environment variables
- ✅ Thresholds to catch performance regressions
- ✅ Helper functions for common operations

**Next steps**:
1. Install K6 (run PowerShell as Administrator)
2. Start backend with load test database
3. Run `npm run load:smoke` to verify setup
4. Gradually increase load with `load:read` and `load:write`
5. Monitor results and optimize as needed
