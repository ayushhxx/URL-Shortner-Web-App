export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export interface LogEntry {
  timestamp: string
  level: LogLevel
  message: string
  context?: Record<string, any>
  userId?: string
  sessionId?: string
  component?: string
  action?: string
  metadata?: Record<string, any>
}

class Logger {
  private logs: LogEntry[] = []
  private sessionId: string
  private maxLogs = 1000

  constructor() {
    this.sessionId = this.generateSessionId()
    this.initializeLogger()
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  private initializeLogger(): void {
    // Load existing logs from localStorage if available
    try {
      const storedLogs = localStorage.getItem("app_logs")
      if (storedLogs) {
        this.logs = JSON.parse(storedLogs).slice(-this.maxLogs)
      }
    } catch (error) {
      // Ignore localStorage errors
    }

    this.info("Logger initialized", { sessionId: this.sessionId })
  }

  private createLogEntry(
    level: LogLevel,
    message: string,
    context?: Record<string, any>,
    component?: string,
    action?: string,
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      context,
      sessionId: this.sessionId,
      component,
      action,
      metadata: {
        userAgent: typeof window !== "undefined" ? window.navigator.userAgent : "server",
        url: typeof window !== "undefined" ? window.location.href : "unknown",
      },
    }
  }

  private writeLog(entry: LogEntry): void {
    this.logs.push(entry)

    // Keep only the most recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Persist to localStorage
    try {
      localStorage.setItem("app_logs", JSON.stringify(this.logs))
    } catch (error) {
      // Handle localStorage quota exceeded
    }

    // Output to console for development (can be disabled in production)
    if (process.env.NODE_ENV === "development") {
      const levelNames = ["DEBUG", "INFO", "WARN", "ERROR"]
      const levelName = levelNames[entry.level]
      const contextStr = entry.context ? JSON.stringify(entry.context) : ""

      console.log(`[${entry.timestamp}] [${levelName}] [${entry.component || "App"}] ${entry.message}`, contextStr)
    }
  }

  debug(message: string, context?: Record<string, any>, component?: string, action?: string): void {
    const entry = this.createLogEntry(LogLevel.DEBUG, message, context, component, action)
    this.writeLog(entry)
  }

  info(message: string, context?: Record<string, any>, component?: string, action?: string): void {
    const entry = this.createLogEntry(LogLevel.INFO, message, context, component, action)
    this.writeLog(entry)
  }

  warn(message: string, context?: Record<string, any>, component?: string, action?: string): void {
    const entry = this.createLogEntry(LogLevel.WARN, message, context, component, action)
    this.writeLog(entry)
  }

  error(message: string, context?: Record<string, any>, component?: string, action?: string): void {
    const entry = this.createLogEntry(LogLevel.ERROR, message, context, component, action)
    this.writeLog(entry)
  }

  // Specialized logging methods for URL shortener functionality
  urlCreated(originalUrl: string, shortUrl: string, shortcode: string, validityMinutes: number): void {
    this.info(
      "URL shortened successfully",
      {
        originalUrl,
        shortUrl,
        shortcode,
        validityMinutes,
        action: "url_creation",
      },
      "URLShortener",
      "create",
    )
  }

  urlValidationFailed(url: string, error: string): void {
    this.warn(
      "URL validation failed",
      {
        url,
        error,
        action: "validation_failure",
      },
      "URLShortener",
      "validate",
    )
  }

  urlClicked(shortcode: string, originalUrl: string, source?: string): void {
    this.info(
      "Short URL clicked",
      {
        shortcode,
        originalUrl,
        source,
        action: "url_click",
      },
      "RedirectHandler",
      "redirect",
    )
  }

  urlExpired(shortcode: string): void {
    this.warn(
      "Attempted to access expired URL",
      {
        shortcode,
        action: "expired_access",
      },
      "RedirectHandler",
      "redirect",
    )
  }

  formSubmission(entryCount: number, validEntries: number, invalidEntries: number): void {
    this.info(
      "Form submission processed",
      {
        entryCount,
        validEntries,
        invalidEntries,
        action: "form_submission",
      },
      "URLShortenerForm",
      "submit",
    )
  }

  statisticsViewed(totalUrls: number, totalClicks: number): void {
    this.info(
      "Statistics page viewed",
      {
        totalUrls,
        totalClicks,
        action: "statistics_view",
      },
      "StatisticsPage",
      "view",
    )
  }

  // Get logs for debugging or analytics
  getLogs(level?: LogLevel, component?: string, limit?: number): LogEntry[] {
    let filteredLogs = this.logs

    if (level !== undefined) {
      filteredLogs = filteredLogs.filter((log) => log.level >= level)
    }

    if (component) {
      filteredLogs = filteredLogs.filter((log) => log.component === component)
    }

    if (limit) {
      filteredLogs = filteredLogs.slice(-limit)
    }

    return filteredLogs
  }

  // Export logs for analysis
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }

  // Clear logs
  clearLogs(): void {
    this.logs = []
    try {
      localStorage.removeItem("app_logs")
    } catch (error) {
      // Ignore localStorage errors
    }
    this.info("Logs cleared", {}, "Logger", "clear")
  }
}

// Create singleton instance
const logger = new Logger()

export default logger
