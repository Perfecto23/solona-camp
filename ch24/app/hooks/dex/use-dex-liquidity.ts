import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Keypair, SYSVAR_RENT_PUBKEY, Transaction } from '@solana/web3.js';
import { useState, useCallback, useMemo } from 'react';
import * as anchor from '@coral-xyz/anchor';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import { 
  LpTokenEstimate, 
  OptimalLiquidityAmounts, 
  MaxRemovableLiquidity, 
  RemoveLiquidityOutput,
  PoolReserves 
} from '../types/dex-types';
import { findGlobalConfigAddress, findPoolAddress, findUserPositionAddress, findVaultAddress } from '../utils/address-utils';
import { createProgram } from '../utils/program-utils';
import { getTokenDecimals, convertToTokenAmount, ensureAssociatedTokenAccount, validateTokenAddress } from '../utils/token-utils';

export function useDexLiquidity() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 获取 Anchor 程序实例
  const program = useMemo(() => {
    return createProgram(connection, publicKey, signTransaction, signAllTransactions);
  }, [connection, publicKey, signTransaction, signAllTransactions]);

  // 初始化流动性池（包含初始流动性）
  const initializePool = useCallback(async (
    tokenA: PublicKey,
    tokenB: PublicKey,
    amountA: number,
    amountB: number
  ): Promise<string> => {
    if (!publicKey || !program) {
      setError('钱包未连接或程序未初始化');
      return '';
    }

    try {
      setLoading(true);
      setError(null);

      // 验证初始流动性数量
      if (amountA <= 0 || amountB <= 0) {
        throw new Error('初始流动性数量必须大于0');
      }

      // 验证代币地址是否是有效的 SPL Token
      await validateTokenAddress(connection, tokenA, '代币 A');
      await validateTokenAddress(connection, tokenB, '代币 B');
      console.log('✅ 代币验证通过');

      // 确保代币按字典序排序
      const [sortedTokenA, sortedTokenB] = tokenA.toBase58() < tokenB.toBase58() 
        ? [tokenA, tokenB] 
        : [tokenB, tokenA];
      
      // 如果代币顺序被调整，也需要调整数量
      const [sortedAmountA, sortedAmountB] = tokenA.toBase58() < tokenB.toBase58()
        ? [amountA, amountB]
        : [amountB, amountA];

      // 获取代币精度
      const tokenADecimals = await getTokenDecimals(connection, sortedTokenA);
      const tokenBDecimals = await getTokenDecimals(connection, sortedTokenB);

      console.log('代币精度信息:', {
        tokenA: tokenADecimals,
        tokenB: tokenBDecimals
      });

      // 将用户输入转换为代币的最小单位
      const tokenAAmount = convertToTokenAmount(sortedAmountA, tokenADecimals);
      const tokenBAmount = convertToTokenAmount(sortedAmountB, tokenBDecimals);

      // 获取全局配置地址
      const globalConfig = findGlobalConfigAddress();
      
      // 获取流动性池地址
      const poolAddress = findPoolAddress(sortedTokenA, sortedTokenB);
      
      // 获取用户位置地址
      const userPositionAddress = findUserPositionAddress(poolAddress, publicKey);
      
      // 获取池的vault地址
      const vaultXAddress = findVaultAddress(poolAddress, sortedTokenA);
      const vaultYAddress = findVaultAddress(poolAddress, sortedTokenB);

      // 确保用户的关联代币账户存在
      const userTokenAAccount = await ensureAssociatedTokenAccount(connection, sortedTokenA, publicKey, '代币 A', signTransaction);
      const userTokenBAccount = await ensureAssociatedTokenAccount(connection, sortedTokenB, publicKey, '代币 B', signTransaction);

      console.log('准备初始化池子:', {
        tokenA: sortedTokenA.toString(),
        tokenB: sortedTokenB.toString(),
        poolAddress: poolAddress.toString(),
        userPosition: userPositionAddress.toString(),
        vaultX: vaultXAddress.toString(),
        vaultY: vaultYAddress.toString(),
        amountA: tokenAAmount.toString(),
        amountB: tokenBAmount.toString()
      });

      // 调用程序方法（只传递2个参数，与Rust函数匹配）
      const tx = await program.methods
        .initializePool(
          tokenAAmount,
          tokenBAmount
        )
        .accounts({
          payer: publicKey,
          config: globalConfig,
          pool: poolAddress,
          tokenXMint: sortedTokenA,
          tokenYMint: sortedTokenB,
          vaultX: vaultXAddress,
          vaultY: vaultYAddress,
          userTokenX: userTokenAAccount,
          userTokenY: userTokenBAccount,
          userPosition: userPositionAddress,
          systemProgram: SystemProgram.programId,
          tokenProgram: TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log("✅ 流动性池初始化成功, 交易ID:", tx);
      console.log("池地址:", poolAddress.toString());
      console.log("初始流动性:", {
        tokenA: `${sortedAmountA} (${tokenAAmount.toString()} 最小单位)`,
        tokenB: `${sortedAmountB} (${tokenBAmount.toString()} 最小单位)`
      });
      return tx;
    } catch (err) {
      console.error('初始化流动性池失败:', err);
      setError(`初始化流动性池失败: ${err instanceof Error ? err.message : String(err)}`);
      return '';
    } finally {
      setLoading(false);
    }
  }, [publicKey, program, connection, signTransaction]);

  // 添加流动性（匹配Rust合约 liquidity.rs）
  const addLiquidity = useCallback(async (
    poolAddress: PublicKey,
    amountX: number,
    amountY: number,
    minLpAmount: number
  ): Promise<string> => {
    if (!publicKey || !program) {
      setError('钱包未连接或程序未初始化');
      return '';
    }

    try {
      setLoading(true);
      setError(null);

      // 获取池子信息
      const poolInfo = await (program.account as any).pool.fetch(poolAddress);
      
      const tokenXMint = poolInfo.tokenXMint;
      const tokenYMint = poolInfo.tokenYMint;
      const vaultX = poolInfo.vaultX;
      const vaultY = poolInfo.vaultY;

      // 获取代币精度
      const tokenXDecimals = await getTokenDecimals(connection, tokenXMint);
      const tokenYDecimals = await getTokenDecimals(connection, tokenYMint);

      console.log('添加流动性 - 代币信息:', {
        tokenX: tokenXMint.toString(),
        tokenY: tokenYMint.toString(),
        decimalsX: tokenXDecimals,
        decimalsY: tokenYDecimals,
        inputAmountX: amountX,
        inputAmountY: amountY
      });

      // 将用户输入转换为代币的最小单位
      const tokenXAmount = convertToTokenAmount(amountX, tokenXDecimals);
      const tokenYAmount = convertToTokenAmount(amountY, tokenYDecimals);
      const minLpTokenAmount = new anchor.BN(Math.floor(minLpAmount * 1_000_000)); // 假设LP代币6位精度

      // 获取全局配置地址
      const globalConfig = findGlobalConfigAddress();
      
      // 获取用户位置地址
      const userPositionAddress = findUserPositionAddress(poolAddress, publicKey);

      // 确保用户的关联代币账户存在
      const userTokenXAccount = await ensureAssociatedTokenAccount(connection, tokenXMint, publicKey, '代币 X', signTransaction);
      const userTokenYAccount = await ensureAssociatedTokenAccount(connection, tokenYMint, publicKey, '代币 Y', signTransaction);

      console.log('添加流动性 - 账户地址:', {
        user: publicKey.toString(),
        config: globalConfig.toString(),
        pool: poolAddress.toString(),
        tokenXMint: tokenXMint.toString(),
        tokenYMint: tokenYMint.toString(),
        userTokenX: userTokenXAccount.toString(),
        userTokenY: userTokenYAccount.toString(),
        poolTokenX: vaultX.toString(),
        poolTokenY: vaultY.toString(),
        userPosition: userPositionAddress.toString()
      });

      // 调用程序方法添加流动性（匹配Rust合约签名）
      const tx = await program.methods
        .addLiquidity(
          tokenXAmount,
          tokenYAmount,
          minLpTokenAmount
        )
        .accounts({
          user: publicKey,
          config: globalConfig,
          pool: poolAddress,
          tokenXMint: tokenXMint,
          tokenYMint: tokenYMint,
          userTokenX: userTokenXAccount,
          userTokenY: userTokenYAccount,
          poolTokenX: vaultX,
          poolTokenY: vaultY,
          userPosition: userPositionAddress,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("✅ 添加流动性成功, 交易ID:", tx);
      console.log("添加的流动性:", {
        tokenX: `${amountX} (${tokenXAmount.toString()} 最小单位)`,
        tokenY: `${amountY} (${tokenYAmount.toString()} 最小单位)`,
        最小LP: minLpTokenAmount.toString()
      });
      return tx;
    } catch (err) {
      console.error('添加流动性失败:', err);
      setError(`添加流动性失败: ${err instanceof Error ? err.message : String(err)}`);
      return '';
    } finally {
      setLoading(false);
    }
  }, [publicKey, program, connection, signTransaction]);

  // 移除流动性（匹配Rust合约 liquidity.rs）
  const removeLiquidity = useCallback(async (
    poolAddress: PublicKey,
    lpAmount: number,
    minAmountX: number,
    minAmountY: number
  ): Promise<string> => {
    if (!publicKey || !program) {
      setError('钱包未连接或程序未初始化');
      return '';
    }

    try {
      setLoading(true);
      setError(null);

      // 获取池子信息（使用正确的账户名称）
      const poolInfo = await (program.account as any).pool.fetch(poolAddress);
      
      const tokenXMint = poolInfo.tokenXMint;
      const tokenYMint = poolInfo.tokenYMint;
      
      // 使用地址查找函数计算正确的 vault 地址
      const vaultX = findVaultAddress(poolAddress, tokenXMint);
      const vaultY = findVaultAddress(poolAddress, tokenYMint);

      // 获取代币精度
      const tokenXDecimals = await getTokenDecimals(connection, tokenXMint);
      const tokenYDecimals = await getTokenDecimals(connection, tokenYMint);

      console.log('移除流动性 - 代币信息:', {
        tokenX: tokenXMint.toString(),
        tokenY: tokenYMint.toString(),
        decimalsX: tokenXDecimals,
        decimalsY: tokenYDecimals,
        inputLpAmount: lpAmount,
        inputMinAmountX: minAmountX,
        inputMinAmountY: minAmountY
      });

      // 将用户输入转换为代币的最小单位
      const lpTokenAmount = new anchor.BN(Math.floor(lpAmount * 1_000_000)); // 假设LP代币6位精度
      const minTokenXAmount = convertToTokenAmount(minAmountX, tokenXDecimals);
      const minTokenYAmount = convertToTokenAmount(minAmountY, tokenYDecimals);

      // 获取全局配置地址
      const globalConfig = findGlobalConfigAddress();
      
      // 获取用户位置地址
      const userPositionAddress = findUserPositionAddress(poolAddress, publicKey);

      // 确保用户的关联代币账户存在
      const userTokenXAccount = await ensureAssociatedTokenAccount(connection, tokenXMint, publicKey, '代币 X', signTransaction);
      const userTokenYAccount = await ensureAssociatedTokenAccount(connection, tokenYMint, publicKey, '代币 Y', signTransaction);

      console.log('移除流动性 - 账户地址:', {
        user: publicKey.toString(),
        config: globalConfig.toString(),
        pool: poolAddress.toString(),
        tokenXMint: tokenXMint.toString(),
        tokenYMint: tokenYMint.toString(),
        userTokenX: userTokenXAccount.toString(),
        userTokenY: userTokenYAccount.toString(),
        poolTokenX: vaultX.toString(),
        poolTokenY: vaultY.toString(),
        userPosition: userPositionAddress.toString()
      });

      // 调用程序方法移除流动性（匹配Rust合约签名）
      const tx = await program.methods
        .removeLiquidity(
          lpTokenAmount,
          minTokenXAmount,
          minTokenYAmount
        )
        .accounts({
          user: publicKey,
          config: globalConfig,
          pool: poolAddress,
          tokenXMint: tokenXMint,
          tokenYMint: tokenYMint,
          userTokenX: userTokenXAccount,
          userTokenY: userTokenYAccount,
          poolTokenX: vaultX,
          poolTokenY: vaultY,
          userPosition: userPositionAddress,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log("✅ 移除流动性成功, 交易ID:", tx);
      console.log("移除的流动性:", {
        lpAmount: `${lpAmount} (${lpTokenAmount.toString()} 最小单位)`,
        minTokenX: `${minAmountX} (${minTokenXAmount.toString()} 最小单位)`,
        minTokenY: `${minAmountY} (${minTokenYAmount.toString()} 最小单位)`
      });
      return tx;
    } catch (err) {
      console.error('移除流动性失败:', err);
      setError(`移除流动性失败: ${err instanceof Error ? err.message : String(err)}`);
      return '';
    } finally {
      setLoading(false);
    }
  }, [publicKey, program, connection, signTransaction]);

  // 估算 LP 代币数量
  const estimateLpTokens = useCallback(async (
    poolAddress: PublicKey,
    amountA: number,
    amountB: number
  ): Promise<LpTokenEstimate | null> => {
    if (!program) {
      setError('程序未初始化');
      return null;
    }

    try {
      setLoading(true);
      setError(null);

      const poolInfo = await (program.account as any).liquidityPool.fetch(poolAddress);
      
      // 获取池子中当前的代币数量和 LP 代币总供应量
      const poolTokenABalance = poolInfo.tokenABalance || 0;
      const poolTokenBBalance = poolInfo.tokenBBalance || 0;
      const lpTokenSupply = poolInfo.lpTokenSupply || 0;

      // 获取代币精度
      const tokenAMint = poolInfo.tokenAMint;
      const tokenBMint = poolInfo.tokenBMint;
      const lpTokenMint = poolInfo.lpTokenMint;
      
      const tokenADecimals = await getTokenDecimals(connection, tokenAMint);
      const tokenBDecimals = await getTokenDecimals(connection, tokenBMint);
      const lpTokenDecimals = await getTokenDecimals(connection, lpTokenMint);

      // 将用户输入转换为代币的最小单位进行计算
      const tokenAAmount = amountA * Math.pow(10, tokenADecimals);
      const tokenBAmount = amountB * Math.pow(10, tokenBDecimals);

      let estimatedLpTokens = 0;

      if (lpTokenSupply === 0) {
        // 如果是第一次添加流动性，使用几何平均数
        const logA = Math.log(tokenAAmount);
        const logB = Math.log(tokenBAmount);
        const logResult = (logA + logB) / 2;
        estimatedLpTokens = Math.exp(logResult);
        
        // 如果结果仍然太大，使用更简单的估算
        if (!isFinite(estimatedLpTokens) || estimatedLpTokens > Number.MAX_SAFE_INTEGER) {
          const userGeometricMean = Math.sqrt(amountA * amountB);
          estimatedLpTokens = userGeometricMean * Math.pow(10, lpTokenDecimals);
        }
      } else {
        // 如果池子已有流动性，按比例计算
        const shareA = (tokenAAmount / poolTokenABalance) * lpTokenSupply;
        const shareB = (tokenBAmount / poolTokenBBalance) * lpTokenSupply;
        estimatedLpTokens = Math.min(shareA, shareB);
      }

      // 确保结果是有限的数值
      if (!isFinite(estimatedLpTokens) || estimatedLpTokens <= 0) {
        const simpleEstimate = Math.min(amountA, amountB);
        estimatedLpTokens = simpleEstimate * Math.pow(10, lpTokenDecimals);
      }

      // 将结果转换回用户可读的单位
      const estimatedLpTokensInUserUnits = estimatedLpTokens / Math.pow(10, lpTokenDecimals);
      const minLpTokensWithSlippage = Math.floor(estimatedLpTokensInUserUnits * 0.99);

      console.log('✅ LP 代币数量估算成功:', {
        estimatedLpTokens: Math.floor(estimatedLpTokensInUserUnits),
        minLpTokensWithSlippage,
      });

      return {
        estimatedLpTokens: Math.floor(estimatedLpTokensInUserUnits),
        minLpTokensWithSlippage,
      };
    } catch (err) {
      console.error('估算 LP 代币数量失败:', err);
      // 如果估算失败，返回简单的估算值
      const simpleEstimate = Math.sqrt(amountA * amountB);
      const minWithSlippage = Math.floor(simpleEstimate * 0.99);
      
      return {
        estimatedLpTokens: Math.floor(simpleEstimate),
        minLpTokensWithSlippage: minWithSlippage,
      };
    } finally {
      setLoading(false);
    }
  }, [program, connection]);

  // 计算最优添加流动性数量
  const calculateOptimalLiquidityAmounts = useCallback(async (
    poolAddress: PublicKey,
    inputAmount: number,
    isTokenA: boolean,
    userTokenABalance: number,
    userTokenBBalance: number,
    getPoolReserves: (poolAddress: PublicKey) => Promise<PoolReserves | null>
  ): Promise<OptimalLiquidityAmounts | null> => {
    if (!program) {
      return null;
    }

    try {
      const reserves = await getPoolReserves(poolAddress);
      if (!reserves) {
        return null;
      }

      const { tokenAReserve, tokenBReserve } = reserves;

      // 如果池子为空，返回用户输入的数量
      if (tokenAReserve === 0 || tokenBReserve === 0) {
        return {
          tokenAAmount: isTokenA ? inputAmount : 0,
          tokenBAmount: isTokenA ? 0 : inputAmount,
          isLimited: false,
          limitingToken: null,
        };
      }

      let tokenAAmount: number;
      let tokenBAmount: number;
      let isLimited = false;
      let limitingToken: 'A' | 'B' | null = null;

      if (isTokenA) {
        tokenAAmount = inputAmount;
        tokenBAmount = (inputAmount * tokenBReserve) / tokenAReserve;

        if (tokenBAmount > userTokenBBalance) {
          tokenBAmount = userTokenBBalance;
          tokenAAmount = (userTokenBBalance * tokenAReserve) / tokenBReserve;
          isLimited = true;
          limitingToken = 'B';
        }

        if (tokenAAmount > userTokenABalance) {
          tokenAAmount = userTokenABalance;
          tokenBAmount = (userTokenABalance * tokenBReserve) / tokenAReserve;
          isLimited = true;
          limitingToken = 'A';
        }
      } else {
        tokenBAmount = inputAmount;
        tokenAAmount = (inputAmount * tokenAReserve) / tokenBReserve;

        if (tokenAAmount > userTokenABalance) {
          tokenAAmount = userTokenABalance;
          tokenBAmount = (userTokenABalance * tokenBReserve) / tokenAReserve;
          isLimited = true;
          limitingToken = 'A';
        }

        if (tokenBAmount > userTokenBBalance) {
          tokenBAmount = userTokenBBalance;
          tokenAAmount = (userTokenBBalance * tokenAReserve) / tokenBReserve;
          isLimited = true;
          limitingToken = 'B';
        }
      }

      return {
        tokenAAmount: Math.max(0, tokenAAmount),
        tokenBAmount: Math.max(0, tokenBAmount),
        isLimited,
        limitingToken,
      };
    } catch (err) {
      console.error('计算最优流动性数量失败:', err);
      return null;
    }
  }, [program]);

  // 计算可移除的最大流动性
  const calculateMaxRemovableLiquidity = useCallback(async (
    poolAddress: PublicKey,
    userLpBalance: number,
    getPoolReserves: (poolAddress: PublicKey) => Promise<PoolReserves | null>
  ): Promise<MaxRemovableLiquidity | null> => {
    if (!program) {
      return null;
    }

    try {
      const poolInfo = await (program.account as any).liquidityPool.fetch(poolAddress);
      const reserves = await getPoolReserves(poolAddress);
      
      if (!reserves) {
        return null;
      }

      const { tokenAReserve, tokenBReserve } = reserves;
      
      // 获取LP代币总供应量
      const lpTokenMintInfo = await connection.getAccountInfo(poolInfo.lpTokenMint);
      if (!lpTokenMintInfo) {
        return null;
      }

      const lpTotalSupplyRaw = new anchor.BN(lpTokenMintInfo.data.slice(36, 44), 'le').toNumber();
      const lpDecimals = await getTokenDecimals(connection, poolInfo.lpTokenMint);
      const lpTotalSupply = lpTotalSupplyRaw / Math.pow(10, lpDecimals);

      if (lpTotalSupply === 0) {
        return {
          maxLpAmount: 0,
          tokenAAmount: 0,
          tokenBAmount: 0,
        };
      }

      // 计算用户可以获得的代币数量
      const userShare = userLpBalance / lpTotalSupply;
      const tokenAAmount = tokenAReserve * userShare;
      const tokenBAmount = tokenBReserve * userShare;

      return {
        maxLpAmount: userLpBalance,
        tokenAAmount,
        tokenBAmount,
      };
    } catch (err) {
      console.error('计算最大可移除流动性失败:', err);
      return null;
    }
  }, [program, connection]);

  // 计算移除流动性的预期输出
  const calculateRemoveLiquidityOutput = useCallback(async (
    poolAddress: PublicKey,
    lpAmount: number,
    getPoolReserves: (poolAddress: PublicKey) => Promise<PoolReserves | null>
  ): Promise<RemoveLiquidityOutput | null> => {
    if (!program) {
      return null;
    }

    try {
      const poolInfo = await (program.account as any).liquidityPool.fetch(poolAddress);
      const reserves = await getPoolReserves(poolAddress);
      
      if (!reserves) {
        return null;
      }

      const { tokenAReserve, tokenBReserve } = reserves;
      
      // 获取LP代币总供应量
      const lpTokenMintInfo = await connection.getAccountInfo(poolInfo.lpTokenMint);
      if (!lpTokenMintInfo) {
        return null;
      }

      const lpTotalSupplyRaw = new anchor.BN(lpTokenMintInfo.data.slice(36, 44), 'le').toNumber();
      const lpDecimals = await getTokenDecimals(connection, poolInfo.lpTokenMint);
      const lpTotalSupply = lpTotalSupplyRaw / Math.pow(10, lpDecimals);

      if (lpTotalSupply === 0) {
        return {
          tokenAAmount: 0,
          tokenBAmount: 0,
          tokenAAmountWithSlippage: 0,
          tokenBAmountWithSlippage: 0,
        };
      }

      // 计算用户可以获得的代币数量
      const userShare = lpAmount / lpTotalSupply;
      const tokenAAmount = tokenAReserve * userShare;
      const tokenBAmount = tokenBReserve * userShare;

      // 计算滑点后的数量
      const tokenAAmountWithSlippage = tokenAAmount * 0.99;
      const tokenBAmountWithSlippage = tokenBAmount * 0.99;

      return {
        tokenAAmount,
        tokenBAmount,
        tokenAAmountWithSlippage,
        tokenBAmountWithSlippage,
      };
    } catch (err) {
      console.error('计算移除流动性的预期输出失败:', err);
      return null;
    }
  }, [program, connection]);

  return {
    loading,
    error,
    initializePool,
    addLiquidity,
    removeLiquidity,
    estimateLpTokens,
    calculateOptimalLiquidityAmounts,
    calculateMaxRemovableLiquidity,
    calculateRemoveLiquidityOutput,
  };
} 