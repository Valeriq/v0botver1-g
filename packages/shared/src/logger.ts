// Shared logging utilities

export interface LogContext {
  requestId?: string
  jobId?: string
  workspaceId?: string
  userId?: string
  campaignId?: string
  [key: string]: any
}

export class Logger {
  constructor(private service: string) {}

  private formatLog(level: string, message: string, context?: LogContext) {
    return JSON.stringify({
      service: this.service,
      level,
      message,
      ...context,
      timestamp: new Date().toISOString(),
    })
  }

  info(message: string, context?: LogContext) {
    console.log(this.formatLog("info", message, context))
  }

  warn(message: string, context?: LogContext) {
    console.warn(this.formatLog("warn", message, context))
  }

  error(message: string, error?: Error, context?: LogContext) {
    console.error(
      this.formatLog("error", message, {
        ...context,
        error: error?.message,
        stack: error?.stack,
      }),
    )
  }

  debug(message: string, context?: LogContext) {
    if (process.env.NODE_ENV === "development") {
      console.debug(this.formatLog("debug", message, context))
    }
  }
}
