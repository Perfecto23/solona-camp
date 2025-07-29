import { env } from './env'

/**
 * 智能日志工具
 * 在生产环境中自动禁用console输出
 */
class Logger {
  private shouldLog(): boolean {
    return env.DEBUG_MODE && env.IS_DEVELOPMENT
  }

  log(...args: any[]): void {
    if (this.shouldLog()) {
      console.log(...args)
    }
  }

  info(...args: any[]): void {
    if (this.shouldLog()) {
      console.info(...args)
    }
  }

  warn(...args: any[]): void {
    if (this.shouldLog()) {
      console.warn(...args)
    }
  }

  error(...args: any[]): void {
    // 错误信息在生产环境中仍然输出，但可以通过监控系统捕获
    if (this.shouldLog() || env.IS_PRODUCTION) {
      console.error(...args)
    }
  }

  debug(...args: any[]): void {
    if (this.shouldLog()) {
      console.debug(...args)
    }
  }

  group(label: string): void {
    if (this.shouldLog()) {
      console.group(label)
    }
  }

  groupEnd(): void {
    if (this.shouldLog()) {
      console.groupEnd()
    }
  }

  time(label: string): void {
    if (this.shouldLog()) {
      console.time(label)
    }
  }

  timeEnd(label: string): void {
    if (this.shouldLog()) {
      console.timeEnd(label)
    }
  }
}

export const logger = new Logger()

// 便捷的导出方法
export const { log, info, warn, error, debug, group, groupEnd, time, timeEnd } = logger 