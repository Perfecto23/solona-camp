import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram } from '@solana/web3.js';
import { useState, useCallback, useMemo } from 'react';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from '@solana/spl-token';
import { UnclaimedRewards } from '../types/dex-types';
import { findGlobalConfigAddress, findUserAccountAddress } from '../utils/address-utils';
import { createProgram } from '../utils/program-utils';

export function useDexRewards() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取 Anchor 程序实例
  const program = useMemo(() => {
    return createProgram(connection, publicKey, signTransaction, signAllTransactions);
  }, [connection, publicKey, signTransaction, signAllTransactions]);

  // 获取用户账户地址
  const getUserAccountAddress = useCallback((pool: PublicKey): PublicKey => {
    if (!publicKey) throw new Error('钱包未连接');
    return findUserAccountAddress(publicKey);
  }, [publicKey]);

  // 获取用户未领取奖励
  const getUserUnclaimedRewards = useCallback(async (poolAddress: PublicKey): Promise<UnclaimedRewards | null> => {
    if (!publicKey || !program) {
      setError('钱包未连接或程序未初始化');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      // 获取池子信息
      const poolInfo = await (program.account as any).pool.fetch(poolAddress);
      
      // 新合约结构：从UserPosition账户获取用户的LP余额和奖励信息
      let userPosition = null;
      try {
        // 构建用户仓位的PDA地址 - 注意种子顺序：user_position, pool, user
        const userPositionAddress = PublicKey.findProgramAddressSync(
          [
            Buffer.from("user_position"),
            poolAddress.toBuffer(),
            publicKey.toBuffer()
          ],
          program.programId
        )[0];
        
        userPosition = await (program.account as any).userPosition.fetch(userPositionAddress);
        console.log('用户仓位信息:', userPosition);
      } catch (err) {
        console.log('用户仓位不存在，无LP余额和奖励');
        return {
          rewardA: 0,
          rewardB: 0,
        };
      }
      
      if (!userPosition || userPosition.lpAmount === 0) {
        console.log('用户LP余额为0，无奖励');
        return {
          rewardA: 0,
          rewardB: 0,
        };
      }
      
      // 实现与合约相同的奖励计算逻辑
      let rewardX: number;
      let rewardY: number;
      
      if (userPosition.lpAmount === 0) {
        // 如果用户没有LP，直接返回pending奖励
        rewardX = Number(userPosition.pendingXRewardAmount);
        rewardY = Number(userPosition.pendingYRewardAmount);
      } else {
        // 计算用户LP占比
        const userLpPercent = Number(userPosition.lpAmount) / Number(poolInfo.totalLpSupply);
        
        // 计算新增奖励 = (池子总奖励 - 用户上次领取时的池子奖励) * 用户LP占比
        const newRewardX = (Number(poolInfo.xRewardAmount) - Number(userPosition.lastXRewardAmount)) * userLpPercent;
        const newRewardY = (Number(poolInfo.yRewardAmount) - Number(userPosition.lastYRewardAmount)) * userLpPercent;
        
        // 总奖励 = 新奖励 + 用户待领取奖励
        rewardX = newRewardX + Number(userPosition.pendingXRewardAmount);
        rewardY = newRewardY + Number(userPosition.pendingYRewardAmount);
      }
      
      console.log('奖励计算详情:', {
        lpAmount: userPosition.lpAmount.toString(),
        totalLpSupply: poolInfo.totalLpSupply.toString(),
        userLpPercent: userPosition.lpAmount === 0 ? 0 : Number(userPosition.lpAmount) / Number(poolInfo.totalLpSupply),
        poolXReward: poolInfo.xRewardAmount.toString(),
        poolYReward: poolInfo.yRewardAmount.toString(),
        lastXReward: userPosition.lastXRewardAmount.toString(),
        lastYReward: userPosition.lastYRewardAmount.toString(),
        pendingXReward: userPosition.pendingXRewardAmount.toString(),
        pendingYReward: userPosition.pendingYRewardAmount.toString(),
        calculatedRewardX: rewardX,
        calculatedRewardY: rewardY
      });
      
      // 转换为代币单位（假设是9位小数）
      const finalRewardX = rewardX / 1_000_000_000;
      const finalRewardY = rewardY / 1_000_000_000;
      
      return {
        rewardA: finalRewardX,
        rewardB: finalRewardY,
      };
      
    } catch (err) {
      console.error('获取用户未领取奖励失败:', err);
      setError(`获取用户未领取奖励失败: ${err instanceof Error ? err.message : String(err)}`);
      return null;
    } finally {
      setLoading(false);
    }
  }, [publicKey, program, connection]);

  // 领取奖励
  const claimRewards = useCallback(async (poolAddress: PublicKey): Promise<string> => {
    if (!publicKey || !program) {
      setError('钱包未连接或程序未初始化');
      return '';
    }

    try {
      setLoading(true);
      setError(null);

      // 获取池子信息
      const poolInfo = await (program.account as any).pool.fetch(poolAddress);
      const configAddress = findGlobalConfigAddress();
      
            // 构建用户仓位的PDA地址 - 注意种子顺序：user_position, pool, user
      const userPositionAddress = PublicKey.findProgramAddressSync(
        [
          Buffer.from("user_position"),
          poolAddress.toBuffer(),
          publicKey.toBuffer()
        ],
        program.programId
      )[0];
      
      console.log('领取奖励 - PDA地址信息:', {
        poolAddress: poolAddress.toString(),
        userPositionAddress: userPositionAddress.toString(),
        programId: program.programId.toString()
      });
      
      // 验证用户仓位账户是否存在
      try {
        const userPositionInfo = await (program.account as any).userPosition.fetch(userPositionAddress);
        console.log('用户仓位验证成功:', userPositionInfo.lpAmount.toString());
      } catch (error) {
        console.error('用户仓位验证失败:', error);
        throw new Error(`用户仓位账户不存在: ${userPositionAddress.toString()}`);
      }
      
      // 获取代币账户地址
      const tokenXMint = poolInfo.tokenXMint;
      const tokenYMint = poolInfo.tokenYMint;
      
      // 获取用户的代币账户地址
      const userTokenXAccount = await getAssociatedTokenAddress(tokenXMint, publicKey);
      const userTokenYAccount = await getAssociatedTokenAddress(tokenYMint, publicKey);
      
      console.log('领取奖励 - 账户地址信息:', {
        tokenXMint: tokenXMint.toString(),
        tokenYMint: tokenYMint.toString(),
        userTokenXAccount: userTokenXAccount.toString(),
        userTokenYAccount: userTokenYAccount.toString(),
        vaultX: poolInfo.vaultX.toString(),
        vaultY: poolInfo.vaultY.toString()
      });
      
      // 调用程序方法领取奖励 - 使用驼峰命名法（Anchor客户端转换）
      const tx = await program.methods
        .claimRewards()
        .accounts({
          user: publicKey,
          pool: poolAddress,
          userPosition: userPositionAddress,
          userTokenX: userTokenXAccount,
          userTokenY: userTokenYAccount,
          poolTokenX: poolInfo.vaultX,
          poolTokenY: poolInfo.vaultY,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("✅ 奖励领取成功, 交易ID:", tx);
      return tx;
    } catch (err) {
      console.error('领取奖励失败:', err);
      setError(`领取奖励失败: ${err instanceof Error ? err.message : String(err)}`);
      return '';
    } finally {
      setLoading(false);
    }
  }, [publicKey, program]);

  return {
    loading,
    error,
    getUserAccountAddress,
    getUserUnclaimedRewards,
    claimRewards,
  };
} 