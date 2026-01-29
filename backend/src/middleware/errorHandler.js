// Centralized error handler to keep JSON error responses consistent.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Internal server error';
  res.status(status).json({ errors: { body: [message] } });
};

module.exports = errorHandler;
