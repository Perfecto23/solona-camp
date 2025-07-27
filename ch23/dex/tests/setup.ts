import * as anchor from "@coral-xyz/anchor";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import { Dex } from "../target/types/dex";

export interface Fixture {
  provider: anchor.AnchorProvider;
  program: Program<Dex>;
  config: PublicKey;
}

// 协议管理员账户
export const AUTHORITY_KEYPAIR = Keypair.generate();
// 协议费收款账户
export const TREASURY_KEYPAIR = Keypair.generate();
// 交易费
export const SWAP_FEE_RATE = 30;
// 协议费
export const PROTOCOL_FEE_RATE = 20;

// 对合约来说是一个纯函数 多次调用结果一致 无副作用
export async function setup(): Promise<Fixture> {
  // 环境配置 提供器
  const provider = anchor.AnchorProvider.env();
  // 链上程序的实例
  const program = anchor.workspace.dex as Program<Dex>;

  // 给钱包空投 SOL
  const airdropTx = await provider.connection.requestAirdrop(
    AUTHORITY_KEYPAIR.publicKey,
    10 * LAMPORTS_PER_SOL
  );
  // 确认空投到账
  await provider.connection.confirmTransaction(airdropTx, 'confirmed');

  // 查找config的PDA
  const [config] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  try {
    await program.account.config.fetch(config);
  } catch (e) {
    const tx = await program.methods.initializeConfig(
      SWAP_FEE_RATE,
      PROTOCOL_FEE_RATE
    ).
      accounts(
        {
          payer: AUTHORITY_KEYPAIR.publicKey,
          authority: AUTHORITY_KEYPAIR.publicKey,
          treasury: TREASURY_KEYPAIR.publicKey,
          config: config
        }
      ).
      signers([
        AUTHORITY_KEYPAIR
      ]).
      rpc();

    await provider.connection.confirmTransaction(tx, 'confirmed');
  }

  return {
    provider,
    program,
    config
  }
}
