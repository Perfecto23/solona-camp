import { PublicKey } from '@solana/web3.js';

// 合约程序ID - 更新为最新的程序ID
export const DEX_PROGRAM_ID = new PublicKey('9FS4pbtwRhmQ5bVzdMdNXhrBbFjuaBiL9QMTbJupH83j');

// 种子常量 - 与合约中的种子保持一致
export const CONFIG_SEED = 'config';
export const POOL_SEED = 'pool';
export const USER_POSITION_SEED = 'user_position';
export const VAULT_SEED = 'vault';

// 默认值
export const DEFAULT_SLIPPAGE = 0.01; // 1%
export const DEFAULT_TOKEN_DECIMALS = 9;
export const DEFAULT_SWAP_FEE_RATE = 30; // 0.3% 