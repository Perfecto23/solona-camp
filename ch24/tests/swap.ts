import { Account, createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token"
import { AUTHORITY_KEYPAIR, Fixture, setup, TREASURY_KEYPAIR } from "./setup";
import { BN } from "bn.js";
import { PublicKey } from "@solana/web3.js";
import { Dex } from "../target/types/dex";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";

describe("swap", () => {
  let fixture: Fixture | null = null;
  let tokenMintX: PublicKey | null = null;
  let tokenMintY: PublicKey | null = null;
  let userTokenX: Account | null = null;
  let userTokenY: Account | null = null;
  let program: Program<Dex> | null = null;
  let poolTokenInput: PublicKey | null = null;
  let poolTokenOut: PublicKey | null = null;
  let treasury: PublicKey | null = null;
  let treasuryTokenOutput: PublicKey | null = null;

  before(async () => {
    fixture = await setup();
    const { provider, program: dexProgram, config } = fixture;
    program = dexProgram as Program<Dex>;
    // 创建2个token，x y
    tokenMintX = await createMint(
      provider.connection,
      AUTHORITY_KEYPAIR,
      AUTHORITY_KEYPAIR.publicKey,
      null,
      9
    );
    tokenMintY = await createMint(
      provider.connection,
      AUTHORITY_KEYPAIR,
      AUTHORITY_KEYPAIR.publicKey,
      null,
      9
    );
    // 创建 ATA 账户
    userTokenX = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      AUTHORITY_KEYPAIR,
      tokenMintX,
      AUTHORITY_KEYPAIR.publicKey,
    );
    userTokenY = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      AUTHORITY_KEYPAIR,
      tokenMintY,
      AUTHORITY_KEYPAIR.publicKey,
    );
    // 铸造 Token 1000X 和 2000个Y
    const mintXTx = await mintTo(provider.connection,
      AUTHORITY_KEYPAIR,
      tokenMintX,
      userTokenX.address,
      AUTHORITY_KEYPAIR,
      1000 * 10 ** 9);
    const mintYTx = await mintTo(provider.connection,
      AUTHORITY_KEYPAIR,
      tokenMintY,
      userTokenY.address,
      AUTHORITY_KEYPAIR,
      2000 * 10 ** 9);
    await provider.connection.confirmTransaction(mintXTx);
    await provider.connection.confirmTransaction(mintYTx);
    // 计算所需要的 PDA 账户
    const [pool] = PublicKey.findProgramAddressSync([
      Buffer.from("pool"), tokenMintX.toBuffer(), tokenMintY.toBuffer()
    ], program.programId)
    const [user_position] = PublicKey.findProgramAddressSync([
      Buffer.from("user_position"), pool.toBuffer(), AUTHORITY_KEYPAIR.publicKey.toBuffer()
    ], program.programId)
    const [vault_x] = PublicKey.findProgramAddressSync([
      Buffer.from("vault"), pool.toBuffer(), tokenMintX.toBuffer()
    ], program.programId)
    const [vault_y] = PublicKey.findProgramAddressSync([
      Buffer.from("vault"), pool.toBuffer(), tokenMintY.toBuffer()
    ], program.programId)

    // 创建交易池并提供初始的流动性
    const initializePoolTx = await program.methods.initializePool(
      new BN(400 * 10 ** 9),
      new BN(800 * 10 ** 9)
    ).accounts({
      payer: AUTHORITY_KEYPAIR.publicKey,
      // @ts-ignore
      config,
      pool,
      tokenXMint: tokenMintX,
      tokenYMint: tokenMintY,
      userTokenX: userTokenX.address,
      userTokenY: userTokenY.address,
      user_position,
      vault_x,
      vault_y,
    }).signers(
      [AUTHORITY_KEYPAIR]
    ).rpc();
    await provider.connection.confirmTransaction(initializePoolTx);

    poolTokenInput = PublicKey.findProgramAddressSync([
      Buffer.from("vault"), pool.toBuffer(), tokenMintX.toBuffer()
    ], program.programId)[0]
    poolTokenOut = PublicKey.findProgramAddressSync([
      Buffer.from("vault"), pool.toBuffer(), tokenMintY.toBuffer()
    ], program.programId)[0]
    treasury = TREASURY_KEYPAIR.publicKey;

    // 为 treasury 创建 tokenY 的 ATA 账户来接收协议费
    const treasuryTokenAccount = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      AUTHORITY_KEYPAIR,
      tokenMintY,
      treasury,
    );
    treasuryTokenOutput = treasuryTokenAccount.address;
  })

  // x 兑换 y
  it("用代币x兑换代币y", async () => {
    // 查询交换前的余额
    const beforeUserXAmount = await fixture.provider.connection.getTokenAccountBalance(userTokenX.address);
    const beforeUserYAmount = await fixture.provider.connection.getTokenAccountBalance(userTokenY.address);

    const [pool] = PublicKey.findProgramAddressSync([
      Buffer.from("pool"), tokenMintX.toBuffer(), tokenMintY.toBuffer()
    ], program.programId)

    // 允许滑点 10%
    const inputAmount = new BN(100 * 10 ** 9);
    const slippage = 0.1;
    // 输入 * 比例 * 滑点 = 最小输出
    const minAmountOut = inputAmount.mul(new BN(1000000000 - slippage * 1000000000)).div(new BN(1000000000));

    // 执行交易
    const swapTx = await program.methods.swap(
      inputAmount,
      minAmountOut
    ).accounts({
      user: AUTHORITY_KEYPAIR.publicKey,
      // @ts-ignore
      config: fixture.config,
      pool,
      inputMint: tokenMintX,
      outMint: tokenMintY,
      userTokenInput: userTokenX.address,
      userTokenOut: userTokenY.address,
      poolTokenInput,
      poolTokenOut,
      treasury,
      treasuryTokenOutput,
    })
      .signers(
        [AUTHORITY_KEYPAIR]
      )
      .rpc();
    await fixture.provider.connection.confirmTransaction(swapTx);

    // 断言交易后的余额是否符合预期
    const afterUserXAmount = await fixture.provider.connection.getTokenAccountBalance(userTokenX.address);
    const afterUserYAmount = await fixture.provider.connection.getTokenAccountBalance(userTokenY.address);

    expect(afterUserXAmount.value.amount.toString()).to.equal(new BN(beforeUserXAmount.value.amount).sub(inputAmount).toString());
    // 判断输出是否大于最小输出
    expect(new BN(afterUserYAmount.value.amount).gte(minAmountOut)).to.be.true;
  })
  // y 兑换 x
  // 测试交易滑点，如果输出不满足滑点，交易应该失败
});
