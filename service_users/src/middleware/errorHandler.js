const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const code = err.code || 'INTERNAL_ERROR';

  req.log.error({ err, statusCode, code }, message);

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
    },
  });
};

module.exports = { errorHandler };

