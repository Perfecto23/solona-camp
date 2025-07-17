use crate::constants::{CONFIG_SEED, POOL_SEED, VAULT_SEED, USER_POSITION_SEED};
use crate::error::ErrorCode;
use crate::instructions::shared::*;
use crate::state::{Config, Pool, UserPosition};
use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Mint, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct InitializePool<'info> {
    /// 池子的创建者
    #[account(mut)]
    pub payer: Signer<'info>,

    /// 配置账户
    #[account(
        seeds = [CONFIG_SEED],
        bump = config.bump,
    )]
    pub config: Account<'info, Config>,

    /// 池子账户
    #[account(
        init,
        payer = payer,
        space = Pool::SIZE,
        seeds = [
            POOL_SEED,
            token_x_mint.key().as_ref(),
            token_y_mint.key().as_ref(),
        ],
        bump
    )]
    pub pool: Account<'info, Pool>,

    pub token_x_mint: Account<'info, Mint>,
    pub token_y_mint: Account<'info, Mint>,

    #[account(
        init,
        payer = payer,
        seeds = [
            VAULT_SEED,
            pool.key().as_ref(),
            token_x_mint.key().as_ref(),
        ],
        bump,
        token::mint = token_x_mint,
        token::authority = pool,
    )]
    pub vault_x: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = payer,
        seeds = [
            VAULT_SEED,
            pool.key().as_ref(),
            token_y_mint.key().as_ref(),
        ],
        bump,
        token::mint = token_y_mint,
        token::authority = pool,
    )]
    pub vault_y: Account<'info, TokenAccount>,

    #[account(mut)]
    pub user_token_x: Account<'info, TokenAccount>,
    #[account(mut)]
    pub user_token_y: Account<'info, TokenAccount>,

    #[account(
        init,
        payer = payer,
        space = UserPosition::SIZE,
        seeds = [
            USER_POSITION_SEED,
            pool.key().as_ref(),
            payer.key().as_ref(),
        ],
        bump
    )]
    pub user_position: Account<'info, UserPosition>,

    pub system_program: Program<'info, System>,
    pub token_program: Program<'info, Token>,
}

// 初始化流动性池：
// 支持代币 x 和代币 y 的兑换
// 池子中 x 的数量
// 池子中 y 的数量
// 兑换公式，恒定乘积 x * y = k
// k 恒定值

pub fn initialize_pool(
    ctx: Context<InitializePool>,
    initial_amount_x: u64,
    initial_amount_y: u64,
) -> Result<()> {
    let config = &ctx.accounts.config;
    let token_x_mint = &ctx.accounts.token_x_mint;
    let token_y_mint = &ctx.accounts.token_y_mint;
    let user_token_x = &ctx.accounts.user_token_x;
    let user_token_y = &ctx.accounts.user_token_y;
    let pool = &mut ctx.accounts.pool;
    let vault_x = &mut ctx.accounts.vault_x;
    let vault_y = &mut ctx.accounts.vault_y;
    let token_program = &ctx.accounts.token_program;
    let user_position = &mut ctx.accounts.user_position;
    let payer = &ctx.accounts.payer;
    // 检查协议是否暂停
    check_not_paused(config)?;

    // 检查代币 x 和代币 y 的 mint 地址是否相同
    if token_x_mint.key() == token_y_mint.key() {
        return err!(ErrorCode::InvalidMint);
    }

    // 检查代币 x 和代币 y 的初始数量是否大于 0
    if initial_amount_x == 0 || initial_amount_y == 0 {
        return err!(ErrorCode::InvalidAmount);
    }

    // 检查用户的余额是否足够，大于初始化的流动性
    if user_token_x.amount < initial_amount_x {
        return err!(ErrorCode::InsufficientBalance);
    }

    if user_token_y.amount < initial_amount_y {
        return err!(ErrorCode::InsufficientBalance);
    }

    // 初始化池子账户
    pool.token_x_mint = token_x_mint.key();
    pool.token_y_mint = token_y_mint.key();
    pool.vault_x = vault_x.key();
    pool.vault_y = vault_y.key();
    pool.total_lp_supply = 0;
    pool.bump = ctx.bumps.pool;

    // 将用户的 x 转移到池子的 vault 的 x 代币账户
    let cpi_program = token_program.to_account_info();
    let cpi_accounts_x = Transfer {
        from: user_token_x.to_account_info(),
        to: vault_x.to_account_info(),
        authority: ctx.accounts.payer.to_account_info(),
    };
    let cpi_ctx_x = CpiContext::new(cpi_program, cpi_accounts_x);
    transfer(cpi_ctx_x, initial_amount_x)?;

    // 将用户的 y 转移到池子的 vault 的 y 代币账户
    let cpi_program = token_program.to_account_info();
    let cpi_accounts_y = Transfer {
        from: user_token_y.to_account_info(),
        to: vault_y.to_account_info(),
        authority: ctx.accounts.payer.to_account_info(),
    };
    let cpi_ctx_y = CpiContext::new(cpi_program, cpi_accounts_y);
    transfer(cpi_ctx_y, initial_amount_y)?;

    // 初始化用户的 lp
    let lp_amount = calculate_lp_amount(initial_amount_x, initial_amount_y)?;
    user_position.pool = pool.key();
    user_position.owner = payer.key();
    user_position.lp_amount = lp_amount;
    user_position.bump = ctx.bumps.user_position;

    pool.total_lp_supply = lp_amount;

    msg!(
        "流动性池初始化完成，池子地址：{}，初始代币 x 数量：{}，初始代币 y 数量：{}",
        pool.key(),
        initial_amount_x,
        initial_amount_y
    );

    Ok(())
}
