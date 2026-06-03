type LogLevel = "INFO" | "WARN" | "ERROR" | "AUDIT";

interface LogPayload {
  level: LogLevel;
  message: string;
  timestamp: string;
  error?: string;
  stack?: string;
  metadata?: Record<string, any>;
}

class ResilientLogger {
  private isProduction = process.env.NODE_ENV === "production";

  private formatLog(level: LogLevel, message: string, error?: Error, metadata?: Record<string, any>): LogPayload {
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      error: error?.message,
      stack: error?.stack,
      metadata
    };
  }

  private dispatchLog(payload: LogPayload) {
    if (this.isProduction) {
      // In production, we send error logs to the Spring Boot backend analytics/audit-log endpoint
      if (payload.level === "ERROR" || payload.level === "AUDIT") {
        fetch("/api/v1/monitoring/logs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        }).catch(() => {
          // Fallback silently if logging backend is unreachable
        });
      }
    }

    // Dev formatted printing
    const styles = {
      INFO: "color: #38bdf8; font-weight: bold;", // Cyan
      WARN: "color: #f59e0b; font-weight: bold;", // Amber
      ERROR: "color: #ef4444; font-weight: bold;", // Red
      AUDIT: "color: #a855f7; font-weight: bold;"  // Purple
    };

    console.log(
      `%c[${payload.level}] [${payload.timestamp}] %c${payload.message}`,
      styles[payload.level],
      "color: inherit;",
      payload.metadata || "",
      payload.error ? `\nError: ${payload.error}\nStack: ${payload.stack}` : ""
    );
  }

  public info(message: string, metadata?: Record<string, any>) {
    this.dispatchLog(this.formatLog("INFO", message, undefined, metadata));
  }

  public warn(message: string, metadata?: Record<string, any>) {
    this.dispatchLog(this.formatLog("WARN", message, undefined, metadata));
  }

  public error(message: string, error?: Error | unknown, metadata?: Record<string, any>) {
    const errObj = error instanceof Error ? error : new Error(String(error));
    this.dispatchLog(this.formatLog("ERROR", message, errObj, metadata));
  }

  public audit(action: string, target: string, actor = "system", metadata?: Record<string, any>) {
    this.dispatchLog(
      this.formatLog("AUDIT", `Audit Event: ${action} on ${target} by ${actor}`, undefined, {
        action,
        target,
        actor,
        ...metadata
      })
    );
  }
}

export const logger = new ResilientLogger();
export default logger;
