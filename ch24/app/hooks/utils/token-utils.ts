import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import { TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID, createAssociatedTokenAccountInstruction, getAssociatedTokenAddress } from '@solana/spl-token';
import * as anchor from '@coral-xyz/anchor';
import { DEFAULT_TOKEN_DECIMALS } from '../constants';

// 获取代币精度
export const getTokenDecimals = async (connection: Connection, mint: PublicKey): Promise<number> => {
  try {
    const mintInfo = await connection.getAccountInfo(mint);
    if (!mintInfo) {
      throw new Error('代币不存在');
    }
    
    // 解析代币铸币信息，精度信息在第44个字节
    const decimals = mintInfo.data[44];
    return decimals;
  } catch (err) {
    console.error('获取代币精度失败:', err);
    // 默认返回9位精度（大多数 Solana 代币的标准精度）
    return DEFAULT_TOKEN_DECIMALS;
  }
};

// 将用户输入转换为代币的最小单位
export const convertToTokenAmount = (amount: number, decimals: number): anchor.BN => {
  const multiplier = Math.pow(10, decimals);
  const tokenAmount = Math.floor(amount * multiplier);
  
  // 检查是否超出安全范围
  if (tokenAmount > Number.MAX_SAFE_INTEGER) {
    throw new Error(`输入数量过大，请输入较小的数值。最大安全值约为 ${Number.MAX_SAFE_INTEGER / multiplier}`);
  }
  
  if (tokenAmount < 0) {
    throw new Error('输入数量不能为负数');
  }
  
  console.log(`转换: ${amount} -> ${tokenAmount} (精度: ${decimals})`);
  return new anchor.BN(tokenAmount);
};

// 检查并创建关联代币账户
export const ensureAssociatedTokenAccount = async (
  connection: Connection,
  mint: PublicKey,
  owner: PublicKey,
  accountName: string,
  signTransaction: ((transaction: Transaction) => Promise<Transaction>) | undefined
): Promise<PublicKey> => {
  const [associatedTokenAccount] = PublicKey.findProgramAddressSync(
    [
      owner.toBuffer(),
      TOKEN_PROGRAM_ID.toBuffer(),
      mint.toBuffer(),
    ],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );

  const accountInfo = await connection.getAccountInfo(associatedTokenAccount);
  if (!accountInfo) {
    console.log(`${accountName}关联账户不存在，正在创建...`);
    
    const createAccountIx = createAssociatedTokenAccountInstruction(
      owner, // payer
      associatedTokenAccount, // associatedToken
      owner, // owner
      mint // mint
    );

    const transaction = new Transaction().add(createAccountIx);
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = owner;
    
    if (!signTransaction) {
      throw new Error('钱包不支持签名交易');
    }
    
    const signedTransaction = await signTransaction(transaction);
    const createAccountTx = await connection.sendRawTransaction(signedTransaction.serialize());
    
    console.log(`✅ ${accountName}关联账户创建成功, 交易ID:`, createAccountTx);
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  return associatedTokenAccount;
};

// 验证代币地址是否是有效的 SPL Token
export const validateTokenAddress = async (connection: Connection, tokenAddress: PublicKey, tokenName: string): Promise<void> => {
  const tokenInfo = await connection.getAccountInfo(tokenAddress);
  
  if (!tokenInfo) {
    throw new Error(`${tokenName}地址不存在`);
  }
  
  // 检查是否是 SPL Token 程序拥有的账户
  if (!tokenInfo.owner.equals(TOKEN_PROGRAM_ID)) {
    throw new Error(`${tokenName}不是有效的 SPL Token (owner: ${tokenInfo.owner.toString()})`);
  }
}; 