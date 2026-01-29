const jwt = require('jsonwebtoken');
const prisma = require('../prisma');
const config = require('../config');

const unauthorized = res => res.status(401).json({ errors: { body: ['Unauthorized'] } });

const extractToken = req => {
  const authHeader = req.get('Authorization') || '';
  const parts = authHeader.split(' ');
  if (parts.length === 2 && (parts[0].toLowerCase() === 'token' || parts[0].toLowerCase() === 'bearer')) {
    return parts[1];
  }
  return null;
};

const getUserFromToken = async token => {
  const decoded = jwt.verify(token, config.jwtSecret);
  return prisma.user.findUnique({ where: { id: decoded.id } });
};

const authOptional = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return next();

  try {
    const user = await getUserFromToken(token);
    if (user) {
      req.user = user;
      req.token = token;
    }
  } catch (err) {
    // ignore invalid tokens for optional auth
  }
  return next();
};

const authRequired = async (req, res, next) => {
  const token = extractToken(req);
  if (!token) return unauthorized(res);

  try {
    const user = await getUserFromToken(token);
    if (!user) return unauthorized(res);

    req.user = user;
    req.token = token;
    return next();
  } catch (err) {
    return unauthorized(res);
  }
};

module.exports = { authRequired, authOptional };
