jest.mock('../config', () => ({ jwtSecret: 'test-secret' }));

const mockPrisma = {
  user: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock('../prisma', () => mockPrisma);

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

jest.mock('jsonwebtoken', () => ({
  sign: jest.fn(),
  verify: jest.fn(),
}));

const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const authRouter = require('../routes/auth');
const { authRequired } = require('../middleware/auth');

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

const getHandler = stack => stack[stack.length - 1].handle;

const createRes = () => {
  const res = {};
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('Auth utilities (hashing, token)', () => {
  const registerHandler = getHandler(findRouteStack(authRouter, '/users'));
  const loginHandler = getHandler(findRouteStack(authRouter, '/users/login'));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('hashes password and stores lower-cased email during registration', async () => {
    prisma.user.findFirst.mockResolvedValue(null);
    bcrypt.hash.mockResolvedValue('hashed-pass');
    prisma.user.create.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
      username: 'Tester',
      passwordHash: 'hashed-pass',
    });
    jwt.sign.mockReturnValue('signed-jwt');

    const req = {
      body: { user: { username: 'Tester', email: 'TEST@EXAMPLE.COM', password: 'Secret123' } },
    };
    const res = createRes();
    const next = jest.fn();

    await registerHandler(req, res, next);

    expect(bcrypt.hash).toHaveBeenCalledWith('Secret123', 10);
    expect(prisma.user.create).toHaveBeenCalledWith({
      data: { username: 'Tester', email: 'test@example.com', passwordHash: 'hashed-pass' },
    });
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 1, email: 'test@example.com', username: 'Tester' },
      'test-secret',
      { expiresIn: '7d' },
    );
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({
      user: expect.objectContaining({ email: 'test@example.com', token: 'signed-jwt' }),
    });
  });

  it('compares password and signs JWT on login', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 2,
      email: 'user@example.com',
      username: 'user',
      passwordHash: 'stored-hash',
    });
    bcrypt.compare.mockResolvedValue(true);
    jwt.sign.mockReturnValue('login-token');

    const req = { body: { user: { email: 'user@example.com', password: 'password123' } } };
    const res = createRes();
    const next = jest.fn();

    await loginHandler(req, res, next);

    expect(bcrypt.compare).toHaveBeenCalledWith('password123', 'stored-hash');
    expect(jwt.sign).toHaveBeenCalledWith(
      { id: 2, email: 'user@example.com', username: 'user' },
      'test-secret',
      { expiresIn: '7d' },
    );
    expect(res.json).toHaveBeenCalledWith({
      user: expect.objectContaining({ email: 'user@example.com', token: 'login-token' }),
    });
  });

  it('returns 400 when password does not match on login', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 2,
      email: 'user@example.com',
      username: 'user',
      passwordHash: 'stored-hash',
    });
    bcrypt.compare.mockResolvedValue(false);

    const req = { body: { user: { email: 'user@example.com', password: 'wrong' } } };
    const res = createRes();
    const next = jest.fn();

    await loginHandler(req, res, next);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ errors: { body: ['Invalid email or password'] } });
  });
});

describe('JWT verification in auth middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('verifies token and attaches user on authRequired', async () => {
    jwt.verify.mockReturnValue({ id: 99 });
    prisma.user.findUnique.mockResolvedValue({ id: 99, username: 'bob' });
    const req = {
      get: jest.fn().mockReturnValue('Token abc.def'),
    };
    const res = createRes();
    const next = jest.fn();

    await authRequired(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('abc.def', 'test-secret');
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 99 } });
    expect(req.user).toEqual({ id: 99, username: 'bob' });
    expect(next).toHaveBeenCalled();
  });

  it('returns 401 when token is missing', async () => {
    const req = { get: jest.fn().mockReturnValue(undefined) };
    const res = createRes();
    const next = jest.fn();

    await authRequired(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ errors: { body: ['Unauthorized'] } });
    expect(next).not.toHaveBeenCalled();
  });

  it('returns 401 when token verification fails', async () => {
    jwt.verify.mockImplementation(() => {
      throw new Error('invalid');
    });
    const req = { get: jest.fn().mockReturnValue('Token bad.token') };
    const res = createRes();
    const next = jest.fn();

    await authRequired(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({ errors: { body: ['Unauthorized'] } });
    expect(next).not.toHaveBeenCalled();
  });
});
