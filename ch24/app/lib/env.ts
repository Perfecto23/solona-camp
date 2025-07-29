/**
 * 环境变量配置
 * 提供类型安全的环境变量访问
 */

export const env = {
  // Solana配置
  SOLANA_NETWORK: process.env.NEXT_PUBLIC_SOLANA_NETWORK || 'devnet',
  SOLANA_RPC_URL: process.env.NEXT_PUBLIC_SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  
  // 应用配置
  APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'SolanaSwap',
  APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
  
  // 调试模式
  DEBUG_MODE: process.env.NEXT_PUBLIC_DEBUG_MODE === 'true',
  
  // 钱包配置
  ENABLE_AUTO_CONNECT: process.env.NEXT_PUBLIC_ENABLE_AUTO_CONNECT !== 'false',
  
  // 运行环境
  NODE_ENV: process.env.NODE_ENV || 'development',
  IS_PRODUCTION: process.env.NODE_ENV === 'production',
  IS_DEVELOPMENT: process.env.NODE_ENV === 'development',
} as const

// 类型定义
export type Environment = typeof env 