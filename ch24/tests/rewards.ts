import { Account, createMint, getOrCreateAssociatedTokenAccount, mintTo, TOKEN_PROGRAM_ID } from "@solana/spl-token"
import { AUTHORITY_KEYPAIR, Fixture, setup, TREASURY_KEYPAIR } from "./setup";
import { BN } from "bn.js";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { Dex } from "../target/types/dex";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";

describe("rewards", () => {
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

  const userA = Keypair.generate();
  const userB = Keypair.generate();

  before(async () => {
    fixture = await setup();
    const { provider, program: dexProgram, config } = fixture;
    program = dexProgram as Program<Dex>;
    
    // 给 userA 和 userB 空投一些 SOL 来支付交易费用
    const airdropUserA = await provider.connection.requestAirdrop(userA.publicKey, 2 * 10 ** 9);
    const airdropUserB = await provider.connection.requestAirdrop(userB.publicKey, 2 * 10 ** 9);
    await provider.connection.confirmTransaction(airdropUserA);
    await provider.connection.confirmTransaction(airdropUserB);
    
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

    const userATokenX = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      userA,
      tokenMintX,
      userA.publicKey,
    );
    const userATokenY = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      userA,
      tokenMintY,
      userA.publicKey,
    );
    const userBTokenX = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      userB,
      tokenMintX,
      userB.publicKey,
    );
    const userBTokenY = await getOrCreateAssociatedTokenAccount(
      provider.connection,
      userB,
      tokenMintY,
      userB.publicKey,
    );
    // 铸造 Token 给 UserA 1000X 和 2000个Y
    const mintUserAXTx = await mintTo(provider.connection,
      AUTHORITY_KEYPAIR,
      tokenMintX,
      userATokenX.address,
      AUTHORITY_KEYPAIR,
      1000 * 10 ** 9);
    const mintUserAYTx = await mintTo(provider.connection,
      AUTHORITY_KEYPAIR,
      tokenMintY,
      userATokenY.address,
      AUTHORITY_KEYPAIR,
      2000 * 10 ** 9);
    await provider.connection.confirmTransaction(mintUserAXTx);
    await provider.connection.confirmTransaction(mintUserAYTx);

    // 铸造 Token 给 UserB 10000X 和 20000个Y
    const mintUserBXTx = await mintTo(provider.connection,
      AUTHORITY_KEYPAIR,
      tokenMintX,
      userBTokenX.address,
      AUTHORITY_KEYPAIR,
      10000 * 10 ** 9);
    const mintUserBYTx = await mintTo(provider.connection,
      AUTHORITY_KEYPAIR,
      tokenMintY,
      userBTokenY.address,
      AUTHORITY_KEYPAIR,
      20000 * 10 ** 9);
    await provider.connection.confirmTransaction(mintUserBXTx);
    await provider.connection.confirmTransaction(mintUserBYTx);

    // 计算所需要的 PDA 账户
    const [pool] = PublicKey.findProgramAddressSync([
      Buffer.from("pool"), tokenMintX.toBuffer(), tokenMintY.toBuffer()
    ], program.programId)
    const [user_position] = PublicKey.findProgramAddressSync([
      Buffer.from("user_position"), pool.toBuffer(), userA.publicKey.toBuffer()
    ], program.programId)
    const [vault_x] = PublicKey.findProgramAddressSync([
      Buffer.from("vault"), pool.toBuffer(), tokenMintX.toBuffer()
    ], program.programId)
    const [vault_y] = PublicKey.findProgramAddressSync([
      Buffer.from("vault"), pool.toBuffer(), tokenMintY.toBuffer()
    ], program.programId)

    // 创建交易池并提供初始的流动性
    const initializePoolTx = await program.methods.initializePool(
      new BN(1000 * 10 ** 9),
      new BN(2000 * 10 ** 9)
    ).accounts({
      payer: userA.publicKey,
      // @ts-ignore
      config,
      pool,
      tokenXMint: tokenMintX,
      tokenYMint: tokenMintY,
      userTokenX: userATokenX.address,
      userTokenY: userATokenY.address,
      user_position,
      vault_x,
      vault_y,
    }).signers(
      [userA]
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

    // 给 AUTHORITY_KEYPAIR 铸造一些 tokenX 用于交易测试
    const mintAuthorityXTx = await mintTo(provider.connection,
      AUTHORITY_KEYPAIR,
      tokenMintX,
      userTokenX.address,
      AUTHORITY_KEYPAIR,
      1000 * 10 ** 9);
    await provider.connection.confirmTransaction(mintAuthorityXTx);
  })

  // 计算奖励是否符合预期
  it("计算奖励是否符合预期", async () => {
    // #region 交易
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
    // #endregion

    const [userAPosition] = PublicKey.findProgramAddressSync([
      Buffer.from("user_position"), pool.toBuffer(), userA.publicKey.toBuffer()
    ], program.programId)
    const userAPositionInfo = await program.account.userPosition.fetch(userAPosition);
    
    // 获取 userA 的 token 账户用于领取奖励
    const userATokenX = await getOrCreateAssociatedTokenAccount(
      fixture.provider.connection,
      userA,
      tokenMintX,
      userA.publicKey,
    );
    const userATokenY = await getOrCreateAssociatedTokenAccount(
      fixture.provider.connection,
      userA,
      tokenMintY,
      userA.publicKey,
    );
    
    // 领取A的奖励
    const claimRewardsTx = await program.methods.claimRewards().accounts({
      user: userA.publicKey,
      pool,
      userPosition: userAPosition,
      userTokenX: userATokenX.address,
      userTokenY: userATokenY.address,
      poolTokenX: poolTokenInput,
      poolTokenY: poolTokenOut,
    }).signers([userA]).rpc();
    await fixture.provider.connection.confirmTransaction(claimRewardsTx);

    const afterUserAPositionInfo = await program.account.userPosition.fetch(userAPosition);
    console.log('afterUserAPositionInfo:', 
      // 转换BN
      afterUserAPositionInfo.lastXRewardAmount.toString(),
      afterUserAPositionInfo.lastYRewardAmount.toString(),
      afterUserAPositionInfo.pendingXRewardAmount.toString(),
      afterUserAPositionInfo.pendingYRewardAmount.toString(),
    );

    // 200 * 0.3% = 0.6Y
    // 0.6Y * 80% = 0.48Y
    // 0.44Y
    // 预期的Y奖励数量
    // 大概是：输入 * X和Y的比例 * 奖励比例
    // 修复: 使用整数计算小数 - 0.003 = 3/1000, 0.8 = 8/10
    const expectedYReward = inputAmount
      .mul(new BN(2000000000))
      .div(new BN(1000000000))
      .mul(new BN(3))        // 0.003 = 3/1000
      .div(new BN(1000))
      .mul(new BN(8))        // 0.8 = 8/10  
      .div(new BN(10));
    console.log('expectedYReward:', expectedYReward.toString());
    console.log('actualYReward:', afterUserAPositionInfo.lastYRewardAmount.toString());
    
    // 允许10%的滑点，检查实际值是否在预期值的90%-110%范围内
    const slippageTolerance = 0.1; // 10%
    const lowerBound = expectedYReward.mul(new BN((1 - slippageTolerance) * 1000000)).div(new BN(1000000));
    const upperBound = expectedYReward.mul(new BN((1 + slippageTolerance) * 1000000)).div(new BN(1000000));
    
    console.log('lowerBound (90%):', lowerBound.toString());
    console.log('upperBound (110%):', upperBound.toString());
    
    const actualReward = new BN(afterUserAPositionInfo.lastYRewardAmount.toString());
    expect(actualReward.gte(lowerBound) && actualReward.lte(upperBound)).to.be.true;

    // 模拟用户B提供流动性的场景
  })
});
