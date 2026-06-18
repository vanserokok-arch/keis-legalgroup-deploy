const notFoundHandler = (req, res, next) => {
  res.status(404).json({ ok: false, error: 'Not Found' });
};

const errorHandler = (err, req, res, next) => {
  console.error(err);
  const status = err.status || 500;
  const message = err.message || 'Internal Server Error';
  res.status(status).json({ ok: false, error: message });
};

module.exports = {
  notFoundHandler,
  errorHandler,
};
