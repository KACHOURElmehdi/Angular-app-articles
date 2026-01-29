const { validationResult } = require('express-validator');

jest.mock('../config', () => ({ jwtSecret: 'test-secret' }));
jest.mock('../prisma', () => ({}));

const authRouter = require('../routes/auth');
const articlesRouter = require('../routes/articles');

const findRouteStack = (router, path, method = 'post') => {
  const layer = router.stack.find(
    l =>
      l.route &&
      l.route.methods[method] &&
      (Array.isArray(l.route.path) ? l.route.path.includes(path) : l.route.path === path),
  );
  if (!layer) throw new Error(`Route for ${path} not found`);
  return layer.route.stack;
};

const runValidators = async (validatorLayers, body) => {
  const req = { body };
  const res = {};
  const next = jest.fn();
  for (const layer of validatorLayers) {
    await layer.handle(req, res, next);
  }
  return validationResult(req);
};

describe('validateRegisterInput', () => {
  const registerValidators = findRouteStack(authRouter, '/users').slice(0, 3);

  it('flags missing username and short password', async () => {
    const result = await runValidators(registerValidators, {
      user: { email: 'bad@example.com', password: '123' },
    });

    const messages = result.array().map(e => e.msg);
    expect(messages).toContain('username is required');
    expect(messages).toContain('password must be at least 6 characters');
  });

  it('flags invalid email', async () => {
    const result = await runValidators(registerValidators, {
      user: { username: 'alice', email: 'not-an-email', password: 'secret123' },
    });

    const messages = result.array().map(e => e.msg);
    expect(messages).toContain('email is invalid');
  });

  it('passes with valid payload', async () => {
    const result = await runValidators(registerValidators, {
      user: { username: 'alice', email: 'alice@example.com', password: 'secret123' },
    });

    expect(result.isEmpty()).toBe(true);
  });
});

describe('validateLoginInput', () => {
  const loginValidators = findRouteStack(authRouter, '/users/login').slice(0, 2);

  it('requires email and password', async () => {
    const result = await runValidators(loginValidators, { user: { email: 'bad', password: '' } });
    const messages = result.array().map(e => e.msg);
    expect(messages).toContain('email is invalid');
    expect(messages).toContain('password is required');
  });

  it('passes with valid credentials', async () => {
    const result = await runValidators(loginValidators, {
      user: { email: 'user@example.com', password: 'password123' },
    });
    expect(result.isEmpty()).toBe(true);
  });
});

describe('validateArticleInput', () => {
  const articleValidators = findRouteStack(articlesRouter, '/articles').slice(1, 5);

  it('requires title and body', async () => {
    const result = await runValidators(articleValidators, { article: { description: 'desc' } });
    const messages = result.array().map(e => e.msg);
    expect(messages).toContain('title is required');
    expect(messages).toContain('body is required');
  });

  it('requires tagList to be an array when provided', async () => {
    const result = await runValidators(articleValidators, {
      article: { title: 't', body: 'b', tagList: 'not-an-array' },
    });
    const messages = result.array().map(e => e.msg);
    expect(messages).toContain('tagList must be an array');
  });

  it('passes with valid article payload', async () => {
    const result = await runValidators(articleValidators, {
      article: { title: 'Hello', body: 'Body', description: 'Desc', tagList: ['one', 'two'] },
    });
    expect(result.isEmpty()).toBe(true);
  });
});
