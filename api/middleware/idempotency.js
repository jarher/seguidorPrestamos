const idempotencyCache = new Map();

/**
 * Middleware to handle Idempotency-Key header.
 * Stores responses in memory for a limited time.
 */
export const idempotencyMiddleware = (req, res, next) => {
  const key = req.headers['idempotency-key'];

  if (!key) {
    return next();
  }

  if (idempotencyCache.has(key)) {
    const cachedResponse = idempotencyCache.get(key);
    return res.status(cachedResponse.status).json(cachedResponse.body);
  }

  // Intercept res.json to cache the response
  const originalJson = res.json;
  res.json = function (body) {
    idempotencyCache.set(key, {
      status: res.statusCode,
      body: body,
      timestamp: Date.now(),
    });

    // Cleanup old keys (basic TTL)
    const expiryMs = (process.env.IDEMPOTENCY_KEY_EXPIRY_HOURS || 24) * 60 * 60 * 1000;
    for (const [k, v] of idempotencyCache.entries()) {
      if (Date.now() - v.timestamp > expiryMs) {
        idempotencyCache.delete(k);
      }
    }

    return originalJson.call(this, body);
  };

  next();
};
