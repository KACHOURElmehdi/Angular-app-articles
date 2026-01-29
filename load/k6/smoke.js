import http from 'k6/http';
import { check, sleep } from 'k6';
import { baseUrl } from './_helpers.js';

export const options = {
  vus: Number(__ENV.VUS || 1),
  duration: __ENV.DURATION || '20s',
  thresholds: {
    http_req_failed: ['rate<0.01'],
    http_req_duration: ['p(95)<500'],
  },
};

export default function () {
  const tags = http.get(`${baseUrl()}/api/tags`);
  check(tags, { 'tags: 200': r => r.status === 200 });

  const articles = http.get(`${baseUrl()}/api/articles?limit=10&offset=0`);
  check(articles, { 'articles: 200': r => r.status === 200 });

  sleep(1);
}

