/**
 * 性能监控和优化工具
 */

import React from 'react'
import { logger } from './logger'

/**
 * 性能计时器
 */
export class PerformanceTimer {
  private startTime: number
  private label: string

  constructor(label: string) {
    this.label = label
    this.startTime = performance.now()
    logger.time(label)
  }

  end(): number {
    const endTime = performance.now()
    const duration = endTime - this.startTime
    logger.timeEnd(this.label)
    logger.debug(`${this.label} took ${duration.toFixed(2)}ms`)
    return duration
  }
}

/**
 * 测量异步函数执行时间
 */
export async function measureAsync<T>(
  label: string,
  fn: () => Promise<T>
): Promise<T> {
  const timer = new PerformanceTimer(label)
  try {
    const result = await fn()
    return result
  } finally {
    timer.end()
  }
}

/**
 * 测量同步函数执行时间
 */
export function measureSync<T>(
  label: string,
  fn: () => T
): T {
  const timer = new PerformanceTimer(label)
  try {
    const result = fn()
    return result
  } finally {
    timer.end()
  }
}

/**
 * 内存使用监控
 */
export function logMemoryUsage(label?: string): void {
  if ('memory' in performance) {
    const memory = (performance as any).memory
    logger.debug(`Memory usage ${label || ''}:`, {
      used: `${(memory.usedJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      total: `${(memory.totalJSHeapSize / 1024 / 1024).toFixed(2)} MB`,
      limit: `${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2)} MB`,
    })
  }
}

/**
 * 防抖Hook
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value)

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

/**
 * 节流Hook
 */
export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = React.useState<T>(value)
  const lastRun = React.useRef(Date.now())

  React.useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRun.current >= limit) {
        setThrottledValue(value)
        lastRun.current = Date.now()
      }
    }, limit - (Date.now() - lastRun.current))

    return () => {
      clearTimeout(handler)
    }
  }, [value, limit])

  return throttledValue
} 