// 主要的 DEX hook
export { useDex, DEX_PROGRAM_ID, getPoolAddress } from './use-dex';

// 功能模块 hooks
export { useDexAdmin } from './dex/use-dex-admin';
export { useDexLiquidity } from './dex/use-dex-liquidity';
export { useDexSwap } from './dex/use-dex-swap';
export { useDexQuery } from './dex/use-dex-query';
export { useDexRewards } from './dex/use-dex-rewards';

// 类型定义
export type {
  DexOperations,
  GlobalConfig,
  PoolInfo,
  PoolReserves,
  LpTokenEstimate,
  OptimalLiquidityAmounts,
  MaxRemovableLiquidity,
  RemoveLiquidityOutput,
  SwapOutput,
  UnclaimedRewards,
} from './types/dex-types';

// 常量
export {
  DEX_PROGRAM_ID as PROGRAM_ID,
  GLOBAL_CONFIG_SEED,
  LIQUIDITY_POOL_SEED,
  USER_ACCOUNT_SEED,
  DEFAULT_SLIPPAGE,
  DEFAULT_TOKEN_DECIMALS,
  DEFAULT_SWAP_FEE_RATE,
} from './constants';

// 工具函数
export {
  findGlobalConfigAddress,
  findPoolAddress,
  findUserAccountAddress,
} from './utils/address-utils';

export {
  getTokenDecimals,
  convertToTokenAmount,
  ensureAssociatedTokenAccount,
  validateTokenAddress,
} from './utils/token-utils';

export {
  createProgram,
} from './utils/program-utils'; 