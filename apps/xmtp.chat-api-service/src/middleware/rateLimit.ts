import { rateLimit } from "express-rate-limit";

// limit API to 300 requests per 5 minutes
export const rateLimitMiddleware = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  limit: 300,
  legacyHeaders: false,
  standardHeaders: "draft-8",
});
