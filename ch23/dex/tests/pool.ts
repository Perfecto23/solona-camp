import * as anchor from "@coral-xyz/anchor";
import { Program, BN } from "@coral-xyz/anchor";
import { Dex } from "../target/types/dex";
import { Keypair, LAMPORTS_PER_SOL, PublicKey } from "@solana/web3.js";
import { expect } from "chai";
import { createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { AUTHORITY_KEYPAIR, Fixture, setup, TREASURY_KEYPAIR } from "./setup";

describe("流动性池", () => {
  let fixture: Fixture | null = null;

  before(async () => {
    fixture = await setup();
  })

  it("初始化流动性池", async () => {

    // 初始化管理员钱包
    const authorityKeypair = AUTHORITY_KEYPAIR;
    const authorityWallet = new anchor.Wallet(authorityKeypair);

    const program = fixture!.program;
    const provider = fixture!.provider;

    const configPDA = fixture!.config;

    // 初始化流动性池

    // 创建两个代币
    const tokenMintX = await createMint(
      provider.connection,
      authorityWallet.payer,
      authorityWallet.publicKey,
      authorityWallet.publicKey,
      9,
    );
    const tokenMintY = await createMint(
      provider.connection,
      authorityWallet.payer,
      authorityWallet.publicKey,
      authorityWallet.publicKey,
      9,
    );
    // 创建用户的关联账户
    const userTokenX = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      authorityWallet.payer,
      tokenMintX,
      authorityWallet.publicKey);
    const userTokenY = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      authorityWallet.payer,
      tokenMintY,
      authorityWallet.publicKey);
    // 铸造代币 X
    await mintTo(
      provider.connection,
      authorityWallet.payer,
      tokenMintX,
      userTokenX.address,
      authorityWallet.publicKey,
      1000 * 10 ** 9,
    );
    // 铸造代币 Y
    await mintTo(
      provider.connection,
      authorityWallet.payer,
      tokenMintY,
      userTokenY.address,
      authorityWallet.publicKey,
      2000 * 10 ** 9,
    );

    // 查找pool的PDA
    const [poolPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("pool"), tokenMintX.toBuffer(), tokenMintY.toBuffer()],
      program.programId
    );
    // 查找池子的 vault X
    const [poolVaultXPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), poolPDA.toBuffer(), tokenMintX.toBuffer()],
      program.programId
    );
    // 查找池子的 vault Y
    const [poolVaultYPDA] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), poolPDA.toBuffer(), tokenMintY.toBuffer()],
      program.programId
    );
    
    const initializePoolTx = await program.methods.initializePool(
      new BN(400 * 10 ** 9),
      new BN(800 * 10 ** 9)
    )
      .accounts({
        payer: authorityWallet.publicKey,
        config: configPDA,
        pool: poolPDA,
        tokenXMint: tokenMintX,
        tokenYMint: tokenMintY,
        vaultX: poolVaultXPDA,
        vaultY: poolVaultYPDA,
        userTokenX: userTokenX.address,
        userTokenY: userTokenY.address,
        systemProgram: anchor.web3.SystemProgram.programId,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .signers([
        authorityWallet.payer
      ])
      .rpc();

    await provider.connection.confirmTransaction(initializePoolTx, 'confirmed');

    const poolInfo = await program.account.pool.fetch(poolPDA);

    // 验证数据是否正确
    // 1. 验证代币 x 的 mint 地址是否正确
    expect(poolInfo.tokenXMint.toString()).to.equal(tokenMintX.toString());
    // 2. 验证代币 y 的 mint 地址是否正确
    expect(poolInfo.tokenYMint.toString()).to.equal(tokenMintY.toString());
    // 3. 验证池子的 vault X 地址是否正确
    expect(poolInfo.vaultX.toString()).to.equal(poolVaultXPDA.toString());
    // 4. 验证池子的 vault Y 地址是否正确
    expect(poolInfo.vaultY.toString()).to.equal(poolVaultYPDA.toString());
    // 5. 验证池子的 vault X 余额是否正确
    const vaultXBalance = await provider.connection.getTokenAccountBalance(poolVaultXPDA);
    expect(vaultXBalance.value.amount).to.equal(String(400 * 10 ** 9));
    // 6. 验证池子的 vault Y 余额是否正确
    const vaultYBalance = await provider.connection.getTokenAccountBalance(poolVaultYPDA);
    expect(vaultYBalance.value.amount).to.equal(String(800 * 10 ** 9));
    // 7. 验证用户的 X 余额是否正确
    const userTokenXBalance = await provider.connection.getTokenAccountBalance(userTokenX.address);
    expect(userTokenXBalance.value.amount).to.equal(String(600 * 10 ** 9));
    // 8. 验证用户的 Y 余额是否正确
    const userTokenYBalance = await provider.connection.getTokenAccountBalance(userTokenY.address);
    expect(userTokenYBalance.value.amount).to.equal(String(1200 * 10 ** 9));
  });
});