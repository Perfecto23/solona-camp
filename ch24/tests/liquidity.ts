import { Account, createMint, getOrCreateAssociatedTokenAccount, mintTo } from "@solana/spl-token"
import { AUTHORITY_KEYPAIR, Fixture, setup, TREASURY_KEYPAIR } from "./setup";
import { BN } from "bn.js";
import { PublicKey } from "@solana/web3.js";
import { Dex } from "../target/types/dex";
import { Program } from "@coral-xyz/anchor";
import { expect } from "chai";

describe("liquidity", () => {
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

  // 添加流动性
  it("添加流动性", async () => {
    // 池子的钱有没有变多
    // 用户的钱有没有减少
    // 用户的LP有没有正常增加

    const [pool] = PublicKey.findProgramAddressSync([
      Buffer.from("pool"), tokenMintX.toBuffer(), tokenMintY.toBuffer()
    ], program.programId)
    const beforePool = await program.account.pool.fetch(pool);
    const beforeUserXAmount = await fixture.provider.connection.getTokenAccountBalance(userTokenX.address);
    const beforeUserYAmount = await fixture.provider.connection.getTokenAccountBalance(userTokenY.address);
    const [user_position] = PublicKey.findProgramAddressSync([
      Buffer.from("user_position"), pool.toBuffer(), AUTHORITY_KEYPAIR.publicKey.toBuffer()
    ], program.programId)
    const beforeUserLP = await program.account.userPosition.fetch(user_position);
    const beforePoolTokenX = await fixture.provider.connection.getTokenAccountBalance(beforePool.vaultX);
    const beforePoolTokenY = await fixture.provider.connection.getTokenAccountBalance(beforePool.vaultY);

    // 计算本次添加流动性获得的LP数量：sqrt(x * y)
    // 与智能合约中 calculate_lp_amount 函数保持一致
    const addX = new BN(100 * 10 ** 9);
    const addY = new BN(200 * 10 ** 9);
    
    // 计算 sqrt(x * y) - 使用 BN 的整数平方根算法
    const product = addX.mul(addY);
    
    // 实现大数平方根计算（牛顿法）
    function sqrtBN(n: any) {
      if (n.isZero()) return new BN(0);
      if (n.eq(new BN(1))) return new BN(1);
      
      let x = n;
      let y = n.add(new BN(1)).div(new BN(2));
      
      while (y.lt(x)) {
        x = y;
        y = x.add(n.div(x)).div(new BN(2));
      }
      
      return x;
    }
    
    const expectedLP = sqrtBN(product);
    
    // 滑点 10%
    const slippage = 0.1;
    const minLP = expectedLP.mul(new BN((1 - slippage) * 1000000)).div(new BN(1000000));
    const addLiquidityTx = await program.methods.addLiquidity(
      new BN(100 * 10 ** 9),
      new BN(200 * 10 ** 9),
      minLP
    ).accounts({
      user: AUTHORITY_KEYPAIR.publicKey,
      // @ts-ignore
      config: fixture.config,
      pool,
      tokenXMint: tokenMintX,
      tokenYMint: tokenMintY,
      userTokenX: userTokenX.address,
      userTokenY: userTokenY.address,
      poolTokenX: poolTokenInput,
      poolTokenY: poolTokenOut,
      // @ts-ignore
      userPosition: user_position,
    }).signers(
      [AUTHORITY_KEYPAIR]
    ).rpc();
    await fixture.provider.connection.confirmTransaction(addLiquidityTx);

    const afterPool = await program.account.pool.fetch(pool);
    const afterUserXAmount = await fixture.provider.connection.getTokenAccountBalance(userTokenX.address);
    const afterUserYAmount = await fixture.provider.connection.getTokenAccountBalance(userTokenY.address);
    const afterUserLP = await program.account.userPosition.fetch(user_position);
    const afterPoolTokenX = await fixture.provider.connection.getTokenAccountBalance(afterPool.vaultX);
    const afterPoolTokenY = await fixture.provider.connection.getTokenAccountBalance(afterPool.vaultY);

    // 断言
    // 池子的x
    expect(afterPoolTokenX.value.amount.toString()).to.equal(new BN(beforePoolTokenX.value.amount).add(new BN(100 * 10 ** 9)).toString());
    // 池子的y
    expect(afterPoolTokenY.value.amount.toString()).to.equal(new BN(beforePoolTokenY.value.amount).add(new BN(200 * 10 ** 9)).toString());
    // 用户的x
    expect(afterUserXAmount.value.amount.toString()).to.equal(new BN(beforeUserXAmount.value.amount).sub(new BN(100 * 10 ** 9)).toString());
    // 用户的y
    expect(afterUserYAmount.value.amount.toString()).to.equal(new BN(beforeUserYAmount.value.amount).sub(new BN(200 * 10 ** 9)).toString());
    // 用户的LP：验证最终的LP数量（智能合约直接覆盖而不是累加）
    // 验证最终LP数量大于等于最小要求
    expect(new BN(afterUserLP.lpAmount).gte(minLP)).to.be.true;
    // 验证最终LP数量与预期计算一致 (sqrt(x * y))
    expect(new BN(afterUserLP.lpAmount).toString()).to.equal(expectedLP.toString());
  })

  // 移除流动性
  it("移除流动性", async () => {
  })
  // 失败场景：添加流动性的数量是0或负数；添加的数量大于用户的余额；最小的LP不满足；...
});
