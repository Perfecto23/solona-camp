/**
 * 应用常量配置
 * 集中管理应用中使用的常量
 */

// 常见代币符号映射 - 用于显示代币符号
export const TOKEN_SYMBOL_MAP: Record<string, string> = {
  "So11111111111111111111111111111111111111112": "SOL",
  "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v": "USDC",
  "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB": "USDT",
  "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263": "BONK",
}

// 默认配置
export const DEFAULT_SLIPPAGE = 1 // 1%
export const MIN_SLIPPAGE = 0.1   // 0.1%
export const MAX_SLIPPAGE = 50    // 50%

// UI常量
export const ANIMATION_DURATION = {
  SHORT: 150,
  MEDIUM: 300,
  LONG: 500,
} as const

export const SKELETON_PROPS = {
  className: "h-4 bg-slate-700/50 rounded animate-pulse"
} as const

// 错误消息
export const ERROR_MESSAGES = {
  WALLET_NOT_CONNECTED: "请先连接钱包",
  INSUFFICIENT_BALANCE: "余额不足",
  INVALID_AMOUNT: "请输入有效金额",
  POOL_NOT_FOUND: "未找到流动性池",
  TRANSACTION_FAILED: "交易失败",
  NETWORK_ERROR: "网络错误",
} as const

// 成功消息
export const SUCCESS_MESSAGES = {
  TRANSACTION_CONFIRMED: "交易已确认",
  POOL_CREATED: "流动性池创建成功",
  LIQUIDITY_ADDED: "流动性添加成功",
  LIQUIDITY_REMOVED: "流动性移除成功",
  SWAP_COMPLETED: "交换完成",
} as const 