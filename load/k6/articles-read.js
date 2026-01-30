import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseUrl, loginAndGetToken, getArticles } from './_helpers.js';

export const options = {
  vus: Number(__ENV.VUS || 5),
  duration: __ENV.DURATION || '30s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<800'],
  },
};

export function setup() {
  // Optional auth: some endpoints behave differently (favorited, following, etc).
  return { token: loginAndGetToken() };
}

export default function (data) {
  const token = (data && data.token) || null;

  const listRes = getArticles(token, 10, Math.floor(Math.random() * 20));
  const okList = check(listRes, {
    'articles list: 200': r => r.status === 200,
    'articles list: has articles[]': r => { const json = r.json(); return Array.isArray(json && json.articles); },
  });

  if (!okList) {
    sleep(1);
    return;
  }

  const body = listRes.json();
  const articles = (body && body.articles) || [];
  if (articles.length === 0) {
    sleep(1);
    return;
  }

  const pick = articles[Math.floor(Math.random() * articles.length)];
  const slug = pick.slug;

  const detailRes = http.get(`${baseUrl()}/api/articles/${slug}`, {
    headers: token ? { Authorization: `Token ${token}` } : undefined,
  });

  check(detailRes, {
    'article detail: 200': r => r.status === 200,
    'article detail: slug matches': r => { const json = r.json(); return json && json.article && json.article.slug === slug; },
  });

  sleep(1);
}

