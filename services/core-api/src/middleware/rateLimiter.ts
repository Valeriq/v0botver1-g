import rateLimit from "express-rate-limit"
import type { Request } from "express"

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Max 100 requests per window
  message: "Too many requests from this IP, please try again later",
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use workspace_id if available, otherwise IP
    return req.body?.workspace_id || req.query?.workspace_id || req.ip || "unknown"
  },
})

export const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 uploads per hour
  message: "Too many file uploads, please try again later",
  skipSuccessfulRequests: false,
  keyGenerator: (req: Request) => {
    return req.body?.workspace_id || req.ip || "unknown"
  },
})

export const campaignLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Max 20 campaigns per hour
  message: "Campaign creation limit reached, please try again later",
  keyGenerator: (req: Request) => {
    return req.body?.workspace_id || req.ip || "unknown"
  },
})

export const aiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // Max 30 AI requests per minute
  message: "AI request limit reached, please slow down",
  keyGenerator: (req: Request) => {
    return req.body?.workspace_id || req.ip || "unknown"
  },
})
