import type { Request, Response, NextFunction } from "express"
import { v4 as uuidv4 } from "uuid"

declare global {
  namespace Express {
    interface Request {
      requestId: string
    }
  }
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const requestId = (req.headers["x-request-id"] as string) || uuidv4()
  req.requestId = requestId

  const start = Date.now()

  res.on("finish", () => {
    const duration = Date.now() - start
    const log = {
      requestId,
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      duration,
      timestamp: new Date().toISOString(),
    }
    console.log(`[ai-orchestrator] ${JSON.stringify(log)}`)
  })

  res.setHeader("X-Request-ID", requestId)
  next()
}
