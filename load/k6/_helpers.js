import http from 'k6/http';
import { check, sleep } from 'k6';

export function baseUrl() {
  return __ENV.BASE_URL || 'http://127.0.0.1:3000';
}

export function jsonHeaders(extra = {}) {
  return Object.assign({
    'Content-Type': 'application/json',
  }, extra);
}

export function authHeaders(token) {
  // This app uses "Token <jwt>" (RealWorld spec).
  return jsonHeaders({ Authorization: `Token ${token}` });
}

export function loginAndGetToken() {
  const url = `${baseUrl()}/api/users/login`;
  const payload = JSON.stringify({
    user: {
      email: __ENV.DEMO_EMAIL || 'demo@example.com',
      password: __ENV.DEMO_PASSWORD || 'password',
    },
  });

  const res = http.post(url, payload, { headers: jsonHeaders() });

  check(res, {
    'login: status 200': r => r.status === 200,
    'login: has token': r => {
      try {
        const body = r.json();
        return !!(body && body.user && body.user.token);
      } catch (e) {
        return false;
      }
    },
  });

  if (res.status !== 200) {
    // If login fails, stop the VU quickly to avoid spamming invalid requests.
    sleep(1);
    return null;
  }

  return res.json().user.token;
}

export function getArticles(token, limit = 10, offset = 0) {
  const url = `${baseUrl()}/api/articles?limit=${limit}&offset=${offset}`;
  return http.get(url, { headers: token ? authHeaders(token) : undefined });
}

