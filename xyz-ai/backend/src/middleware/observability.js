/**
 * Observability Middleware
 * Adds request IDs, latency tracking, and structured logging to every request.
 */

const crypto = require('crypto');

/**
 * Generate a unique request ID
 */
function generateRequestId() {
  return `req_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
}

/**
 * Structured logger - outputs JSON for each request
 */
class RequestLogger {
  constructor(requestId) {
    this.requestId = requestId;
    this.startTime = Date.now();
    this.events = [];
  }

  log(event, data = {}) {
    const entry = {
      timestamp: new Date().toISOString(),
      request_id: this.requestId,
      event,
      elapsed_ms: Date.now() - this.startTime,
      ...data
    };
    this.events.push(entry);
    console.log(JSON.stringify(entry));
  }

  getTrace() {
    return {
      request_id: this.requestId,
      start_time: new Date(this.startTime).toISOString(),
      total_duration_ms: Date.now() - this.startTime,
      events: this.events
    };
  }
}

/**
 * Middleware that attaches request ID and logger to every request
 */
function observabilityMiddleware(req, res, next) {
  const requestId = generateRequestId();
  const logger = new RequestLogger(requestId);

  req.requestId = requestId;
  req.logger = logger;
  req.startTime = Date.now();

  logger.log('request_start', {
    method: req.method,
    path: req.path,
    user_id: req.user?.id || null,
    role: req.user?.role || null
  });

  const originalEnd = res.end;
  res.end = function (...args) {
    const duration = Date.now() - req.startTime;
    logger.log('request_end', {
      status_code: res.statusCode,
      duration_ms: duration
    });
    res.setHeader('X-Request-Id', requestId);
    res.setHeader('X-Response-Time', `${duration}ms`);
    originalEnd.apply(this, args);
  };

  next();
}

module.exports = { observabilityMiddleware, RequestLogger, generateRequestId };
