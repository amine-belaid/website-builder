 const Sentry = require('@sentry/node');

module.exports = (err, req, res, next) => {
Sentry.captureException(err);   // ← sends to Sentry dashboard
    console.error(err.stack);
    res.status(err.status || 500).json({
      error: err.message || 'Internal server error'
    });

  console.error(err.stack);

  // Sequelize validation errors
  if (err.name === 'SequelizeValidationError') {
    return res.status(400).json({
      error: err.errors.map(e => e.message).join(', ')
    });
  }

  // Multer file size error
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'File too large. Max 5 MB.' });
  }

  // Default 500
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
};