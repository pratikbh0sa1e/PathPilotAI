/**
 * Central error handler middleware.
 * Catches all errors thrown/passed via next(err) in routes.
 */
const errorHandler = (err, req, res, next) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Log full error in development
  if (process.env.NODE_ENV !== "production") {
    console.error(`[ERROR] ${req.method} ${req.path} →`, err.message);
    if (err.stack) console.error(err.stack);
  }

  res.status(status).json({
    error: true,
    status,
    message,
    path: req.path,
    timestamp: new Date().toISOString(),
  });
};

/**
 * 404 handler — must be registered AFTER all routes.
 */
const notFound = (req, res) => {
  res.status(404).json({
    error: true,
    status: 404,
    message: `Route not found: ${req.method} ${req.path}`,
    timestamp: new Date().toISOString(),
  });
};

module.exports = { errorHandler, notFound };
