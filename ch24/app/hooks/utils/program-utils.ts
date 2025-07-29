import { Connection, PublicKey, Transaction, VersionedTransaction } from '@solana/web3.js';
import * as anchor from '@coral-xyz/anchor';
import IDL from '../../lib/dex-idl.json';

// 创建 Anchor 程序实例
export const createProgram = (
  connection: Connection,
  publicKey: PublicKey | null,
  signTransaction: (<T extends Transaction | VersionedTransaction>(tx: T) => Promise<T>) | undefined,
  signAllTransactions: (<T extends Transaction | VersionedTransaction>(txs: T[]) => Promise<T[]>) | undefined
): anchor.Program | null => {
  if (!connection || !publicKey || !signTransaction || !signAllTransactions) return null;
  
  try {
    // 创建 Provider - 完全按照测试代码的模式
    const provider = new anchor.AnchorProvider(
      connection,
      {
        publicKey,
        signTransaction,
        signAllTransactions,
      },
      { commitment: 'confirmed' }
    );
    
    // 创建程序实例 - 完全按照测试代码的模式
    const program = new anchor.Program(IDL as anchor.Idl, provider);
    return program;
  } catch (err) {
    console.error('创建程序实例失败:', err);
    return null;
  }
}; 