import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey, SystemProgram, Transaction } from '@solana/web3.js';
import { useState, useCallback, useMemo } from 'react';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, createAssociatedTokenAccountInstruction } from '@solana/spl-token';
import { SwapOutput } from '../types/dex-types';
import { findGlobalConfigAddress } from '../utils/address-utils';
import { createProgram } from '../utils/program-utils';
import { getTokenDecimals, convertToTokenAmount } from '../utils/token-utils';
import { DEFAULT_SWAP_FEE_RATE } from '../constants';

export function useDexSwap() {
  const { connection } = useConnection();
  const { publicKey, signTransaction, signAllTransactions } = useWallet();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastTransactionTime, setLastTransactionTime] = useState<number>(0);

  // 获取 Anchor 程序实例
  const program = useMemo(() => {
    return createProgram(connection, publicKey, signTransaction, signAllTransactions);
  }, [connection, publicKey, signTransaction, signAllTransactions]);

  // 交换代币
  const swap = useCallback(async (
    poolAddress: PublicKey,
    amountIn: number,
    minAmountOut: number,
    isAToB: boolean
  ): Promise<string> => {
    if (!publicKey || !program) {
      setError('钱包未连接或程序未初始化');
      return '';
    }

    // 防止快速重复提交（至少间隔2秒）
    const now = Date.now();
    if (now - lastTransactionTime < 2000) {
      console.warn('交易间隔太短，请稍后再试');
      throw new Error('交易过于频繁，请稍后再试');
    }

    try {
      setLoading(true);
      setError(null);
      setLastTransactionTime(now);

      // 获取池子信息
      const poolInfo = await (program.account as any).pool.fetch(poolAddress);
      
      const tokenAMint = poolInfo.tokenXMint;
      const tokenBMint = poolInfo.tokenYMint;
      const tokenAAccount = poolInfo.vaultX;
      const tokenBAccount = poolInfo.vaultY;

      // 获取全局配置地址和数据
      const globalConfig = findGlobalConfigAddress();
      const globalConfigData = await (program.account as any).config.fetch(globalConfig);

      // 根据交换方向确定输入和输出代币
      const tokenInMint = isAToB ? tokenAMint : tokenBMint;
      const tokenOutMint = isAToB ? tokenBMint : tokenAMint;
      const poolTokenInAccount = isAToB ? tokenAAccount : tokenBAccount;
      const poolTokenOutAccount = isAToB ? tokenBAccount : tokenAAccount;

      // 获取代币精度
      const tokenInDecimals = await getTokenDecimals(connection, tokenInMint);
      const tokenOutDecimals = await getTokenDecimals(connection, tokenOutMint);

      // 将用户输入转换为代币的最小单位
      const inputAmount = convertToTokenAmount(amountIn, tokenInDecimals);
      const minOutputAmount = convertToTokenAmount(minAmountOut, tokenOutDecimals);

      // 获取用户的关联代币账户地址
      const [userTokenInAccount] = PublicKey.findProgramAddressSync(
        [
          publicKey.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          tokenInMint.toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      const [userTokenOutAccount] = PublicKey.findProgramAddressSync(
        [
          publicKey.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          tokenOutMint.toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // 获取协议费账户地址
      const protocolFeeAccountOwner = globalConfigData.treasury;

      // 计算协议费用账户地址（输出代币的关联代币账户，用于收取协议费）
      const [treasuryTokenOutputAccount] = PublicKey.findProgramAddressSync(
        [
          protocolFeeAccountOwner.toBuffer(),
          TOKEN_PROGRAM_ID.toBuffer(),
          tokenOutMint.toBuffer(),
        ],
        ASSOCIATED_TOKEN_PROGRAM_ID
      );

      // 检查并创建必要的关联代币账户
      const accountsToCheck = [
        { account: userTokenInAccount, mint: tokenInMint, name: '输入代币', owner: publicKey },
        { account: userTokenOutAccount, mint: tokenOutMint, name: '输出代币', owner: publicKey },
        { account: treasuryTokenOutputAccount, mint: tokenOutMint, name: '协议费用', owner: protocolFeeAccountOwner }
      ];

      for (const { account, mint, name, owner } of accountsToCheck) {
        const accountInfo = await connection.getAccountInfo(account);
        if (!accountInfo) {
          console.log(`${name}关联账户不存在，正在创建...`);
          
          const accountOwner = owner || publicKey;
          
          const createAccountIx = createAssociatedTokenAccountInstruction(
            publicKey,
            account,
            accountOwner,
            mint
          );

          const transaction = new Transaction().add(createAccountIx);
          const { blockhash } = await connection.getLatestBlockhash();
          transaction.recentBlockhash = blockhash;
          transaction.feePayer = publicKey;
          
          if (!signTransaction) {
            throw new Error('钱包不支持签名交易');
          }
          
          const signedTransaction = await signTransaction(transaction);
          const createAccountTx = await connection.sendRawTransaction(signedTransaction.serialize());
          
          console.log(`✅ ${name}关联账户创建成功, 交易ID:`, createAccountTx);
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      // 调用程序方法进行交换
      console.log('🔄 准备发送交换交易...');
      
      // 获取最新的 blockhash 以避免重复交易问题
      const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
      console.log('✅ 获取到最新 blockhash:', blockhash);

      // 手动构建交易以确保使用我们获取的blockhash
      const transaction = await program.methods
        .swap(
          inputAmount,
          minOutputAmount
        )
        .accounts({
          user: publicKey,
          config: globalConfig,
          pool: poolAddress,
          inputMint: tokenInMint,
          outMint: tokenOutMint,
          poolTokenInput: poolTokenInAccount,
          poolTokenOut: poolTokenOutAccount,
          userTokenInput: userTokenInAccount,
          userTokenOut: userTokenOutAccount,
          treasury: protocolFeeAccountOwner,
          treasuryTokenOutput: treasuryTokenOutputAccount,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .transaction();

      // 设置交易的 blockhash 和费用支付者
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      console.log('🔄 准备签名交易...');
      
      // 签名交易
      if (!signTransaction) {
        throw new Error('钱包不支持签名交易');
      }
      
      const signedTransaction = await signTransaction(transaction);
      
      console.log('🔄 发送交易...');
      
      // 发送交易
      const signature = await connection.sendRawTransaction(signedTransaction.serialize(), {
        skipPreflight: false,
        preflightCommitment: 'processed'
      });

      console.log("🔄 交易已发送，等待确认...", signature);
      
      // 等待交易确认
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight
      }, 'confirmed');
      
      if (confirmation.value.err) {
        throw new Error(`交易失败: ${JSON.stringify(confirmation.value.err)}`);
      }

      console.log("✅ 代币交换成功, 交易ID:", signature);
      return signature;
    } catch (err) {
      console.error('代币交换失败:', err);
      setError(`代币交换失败: ${err instanceof Error ? err.message : String(err)}`);
      return '';
    } finally {
      setLoading(false);
    }
  }, [publicKey, program, connection, signTransaction, lastTransactionTime]);

  // 计算交换输出
  const calculateSwapOutput = useCallback(async (
    poolAddress: PublicKey,
    amountIn: number,
    isAToB: boolean,
    getPoolReserves: (poolAddress: PublicKey) => Promise<{ tokenAReserve: number; tokenBReserve: number } | null>
  ): Promise<SwapOutput | null> => {
    if (!program || !publicKey) {
      return null;
    }

    try {
      const reserves = await getPoolReserves(poolAddress);
      const globalConfigData = await (program.account as any).config.fetch(findGlobalConfigAddress());
      
      if (!reserves) {
        return null;
      }

      const { tokenAReserve, tokenBReserve } = reserves;

      // 如果池子为空，无法进行交换
      if (tokenAReserve === 0 || tokenBReserve === 0) {
        return {
          expectedOutput: 0,
          minOutputWithSlippage: 0,
          priceImpact: 0,
        };
      }

      // 获取交换费率（从全局配置）
      const swapFeeRate = globalConfigData.swapFeeRate || DEFAULT_SWAP_FEE_RATE;

      // 根据交换方向确定储备量
      const reserveIn = isAToB ? tokenAReserve : tokenBReserve;
      const reserveOut = isAToB ? tokenBReserve : tokenAReserve;

      // 计算扣除手续费后的实际输入量
      const feeAmount = (amountIn * swapFeeRate) / 10000;
      const amountInWithFee = amountIn - feeAmount;

      // 使用常数乘积公式计算输出
      const expectedOutput = (reserveOut * amountInWithFee) / (reserveIn + amountInWithFee);

      // 计算价格影响
      const priceBeforeSwap = reserveOut / reserveIn;
      const priceAfterSwap = (reserveOut - expectedOutput) / (reserveIn + amountInWithFee);
      const priceImpact = Math.abs((priceAfterSwap - priceBeforeSwap) / priceBeforeSwap) * 100;

      // 默认1%滑点保护
      const minOutputWithSlippage = expectedOutput * 0.99;

      console.log('✅ 交换输出计算成功:', {
        amountIn,
        expectedOutput,
        minOutputWithSlippage,
        priceImpact,
        swapFeeRate,
      });

      return {
        expectedOutput: Math.max(0, expectedOutput),
        minOutputWithSlippage: Math.max(0, minOutputWithSlippage),
        priceImpact,
      };
    } catch (err) {
      console.error('计算交换输出失败:', err);
      return null;
    }
  }, [program, publicKey]);

  return {
    loading,
    error,
    swap,
    calculateSwapOutput,
  };
} 