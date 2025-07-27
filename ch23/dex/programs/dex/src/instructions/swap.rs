use crate::constants::POOL_SEED;
use crate::error::ErrorCode;
use crate::instructions::shared::{calculate_out, check_not_paused};
use crate::state::{Config, Pool};
use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, TokenAccount, Token, Transfer, transfer};

#[derive(Accounts)]
pub struct Swap<'info> {
    /// 交易用户
    #[account(mut)]
    pub user: Signer<'info>,

    /// 配置账户
    #[account(mut)]
    pub config: Account<'info, Config>,

    /// 池子账户
    #[account(mut)]
    pub pool: Account<'info, Pool>,

    /// 输入的token的账户
    #[account(
      constraint = input_mint.key() == pool.token_x_mint.key() ||
        input_mint.key() == pool.token_y_mint.key()
       @ ErrorCode::InvalidTokenMint
    )]
    pub input_mint: Account<'info, Mint>,
    /// 输出的token的账户
    #[account(
      constraint = out_mint.key() == pool.token_x_mint.key() ||
      out_mint.key() == pool.token_y_mint.key()
       @ ErrorCode::InvalidTokenMint
    )]
    pub out_mint: Account<'info, Mint>,

    /// 输入的用户的token账户
    #[account(mut)]
    pub user_token_input: Account<'info, TokenAccount>,
    /// 输出的用户的token账户
    #[account(mut)]
    pub user_token_out: Account<'info, TokenAccount>,

    /// 输入的池子的token账户
    #[account(mut)]
    pub pool_token_input: Account<'info, TokenAccount>,
    /// 输出的池子的token账户
    #[account(mut)]
    pub pool_token_out: Account<'info, TokenAccount>,

    // TODO: 奖励的部分
    /// 协议收款账户
    /// CHECK: 通过约束验证treasury账户与config中的treasury匹配
    #[account(
        mut,
        constraint = treasury.key() == config.treasury @ ErrorCode::InvalidTreasury
    )]
    pub treasury: AccountInfo<'info>,

    #[account(mut,
      constraint = treasury_token_output.mint.key() == pool.token_y_mint.key()
        ||      
        treasury_token_output.owner.key() == config.treasury
       @ ErrorCode::InvalidTreasuryTokenAccount
    )]
    pub treasury_token_output: Account<'info, TokenAccount>,

    // 必须使用 token_program 才可以去操作SPL代币的转移
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

pub fn swap(
    ctx: Context<Swap>,
    // 1: 100
    // x * y = k
    // 输入的x代币数量，精准
    amount_in: u64,
    // 容忍的最小y代币数量，如果实际y代币数量小于这个值，则交易失败
    min_amount_out: u64,
) -> Result<()> {
    let config = &ctx.accounts.config;
    let pool = &mut ctx.accounts.pool;
    let user = &ctx.accounts.user;
    let user_token_input = &ctx.accounts.user_token_input;
    let user_token_out = &ctx.accounts.user_token_out;
    let pool_token_input = &ctx.accounts.pool_token_input;
    let pool_token_out = &ctx.accounts.pool_token_out;
    let treasury_token_output = &ctx.accounts.treasury_token_output;
    let token_program = &ctx.accounts.token_program;
    let input_mint = &ctx.accounts.input_mint;

    // 检查协议是否暂停
    check_not_paused(config)?;

    // 条件的检测
    // 检测输入
    if amount_in == 0 {
        return err!(ErrorCode::SwapInputInvalidAmount);
    }

    // 检测输出
    if min_amount_out == 0 {
        return err!(ErrorCode::SwapOutInvalidAmount);
    }

    // 检测是否存在足够的流动性
    if pool.total_lp_supply == 0 {
        return err!(ErrorCode::InsufficientBalance);
    }

    // 检查用户代币账户的余额是否足够
    if user_token_input.amount < amount_in {
        return err!(ErrorCode::InsufficientBalance);
    }

    // 恒定乘积算法
    let out = calculate_out(pool_token_input.amount, pool_token_out.amount, amount_in)?;

    // 计算手续费
    let total_fee = out * (config.swap_fee_rate as u64) / 10000;

    // 计算协议费
    let protocol_fee = total_fee * (config.protocol_fee_rate as u64) / 100;

    // 计算LP奖励
    let lp_reward = total_fee - protocol_fee;

    // 检查输出是否足够
    if out < min_amount_out {
        return err!(ErrorCode::InsufficientBalance);
    }

    // 检查池子代币账户的余额是否足够
    if pool_token_out.amount < out {
        return err!(ErrorCode::InsufficientBalance);
    }

    // 用户实际获得的代币数量
    let user_amount_out = out - total_fee;

    // 把用户的token转移到pool
    let cpi_program = token_program.to_account_info();
    let cpi_accounts_input = Transfer {
        from: user_token_input.to_account_info(),
        to: pool_token_input.to_account_info(),
        authority: user.to_account_info(),
    };
    let cpi_ctx_input = CpiContext::new(cpi_program, cpi_accounts_input);
    transfer(cpi_ctx_input, amount_in)?;

    // 把pool的user_amount_out转移到user上
    let pool_seeds = [
        POOL_SEED,
        pool.token_x_mint.as_ref(),
        pool.token_y_mint.as_ref(),
        &[pool.bump],
    ];
    let pool_signer_seeds = &[&pool_seeds[..]];
    
    let cpi_program = token_program.to_account_info();
    let cpi_accounts_output = Transfer {
        from: pool_token_out.to_account_info(),
        to: user_token_out.to_account_info(),
        authority: pool.to_account_info(),
    };
    let cpi_ctx_output = CpiContext::new_with_signer(cpi_program, cpi_accounts_output, pool_signer_seeds);
    transfer(cpi_ctx_output, user_amount_out)?;

    // 把protocol_fee转移到treasury
    let cpi_program = token_program.to_account_info();
    let cpi_accounts_protocol_fee = Transfer {
        from: pool_token_out.to_account_info(),
        to: treasury_token_output.to_account_info(),
        authority: pool.to_account_info(),
    };
    let cpi_ctx_protocol_fee = CpiContext::new_with_signer(cpi_program, cpi_accounts_protocol_fee, pool_signer_seeds);
    transfer(cpi_ctx_protocol_fee, protocol_fee)?;

    // 要判断 amount_in 是 x 还是 y
    if input_mint.key() == pool.token_x_mint.key() {
        pool.y_reward_amount += lp_reward as u128;
    } else {
        pool.x_reward_amount += lp_reward as u128;
    }

    msg!("交换代币成功，输入={}，实际输出={}，协议费={}，LP奖励={}",
        amount_in,
        user_amount_out,
        protocol_fee,
        lp_reward
    );

    Ok(())
}
