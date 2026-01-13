import type { Request, Response, NextFunction } from "express"
import { ZodError } from "zod"

export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction) {
  const requestId = (req as any).requestId || "unknown"

  console.error("[core-api] [error]", {
    requestId,
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString(),
  })

  if (err instanceof ZodError) {
    return res.status(400).json({
      error: "Validation error",
      details: err.errors,
      requestId,
    })
  }

  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
    requestId,
  })
}
