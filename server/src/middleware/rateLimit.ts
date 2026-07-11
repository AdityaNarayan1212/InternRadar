import rateLimit from 'express-rate-limit';

// Applies to /auth/login and /auth/register: 10 attempts per 15 min per IP.
// Stops trivial brute-forcing without needing captchas or anything fancy.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many attempts. Please try again in 15 minutes.',
  },
});
