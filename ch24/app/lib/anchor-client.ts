"use client";

import * as anchor from '@coral-xyz/anchor';
import { PublicKey } from '@solana/web3.js';
import { useAnchorWallet, useConnection } from '@solana/wallet-adapter-react';
import { useEffect, useState } from 'react';

// 合约程序ID - 更新为最新的程序ID
export const DEX_PROGRAM_ID = new PublicKey('5u965qT7XqQzhkMH277A78wUg4BPbyxcotU2Z9TiGPXU');

// 简化的连接Hook
export function useDexConnection() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [provider, setProvider] = useState<anchor.AnchorProvider | null>(null);

  useEffect(() => {
    if (!wallet || !connection) return;

    // 创建Provider
    const newProvider = new anchor.AnchorProvider(
      connection,
      wallet,
      { preflightCommitment: 'processed' }
    );

    setProvider(newProvider);
  }, [connection, wallet]);

  return { 
    connection, 
    wallet, 
    provider,
    programId: DEX_PROGRAM_ID
  };
}

// 创建获取池子地址的函数 - 使用正确的种子
export const findPoolAddress = async (
  tokenA: PublicKey,
  tokenB: PublicKey
): Promise<PublicKey> => {
  // 确保代币按字典序排序
  const [token1, token2] = tokenA.toBase58() < tokenB.toBase58() 
    ? [tokenA, tokenB] 
    : [tokenB, tokenA];

  const [poolAddress] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('liquidity-pool'),
      token1.toBuffer(),
      token2.toBuffer(),
    ],
    DEX_PROGRAM_ID
  );
  return poolAddress;
};

// 创建获取用户账户地址的函数 - 只需要用户公钥
export const findUserAccountAddress = async (
  user: PublicKey
): Promise<PublicKey> => {
  const [userAccountAddress] = PublicKey.findProgramAddressSync(
    [
      Buffer.from('user-account'),
      user.toBuffer(),
    ],
    DEX_PROGRAM_ID
  );
  return userAccountAddress;
};

// 创建获取全局配置地址的函数
export const findGlobalConfigAddress = async (): Promise<PublicKey> => {
  const [globalConfigAddress] = PublicKey.findProgramAddressSync(
    [Buffer.from('global-config')],
    DEX_PROGRAM_ID
  );
  return globalConfigAddress;
}; 