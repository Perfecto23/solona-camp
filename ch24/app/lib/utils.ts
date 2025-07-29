import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 格式化数字显示
 */
export function formatNumber(
  value: number | string,
  options: {
    decimals?: number
    compact?: boolean
    currency?: string
  } = {}
): string {
  const {
    decimals = 2,
    compact = false,
    currency
  } = options

  const num = typeof value === 'string' ? parseFloat(value) : value

  if (isNaN(num)) return '0'

  const formatter = new Intl.NumberFormat('zh-CN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
    notation: compact ? 'compact' : 'standard',
    style: currency ? 'currency' : 'decimal',
    currency: currency || 'CNY',
  })

  return formatter.format(num)
}

/**
 * 截断地址显示
 */
export function truncateAddress(address: string, start = 4, end = 4): string {
  if (address.length <= start + end) return address
  return `${address.slice(0, start)}...${address.slice(-end)}`
}

/**
 * 格式化代币金额
 */
export function formatTokenAmount(
  amount: number | string,
  decimals: number = 6,
  symbol?: string
): string {
  const formatted = formatNumber(amount, { decimals })
  return symbol ? `${formatted} ${symbol}` : formatted
}

/**
 * 安全的JSON解析
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json)
  } catch {
    return fallback
  }
}

/**
 * 防抖函数
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 * 节流函数
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let inThrottle = false
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => inThrottle = false, wait)
    }
  }
}

/**
 * 延迟函数
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * 获取代币符号的简化显示
 */
export function getTokenSymbolDisplay(address: string, symbolMap: Record<string, string>): string {
  return symbolMap[address] || truncateAddress(address, 4, 4)
}

/**
 * 计算百分比变化
 */
export function calculatePercentageChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0
  return ((newValue - oldValue) / oldValue) * 100
}

/**
 * 验证是否为有效的Solana地址
 */
export function isValidSolanaAddress(address: string): boolean {
  try {
    // 基本的长度和字符检查
    if (address.length < 32 || address.length > 44) return false
    // 检查是否只包含Base58字符
    const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/
    return base58Regex.test(address)
  } catch {
    return false
  }
}
