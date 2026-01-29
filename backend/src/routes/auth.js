const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const prisma = require('../prisma');
const config = require('../config');
const { authRequired } = require('../middleware/auth');
const { validateRequest } = require('../middleware/validate');
const { formatUser } = require('../utils/format');

const router = express.Router();

const buildToken = user =>
  jwt.sign(
    {
      id: user.id,
      email: user.email,
      username: user.username,
    },
    config.jwtSecret,
    { expiresIn: '7d' },
  );

const registerValidation = [
  body('user.username').trim().notEmpty().withMessage('username is required'),
  body('user.email').isEmail().withMessage('email is invalid'),
  body('user.password').isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
];

const loginValidation = [
  body('user.email').isEmail().withMessage('email is invalid'),
  body('user.password').notEmpty().withMessage('password is required'),
];

const updateValidation = [
  body('user.email').optional().isEmail().withMessage('email is invalid'),
  body('user.username').optional().isLength({ min: 3 }).withMessage('username must be at least 3 characters'),
  body('user.password').optional().isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
];

router.post(['/auth/register', '/users'], registerValidation, validateRequest, async (req, res, next) => {
  try {
    const { username, email, password } = req.body.user;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ email: email.toLowerCase() }, { username }] },
    });
    if (existing) {
      return res.status(422).json({ errors: { body: ['Email or username already in use'] } });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email: email.toLowerCase(),
        passwordHash,
      },
    });

    const token = buildToken(user);
    return res.status(201).json({ user: formatUser(user, token) });
  } catch (err) {
    return next(err);
  }
});

router.post(['/auth/login', '/users/login'], loginValidation, validateRequest, async (req, res, next) => {
  try {
    const { email, password } = req.body.user;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (!user) return res.status(400).json({ errors: { body: ['Invalid email or password'] } });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(400).json({ errors: { body: ['Invalid email or password'] } });

    const token = buildToken(user);
    return res.json({ user: formatUser(user, token) });
  } catch (err) {
    return next(err);
  }
});

router.get(['/auth/me', '/user'], authRequired, async (req, res, next) => {
  try {
    const token = req.token;
    return res.json({ user: formatUser(req.user, token) });
  } catch (err) {
    return next(err);
  }
});

router.put('/user', authRequired, updateValidation, validateRequest, async (req, res, next) => {
  try {
    const updates = req.body.user || {};
    const data = {};

    if (updates.email) {
      const email = updates.email.toLowerCase();
      const exists = await prisma.user.findFirst({
        where: { email, NOT: { id: req.user.id } },
      });
      if (exists) return res.status(422).json({ errors: { body: ['Email already in use'] } });
      data.email = email;
    }

    if (updates.username) {
      const exists = await prisma.user.findFirst({
        where: { username: updates.username, NOT: { id: req.user.id } },
      });
      if (exists) return res.status(422).json({ errors: { body: ['Username already in use'] } });
      data.username = updates.username;
    }

    if (updates.bio !== undefined) data.bio = updates.bio;
    if (updates.image !== undefined) data.image = updates.image;
    if (updates.password) data.passwordHash = await bcrypt.hash(updates.password, 10);

    const user = await prisma.user.update({
      where: { id: req.user.id },
      data,
    });

    const token = req.token || buildToken(user);
    return res.json({ user: formatUser(user, token) });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
