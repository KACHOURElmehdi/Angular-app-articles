const { validationResult } = require('express-validator');

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (errors.isEmpty()) return next();

  const messages = errors.array().map(err => `${err.msg}${err.path ? ` (${err.path})` : ''}`);
  return res.status(422).json({ errors: { body: messages } });
};

module.exports = { validateRequest };
