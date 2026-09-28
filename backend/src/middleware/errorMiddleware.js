export const notFound = (req, res, next) => {
  res.status(404).json({ success: false, message: `Not found: ${req.method} ${req.originalUrl}` });
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = (err, req, res, next) => {
  const statusCode =
    res.statusCode && res.statusCode !== 200
      ? res.statusCode
      : err.statusCode || 500;

  // Mongoose validation / duplicate-key niceties
  if (err?.name === 'ValidationError') {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: Object.values(err.errors).map((e) => e.message),
    });
  }
  if (err?.code === 11000) {
    return res.status(409).json({
      success: false,
      message: `Duplicate value: ${JSON.stringify(err.keyValue)}`,
    });
  }
  if (err?.name === 'CastError') {
    return res.status(400).json({ success: false, message: `Invalid id: ${err.value}` });
  }

  res.status(statusCode).json({
    success: false,
    message: err.message || 'Server error',
    // String error codes (e.g. EMAIL_NOT_VERIFIED) pass through so the
    // client can branch; numeric Mongo codes are handled above.
    ...(typeof err.code === 'string' ? { code: err.code } : {}),
    ...(process.env.NODE_ENV !== 'production' ? { stack: err.stack } : {}),
  });
};
