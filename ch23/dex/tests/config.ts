import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Dex } from "../target/types/dex";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { AUTHORITY_KEYPAIR, Fixture, PROTOCOL_FEE_RATE, setup, SWAP_FEE_RATE, TREASURY_KEYPAIR } from "./setup";

describe("配置", () => {
  let fixture: Fixture | null = null;

  before(async () => {
    fixture = await setup();
  })

  it("初始化配置", async () => {
    // 初始化管理员钱包
    const authorityKeypair = AUTHORITY_KEYPAIR;
    const authorityWallet = new anchor.Wallet(authorityKeypair);

    // 初始化收款账户
    const treasuryKeypair = TREASURY_KEYPAIR;
    const treasuryWallet = new anchor.Wallet(treasuryKeypair);

    const program = fixture!.program;
    const provider = fixture!.provider;

    // 查找config的PDA
    const [configPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      program.programId
    );

    const swapFeeRate = SWAP_FEE_RATE;
    const protocolFeeRate = PROTOCOL_FEE_RATE;

    // 通过 RPC 获取账户信息
    const configInfo = await program.account.config.fetch(configPDA);

    // 验证数据是否正确
    // 1. 验证管理员地址是否正确
    expect(configInfo.authority.toString()).to.equal(authorityWallet.publicKey.toString());
    // 2. 验证收款账户地址是否正确
    expect(configInfo.treasury.toString()).to.equal(treasuryWallet.publicKey.toString());
    // 3. 验证交易费是否正确
    expect(configInfo.swapFeeRate.toString()).to.equal(String(
      swapFeeRate
    ));
    // 4. 验证协议费是否正确
    expect(configInfo.protocolFeeRate.toString()).to.equal(String(
      protocolFeeRate
    ));
    // 5. 验证协议是否正确运行
    expect(configInfo.isPaused).to.equal(false);
  });
});

// 单元测试：更新相关指令