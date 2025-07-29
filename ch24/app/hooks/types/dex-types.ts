import { PublicKey } from '@solana/web3.js';

// 新的合约配置类型
export interface Config {
  authority: string;
  treasury: string;
  swapFeeRate: number;
  protocolFeeRate: number;
  isPaused: boolean;
  bump: number;
}

// 新的池子类型
export interface Pool {
  tokenXMint: string;
  tokenYMint: string;
  vaultX: string;
  vaultY: string;
  totalLpSupply: number;
  xRewardAmount: number;
  yRewardAmount: number;
  bump: number;
}

// 用户仓位类型
export interface UserPosition {
  pool: string;
  owner: string;
  lpAmount: number;
  lastXRewardAmount: number;
  lastYRewardAmount: number;
  pendingXRewardAmount: number;
  pendingYRewardAmount: number;
  bump: number;
}

// 向后兼容的类型别名
export interface GlobalConfig {
  swapFeeRate: number | null;
  protocolFeeRate: number | null;
  isPaused: boolean | null;
  admin: string | null;
  protocolFeeAccount: string | null;
}

export interface PoolInfo {
  address: string;
  tokenAMint: string;
  tokenBMint: string;
  tokenASymbol?: string;
  tokenBSymbol?: string;
  // 新增字段以支持新的合约结构
  tokenXMint?: string;
  tokenYMint?: string;
  tokenXSymbol?: string;
  tokenYSymbol?: string;
}

export interface PoolReserves {
  tokenAReserve: number;
  tokenBReserve: number;
  tokenAMint: string;
  tokenBMint: string;
  // 新增字段
  tokenXReserve?: number;
  tokenYReserve?: number;
  tokenXMint?: string;
  tokenYMint?: string;
}

export interface LpTokenEstimate {
  estimatedLpTokens: number;
  minLpTokensWithSlippage: number;
}

export interface OptimalLiquidityAmounts {
  tokenAAmount: number;
  tokenBAmount: number;
  isLimited: boolean;
  limitingToken: 'A' | 'B' | null;
  // 新增字段
  tokenXAmount?: number;
  tokenYAmount?: number;
  limitingToken2?: 'X' | 'Y' | null;
}

export interface MaxRemovableLiquidity {
  maxLpAmount: number;
  tokenAAmount: number;
  tokenBAmount: number;
  // 新增字段
  tokenXAmount?: number;
  tokenYAmount?: number;
}

export interface RemoveLiquidityOutput {
  tokenAAmount: number;
  tokenBAmount: number;
  tokenAAmountWithSlippage: number;
  tokenBAmountWithSlippage: number;
  // 新增字段
  tokenXAmount?: number;
  tokenYAmount?: number;
  tokenXAmountWithSlippage?: number;
  tokenYAmountWithSlippage?: number;
}

export interface SwapOutput {
  expectedOutput: number;
  minOutputWithSlippage: number;
  priceImpact: number;
}

export interface UnclaimedRewards {
  rewardA: number;
  rewardB: number;
  // 新增字段
  rewardX?: number;
  rewardY?: number;
}

export interface UserToken {
  mint: string;
  name: string;
  symbol: string;
  balance: number;
  decimals: number;
}

export interface DexOperations {
  loading: boolean;
  error: string | null;
  // 全局配置状态
  globalConfig: GlobalConfig | null;
  // 初始化配置 (新的方法名)
  initializeConfig: (swapFeeRate: number, protocolFeeRate: number, treasury?: PublicKey) => Promise<string>;
  // 批量更新配置
  updateConfigBasic: (swapFeeRate: number, protocolFeeRate: number, isPaused: boolean) => Promise<string>;
  // 更新权限
  updateAuthority: (newAuthority: PublicKey) => Promise<string>;
  // 更新treasury
  updateTreasury: (newTreasury: PublicKey) => Promise<string>;
  // 获取配置状态
  fetchGlobalConfig: () => Promise<void>;
  // 初始化流动性池（包含初始流动性）
  initializePool: (
    tokenX: PublicKey, 
    tokenY: PublicKey,
    initialAmountX: number,
    initialAmountY: number
  ) => Promise<string>;
  // 添加流动性
  addLiquidity: (
    poolAddress: PublicKey,
    amountX: number, 
    amountY: number, 
    minLpAmount: number
  ) => Promise<string>;
  // 移除流动性
  removeLiquidity: (
    poolAddress: PublicKey,
    lpAmount: number,
    minAmountX: number,
    minAmountY: number
  ) => Promise<string>;
  // 交换代币
  swap: (
    poolAddress: PublicKey,
    amountIn: number,
    minAmountOut: number,
    inputMint: PublicKey,
    outputMint: PublicKey
  ) => Promise<string>;
  // 领取奖励
  claimRewards: (poolAddress: PublicKey) => Promise<string>;
  // 获取池子地址
  getPoolAddress: (tokenX: PublicKey, tokenY: PublicKey) => PublicKey;
  // 获取用户仓位地址
  getUserPositionAddress: (pool: PublicKey, user: PublicKey) => PublicKey;
  // 获取vault地址
  getVaultAddress: (pool: PublicKey, tokenMint: PublicKey) => PublicKey;
  // 获取池子信息
  getPoolInfo: (poolAddress: PublicKey) => Promise<Pool | null>;
  // 获取所有流动性池
  getAllPools: () => Promise<Array<PoolInfo>>;
  // 估算 LP 代币数量
  estimateLpTokens: (poolAddress: PublicKey, amountX: number, amountY: number) => Promise<LpTokenEstimate | null>;
  // 获取池子储备量
  getPoolReserves: (poolAddress: PublicKey) => Promise<PoolReserves | null>;
  // 获取用户代币余额
  getUserTokenBalance: (tokenMint: PublicKey) => Promise<number>;
  // 获取用户 LP 代币余额
  getUserLpTokenBalance: (lpTokenMint: PublicKey) => Promise<number>;
  // 获取用户所有代币
  getUserTokens: () => Promise<Array<UserToken>>;
  // 计算最优添加流动性数量
  calculateOptimalLiquidityAmounts: (
    poolAddress: PublicKey,
    inputAmount: number,
    isTokenX: boolean,
    userTokenXBalance: number,
    userTokenYBalance: number
  ) => Promise<OptimalLiquidityAmounts | null>;
  // 计算可移除的最大流动性
  calculateMaxRemovableLiquidity: (
    poolAddress: PublicKey,
    userLpBalance: number
  ) => Promise<MaxRemovableLiquidity | null>;
  // 计算移除流动性的预期输出
  calculateRemoveLiquidityOutput: (
    poolAddress: PublicKey,
    lpAmount: number
  ) => Promise<RemoveLiquidityOutput | null>;
  // 计算交换输出
  calculateSwapOutput: (
    poolAddress: PublicKey,
    amountIn: number,
    inputMint: PublicKey,
    outputMint: PublicKey
  ) => Promise<SwapOutput | null>;
  // 获取用户未领取奖励
  getUserUnclaimedRewards: (poolAddress: PublicKey) => Promise<UnclaimedRewards | null>;
  // 获取用户仓位
  getUserPosition: (poolAddress: PublicKey, userAddress: PublicKey) => Promise<UserPosition | null>;

  // 向后兼容的旧方法
  /** @deprecated 使用 initializeConfig 代替 */
  initializeGlobalConfig?: (swapFeeRate: number, protocolFeeRate: number, protocolFeeAccount?: PublicKey) => Promise<string>;
  /** @deprecated 使用 updateConfigBasic 代替 */
  togglePause?: (isPaused: boolean) => Promise<string>;
  /** @deprecated 使用 updateConfigBasic 代替 */
  updateSwapFeeRate?: (newSwapFeeRate: number) => Promise<string>;
  /** @deprecated 使用 updateConfigBasic 代替 */
  updateProtocolFeeRate?: (newProtocolFeeRate: number) => Promise<string>;
  /** @deprecated 使用 updateTreasury 代替 */
  updateProtocolFeeAccount?: (newProtocolFeeAccount: PublicKey) => Promise<string>;
  /** @deprecated 使用 updateConfigBasic 代替 */
  updateFeeRates?: (newSwapFeeRate: number, newProtocolFeeRate: number) => Promise<string>;
  /** @deprecated 使用新的方法签名 */
  getUserAccountAddress?: (pool: PublicKey) => PublicKey;
} 