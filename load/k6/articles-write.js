import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseUrl, authHeaders, loginAndGetToken, jsonHeaders } from './_helpers.js';

export const options = {
  vus: Number(__ENV.VUS || 2),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<1000'],
  },
};

export function setup() {
  const token = loginAndGetToken();
  return { token };
}

function uniqueTitle() {
  const vu = __VU; // k6 runtime global
  const iter = __ITER;
  return `k6 Article ${vu}-${iter}-${Date.now()}`;
}

export default function (data) {
  const token = data?.token;
  if (!token) {
    sleep(1);
    return;
  }

  // 1) Create
  const createPayload = JSON.stringify({
    article: {
      title: uniqueTitle(),
      description: 'k6 load test article',
      body: 'body from k6',
      tagList: ['k6', 'load'],
    },
  });

  const createRes = http.post(`${baseUrl()}/api/articles`, createPayload, {
    headers: authHeaders(token),
  });

  const createdOk = check(createRes, {
    'create: 200': r => r.status === 200,
    'create: has slug': r => !!r.json()?.article?.slug,
  });

  if (!createdOk) {
    sleep(1);
    return;
  }

  const slug = createRes.json().article.slug;

  // 2) Update
  const updatePayload = JSON.stringify({
    article: {
      body: `updated body from k6 - ${Date.now()}`,
    },
  });

  const updateRes = http.put(`${baseUrl()}/api/articles/${slug}`, updatePayload, {
    headers: authHeaders(token),
  });

  check(updateRes, {
    'update: 200': r => r.status === 200,
  });

  // 3) Delete (cleanup)
  const delRes = http.del(`${baseUrl()}/api/articles/${slug}`, null, {
    headers: authHeaders(token),
  });

  check(delRes, {
    'delete: 204': r => r.status === 204,
  });

  // 4) Confirm gone
  const getRes = http.get(`${baseUrl()}/api/articles/${slug}`, {
    headers: jsonHeaders({ Authorization: `Token ${token}` }),
  });
  check(getRes, { 'deleted: 404': r => r.status === 404 });

  sleep(1);
}

