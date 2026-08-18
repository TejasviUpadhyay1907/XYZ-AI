/**
 * Input Guard Middleware
 * Protects against prompt injection and overly long inputs
 */

const MAX_MESSAGE_LENGTH = 1000;

/**
 * Sanitize and validate user input
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 * @param {Function} next - Next middleware function
 */
function inputGuard(req, res, next) {
  const { message } = req.body;

  // If no message, let the route validation handle it
  if (!message) {
    return next();
  }

  // Check message length
  if (message.length > MAX_MESSAGE_LENGTH) {
    return res.status(400).json({
      error: `Message too long. Maximum length is ${MAX_MESSAGE_LENGTH} characters.`
    });
  }

  // Optional: Detect potential prompt injection patterns
  // We'll use a simple list of patterns that are indicative of injection attempts
  const injectionPatterns = [
    /ignore\s+previous\s+instructions/i,
    /system\s*:/i,
    /you\s+are\s+now/i,
    /disregard\s+above/i,
    /forget\s+everything/i,
    /pretend\s+to\s+be/i,
    /roleplay\s+as/i,
    /simulate\s+i\s+am/i,
  ];

  const hasInjectionPattern = injectionPatterns.some(pattern => pattern.test(message));

  if (hasInjectionPattern) {
    // Log the attempt for monitoring
    console.warn(`Potential prompt injection attempt detected: ${message.substring(0, 100)}...`);

    // We can either block or sanitize. For now, we'll block to be safe.
    // In a more sophisticated system, we might remove the problematic parts or
    // treat the input as pure data without executing it as instructions.
    return res.status(400).json({
      error: 'Invalid input detected. Please rephrase your request.'
    });
  }

  // If we wanted to sanitize rather than block, we could remove the patterns here.
  // But for simplicity and security, we block.

  next();
}

module.exports = inputGuard;