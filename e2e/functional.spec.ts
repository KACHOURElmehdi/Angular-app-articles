import { test, expect, request, type Page } from '@playwright/test';

const API_BASE = 'http://127.0.0.1:3000';

const testUser = (() => {
  const suffix = Date.now();
  return {
    username: `funcuser${suffix}`,
    email: `func${suffix}@example.com`,
    password: 'Password123!',
  };
})();

let authToken: string;
const cleanupSlugs: string[] = [];

async function ensureUserAndToken(): Promise<void> {
  const api = await request.newContext({ baseURL: API_BASE });

  const registerRes = await api.post('/api/users', { data: { user: testUser } });
  if (registerRes.status() >= 400 && registerRes.status() !== 422) {
    throw new Error(`Unable to register test user: ${registerRes.status()} ${registerRes.statusText()}`);
  }

  const loginRes = await api.post('/api/users/login', {
    data: { user: { email: testUser.email, password: testUser.password } },
  });
  const body = await loginRes.json();
  authToken = body.user.token;
  await api.dispose();
}

async function waitForApiReady() {
  const api = await request.newContext({ baseURL: API_BASE });
  for (let i = 0; i < 90; i++) {
    try {
    const res = await api.get('/api/tags');
      if (res.ok()) {
        await api.dispose();
        return;
      }
    } catch {
      // ignore and retry
    }
    await new Promise(r => setTimeout(r, 1000));
  }
  await api.dispose();
  throw new Error('API did not become ready in time');
}

async function createArticleViaApi(data: { title: string; description: string; body: string; tagList?: string[] }) {
  const api = await request.newContext({
    baseURL: API_BASE,
    extraHTTPHeaders: { Authorization: `Token ${authToken}` },
  });

  const res = await api.post('/api/articles', { data: { article: { ...data, tagList: data.tagList ?? [] } } });
  if (!res.ok()) {
    throw new Error(`Failed to create article: ${res.status()} ${res.statusText()}`);
  }

  const article = (await res.json()).article;
  cleanupSlugs.push(article.slug);
  await api.dispose();
  return article;
}

async function deleteRecordedArticles() {
  if (!cleanupSlugs.length) return;
  const api = await request.newContext({
    baseURL: API_BASE,
    extraHTTPHeaders: { Authorization: `Token ${authToken}` },
  });
  for (const slug of cleanupSlugs.splice(0)) {
    await api.delete(`/api/articles/${slug}`);
  }
  await api.dispose();
}

async function loginViaUi(page: Page) {
  await page.goto('/login');
  await page.fill('[data-testid="auth-email"]', testUser.email);
  await page.fill('[data-testid="auth-password"]', testUser.password);
  await Promise.all([page.waitForURL('**/'), page.click('[data-testid="auth-submit"]')]);
  await expect(page.getByTestId('nav-username')).toContainText(testUser.username);
}

test.describe.configure({ mode: 'serial' }); // keep state predictable for local backend
test.setTimeout(120000);

test.beforeAll(async () => {
  await waitForApiReady();
  await ensureUserAndToken();
});

test.afterEach(async () => {
  await deleteRecordedArticles();
});

test('Auth - login success', async ({ page }) => {
  await loginViaUi(page);

  const storedToken = await page.evaluate(() => localStorage.getItem('jwtToken'));
  expect(storedToken).toBeTruthy();
  await expect(page).toHaveURL(/http:\/\/127\.0\.0\.1:4200\/?$/);
  await expect(page.getByTestId('nav-username')).toContainText(testUser.username);
});

test('Auth - login failure', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[data-testid="auth-email"]', testUser.email);
  await page.fill('[data-testid="auth-password"]', 'WrongPassword!');
  await page.click('[data-testid="auth-submit"]');

  await expect(page.locator('.error-messages')).toContainText('Invalid email or password');
  const storedToken = await page.evaluate(() => localStorage.getItem('jwtToken'));
  expect(storedToken).toBeFalsy();
});

test('Articles - create article', async ({ page }) => {
  const title = `Functional Create ${Date.now()}`;
  const description = 'A short description';
  const body = 'Body content for creation scenario';

  await loginViaUi(page);
  await page.getByTestId('nav-new-article').click();

  await page.fill('[data-testid="editor-title"]', title);
  await page.fill('[data-testid="editor-description"]', description);
  await page.fill('[data-testid="editor-body"]', body);
  await page.fill('[data-testid="editor-tags"]', 'functional,playwright');
  await page.keyboard.press('Enter');

  await Promise.all([page.waitForURL('**/article/**'), page.getByTestId('editor-submit').click()]);

  const slug = page.url().split('/').pop() as string;
  cleanupSlugs.push(slug);

  await expect(page.getByTestId('article-title')).toHaveText(title);
  await expect(page.getByTestId('article-body')).toContainText(body);

  await page.goto('/');
  await expect(page.getByRole('heading', { name: title })).toBeVisible();
});

test('Articles - edit article', async ({ page }) => {
  const article = await createArticleViaApi({
    title: `Editable ${Date.now()}`,
    description: 'Editable description',
    body: 'Original body',
    tagList: ['edit'],
  });

  const updatedBody = 'Updated body from functional test';

  await loginViaUi(page);
  await page.goto(`/article/${article.slug}`);
  await page.getByTestId('article-edit').click();

  await page.fill('[data-testid="editor-body"]', updatedBody);
  await Promise.all([page.waitForURL('**/article/**'), page.getByTestId('editor-submit').click()]);

  await expect(page.getByTestId('article-body')).toContainText(updatedBody);
});

test('Articles - delete article', async ({ page }) => {
  const article = await createArticleViaApi({
    title: `Deletable ${Date.now()}`,
    description: 'To be removed',
    body: 'Delete me',
  });

  await loginViaUi(page);
  await page.goto(`/article/${article.slug}`);
  await Promise.all([page.waitForURL('http://127.0.0.1:4200/'), page.getByTestId('article-delete').click()]);

  const api = await request.newContext({
    baseURL: API_BASE,
    extraHTTPHeaders: { Authorization: `Token ${authToken}` },
  });

  await expect
    .poll(async () => {
      const res = await api.get(`/articles/${article.slug}`);
      return res.status();
    })
    .toBe(404);

  await api.dispose();
});
