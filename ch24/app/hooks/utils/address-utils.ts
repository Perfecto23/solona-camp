import { PublicKey } from '@solana/web3.js';
import { DEX_PROGRAM_ID, CONFIG_SEED, POOL_SEED, USER_POSITION_SEED, VAULT_SEED } from '../constants';

// 查找配置地址 (新的方法名)
export const findConfigAddress = (): PublicKey => {
  const [config] = PublicKey.findProgramAddressSync(
    [Buffer.from(CONFIG_SEED)],
    DEX_PROGRAM_ID
  );
  return config;
};

// 查找流动性池地址 - 确保代币按字典序排序
export const findPoolAddress = (tokenX: PublicKey, tokenY: PublicKey): PublicKey => {
  // 确保令牌按字典序排序
  const [token1, token2] = tokenX.toBase58() < tokenY.toBase58() 
    ? [tokenX, tokenY] 
    : [tokenY, tokenX];

  const [pool] = PublicKey.findProgramAddressSync(
    [Buffer.from(POOL_SEED), token1.toBuffer(), token2.toBuffer()],
    DEX_PROGRAM_ID
  );
  return pool;
};

// 查找用户仓位地址 (新的方法)
export const findUserPositionAddress = (pool: PublicKey, user: PublicKey): PublicKey => {
  const [userPosition] = PublicKey.findProgramAddressSync(
    [Buffer.from(USER_POSITION_SEED), pool.toBuffer(), user.toBuffer()],
    DEX_PROGRAM_ID
  );
  return userPosition;
};

// 查找vault地址 (新的方法)
export const findVaultAddress = (pool: PublicKey, tokenMint: PublicKey): PublicKey => {
  const [vault] = PublicKey.findProgramAddressSync(
    [Buffer.from(VAULT_SEED), pool.toBuffer(), tokenMint.toBuffer()],
    DEX_PROGRAM_ID
  );
  return vault;
};

// 向后兼容的方法
/** @deprecated 使用 findConfigAddress 代替 */
export const findGlobalConfigAddress = (): PublicKey => {
  return findConfigAddress();
};

/** @deprecated 使用 findUserPositionAddress 代替 */
export const findUserAccountAddress = (user: PublicKey): PublicKey => {
  // 这个方法在新合约中不再适用，因为用户仓位需要池子地址
  // 返回一个占位符地址
  return PublicKey.default;
}; 