use crate::constants::USER_POSITION_SEED;
use crate::error::ErrorCode;
use crate::instructions::shared::{calculate_lp_amount, calculate_token_amount, check_not_paused};
use crate::state::{Config, Pool, UserPosition};
use anchor_lang::prelude::*;
use anchor_spl::token::{transfer, Mint, Token, TokenAccount, Transfer};

#[derive(Accounts)]
pub struct AddLiquidity<'info> {
    /// 用户
    #[account(mut)]
    pub user: Signer<'info>,

    /// 配置账户
    #[account(mut)]
    pub config: Account<'info, Config>,

    /// 池子账户
    #[account(mut)]
    pub pool: Account<'info, Pool>,

    /// token x的mint账户
    #[account()]
    pub token_x_mint: Account<'info, Mint>,
    /// token y的mint账户
    #[account()]
    pub token_y_mint: Account<'info, Mint>,

    /// 用户的token x账户
    #[account(mut)]
    pub user_token_x: Account<'info, TokenAccount>,
    /// 用户的token y账户
    #[account(mut)]
    pub user_token_y: Account<'info, TokenAccount>,

    /// 池子的token x账户
    #[account(mut)]
    pub pool_token_x: Account<'info, TokenAccount>,
    /// 池子的token y账户
    #[account(mut)]
    pub pool_token_y: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        space = UserPosition::SIZE,
        seeds = [
            USER_POSITION_SEED,
            pool.key().as_ref(),
            user.key().as_ref(),
        ],
        bump
    )]
    pub user_position: Account<'info, UserPosition>,

    // 必须使用 token_program 才可以去操作SPL代币的转移
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// 添加流动性
pub fn add_liquidity(
    ctx: Context<AddLiquidity>,
    amount_x: u64,      // 用户输入的x代币数量
    amount_y: u64,      // 用户输入的y代币数量
    min_lp_amount: u64, // 用户接受最小的LP数量
) -> Result<()> {
    let config = &ctx.accounts.config;
    let pool = &mut ctx.accounts.pool;
    let user = &ctx.accounts.user;
    let user_token_x = &ctx.accounts.user_token_x;
    let user_token_y = &ctx.accounts.user_token_y;
    let pool_token_x = &ctx.accounts.pool_token_x;
    let pool_token_y = &ctx.accounts.pool_token_y;
    let user_position = &mut ctx.accounts.user_position;
    let token_program = &ctx.accounts.token_program;

    // 检查协议是否暂停
    check_not_paused(config)?;

    // 条件判断
    // x和y不能为 0
    if amount_x == 0 || amount_y == 0 {
        return err!(ErrorCode::InvalidAmount);
    }

    // 用户的x账户不可以少于 amount_x
    // 用户的y账户不可以少于 amount_y
    if user_token_x.amount < amount_x {
        return err!(ErrorCode::InsufficientBalance);
    }
    if user_token_y.amount < amount_y {
        return err!(ErrorCode::InsufficientBalance);
    }

    // min_lp_amount 不能为 0
    if min_lp_amount == 0 {
        return err!(ErrorCode::InvalidAmount);
    }

    // 计算 x y 的比例，使用简化版本避免溢出
    // 先将数值缩小到合理范围再进行比较
    let pool_x_scaled = pool_token_x.amount / 1_000_000;  // 缩小到百万级别
    let pool_y_scaled = pool_token_y.amount / 1_000_000;
    let amount_x_scaled = amount_x / 1_000_000;
    let amount_y_scaled = amount_y / 1_000_000;
    
    // 确保缩放后的值不为0
    if pool_x_scaled == 0 || pool_y_scaled == 0 || amount_x_scaled == 0 || amount_y_scaled == 0 {
        return err!(ErrorCode::InvalidAmount);
    }
    
    // 使用交叉乘法比较 pool_x/pool_y 与 amount_x/amount_y 的比例
    let pool_cross = pool_x_scaled * amount_y_scaled;
    let user_cross = pool_y_scaled * amount_x_scaled;
    
    // 计算比例差距 (允许 5% 的误差)
    let tolerance = 5; // 5%
    let diff_percent = if pool_cross > user_cross {
        ((pool_cross - user_cross) * 100) / user_cross
    } else {
        ((user_cross - pool_cross) * 100) / pool_cross
    };
    
    // 如果差距超过允许的误差范围，则拒绝交易
    if diff_percent > tolerance {
        return err!(ErrorCode::InvalidAmount);
    }

    // 计算 LP 数量
    let lp_amount = calculate_lp_amount(amount_x, amount_y)?;

    // 实际 lp 不能小于 min_lp_amount
    if lp_amount < min_lp_amount {
        return err!(ErrorCode::InsufficientOutputAmount);
    }

    // 然后将 user 的 x 转移到 pool 的 x
    let cpi_program = token_program.to_account_info();
    let cpi_accounts_x = Transfer {
        from: user_token_x.to_account_info(),
        to: pool_token_x.to_account_info(),
        authority: user.to_account_info(),
    };
    let cpi_ctx_x = CpiContext::new(cpi_program, cpi_accounts_x);
    transfer(cpi_ctx_x, amount_x)?;

    // 将 user 的 y 转移到 pool 的 y
    let cpi_program = token_program.to_account_info();
    let cpi_accounts_y = Transfer {
        from: user_token_y.to_account_info(),
        to: pool_token_y.to_account_info(),
        authority: user.to_account_info(),
    };
    let cpi_ctx_y = CpiContext::new(cpi_program, cpi_accounts_y);
    transfer(cpi_ctx_y, amount_y)?;

    // 将 LP 记录到用户账户
    user_position.lp_amount = lp_amount;
    user_position.pool = pool.key();
    user_position.owner = user.key();
    // 计算用户应该获得的奖励
    // 用户LP百分比 = 用户LP / 总LP
    // 公式 = 当前总奖励 - 用户上一次领取奖励的累计值 * 用户LP百分比
    let user_lp_percent = user_position.lp_amount as f64 / pool.total_lp_supply as f64;
    let reward_x = (pool.x_reward_amount - user_position.last_x_reward_amount) as f64 * user_lp_percent;
    let reward_y = (pool.y_reward_amount - user_position.last_y_reward_amount) as f64 * user_lp_percent;
    user_position.pending_x_reward_amount = reward_x as u128;
    user_position.pending_y_reward_amount = reward_y as u128;

    // 当前的所有奖池累计值
    user_position.last_x_reward_amount = pool.x_reward_amount;
    user_position.last_y_reward_amount = pool.y_reward_amount;
    user_position.bump = ctx.bumps.user_position;

    msg!(
        "添加流动性成功，x={}, y={}, lp={}",
        amount_x,
        amount_y,
        lp_amount
    );

    Ok(())
}

#[derive(Accounts)]
pub struct RemoveLiquidity<'info> {
    /// 用户
    #[account(mut)]
    pub user: Signer<'info>,

    /// 配置账户
    #[account(mut)]
    pub config: Account<'info, Config>,

    /// 池子账户
    #[account(mut)]
    pub pool: Account<'info, Pool>,

    /// token x的mint账户
    #[account()]
    pub token_x_mint: Account<'info, Mint>,
    /// token y的mint账户
    #[account()]
    pub token_y_mint: Account<'info, Mint>,

    /// 用户的token x账户
    #[account(mut)]
    pub user_token_x: Account<'info, TokenAccount>,
    /// 用户的token y账户
    #[account(mut)]
    pub user_token_y: Account<'info, TokenAccount>,

    /// 池子的token x账户
    #[account(mut)]
    pub pool_token_x: Account<'info, TokenAccount>,
    /// 池子的token y账户
    #[account(mut)]
    pub pool_token_y: Account<'info, TokenAccount>,

    #[account(
        init_if_needed,
        payer = user,
        space = UserPosition::SIZE,
        seeds = [
            USER_POSITION_SEED,
            pool.key().as_ref(),
            user.key().as_ref(),
        ],
        bump
    )]
    pub user_position: Account<'info, UserPosition>,

    // 必须使用 token_program 才可以去操作SPL代币的转移
    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

// 移除流动性
pub fn remove_liquidity(
    ctx: Context<RemoveLiquidity>,
    lp_amount: u64,    // 用户输入的LP数量
    min_amount_x: u64, // 用户接受最小的x代币数量
    min_amount_y: u64, // 用户接受最小的y代币数量
) -> Result<()> {
    let config = &ctx.accounts.config;
    let pool = &mut ctx.accounts.pool;
    let _user = &ctx.accounts.user;
    let user_token_x = &ctx.accounts.user_token_x;
    let user_token_y = &ctx.accounts.user_token_y;
    let pool_token_x = &ctx.accounts.pool_token_x;
    let pool_token_y = &ctx.accounts.pool_token_y;
    let user_position = &mut ctx.accounts.user_position;
    let token_program = &ctx.accounts.token_program;

    // 检查协议是否暂停
    check_not_paused(config)?;

    // 条件判断
    // lp不能为 0
    if lp_amount == 0 {
        return err!(ErrorCode::InvalidAmount);
    }

    // user账户的lp不可以少于lp_amount
    if user_position.lp_amount < lp_amount {
        return err!(ErrorCode::InsufficientBalance);
    }

    // min_amount_x 不能为 0
    if min_amount_x == 0 {
        return err!(ErrorCode::InvalidAmount);
    }

    // min_amount_y 不能为 0
    if min_amount_y == 0 {
        return err!(ErrorCode::InvalidAmount);
    }

    // 计算 LP 数量
    let (amount_x, amount_y) = calculate_token_amount(
        lp_amount,
        pool.total_lp_supply,
        pool_token_x.amount,
        pool_token_y.amount,
    )?;

    // pool的x不能少于amount_x
    if pool_token_x.amount < amount_x {
        return err!(ErrorCode::InsufficientOutputAmount);
    }
    // pool的y不能少于amount_y
    if pool_token_y.amount < amount_y {
        return err!(ErrorCode::InsufficientOutputAmount);
    }

    // 然后将 pool 的 x 转移到 user 的 x
    let cpi_program = token_program.to_account_info();
    let cpi_accounts_x = Transfer {
        from: pool_token_x.to_account_info(),
        to: user_token_x.to_account_info(),
        authority: pool.to_account_info(),
    };
    let cpi_ctx_x = CpiContext::new(cpi_program, cpi_accounts_x);
    transfer(cpi_ctx_x, amount_x)?;

    // 将 pool 的 y 转移到 user 的 y
    let cpi_program = token_program.to_account_info();
    let cpi_accounts_y = Transfer {
        from: pool_token_y.to_account_info(),
        to: user_token_y.to_account_info(),
        authority: pool.to_account_info(),
    };
    let cpi_ctx_y = CpiContext::new(cpi_program, cpi_accounts_y);
    transfer(cpi_ctx_y, amount_y)?;

    // 将 LP 销毁
    user_position.lp_amount -= lp_amount;

    // 计算用户应该获得的奖励
    // 用户LP百分比 = 用户LP / 总LP
    // 公式 = 当前总奖励 - 用户上一次领取奖励的累计值 * 用户LP百分比
    let user_lp_percent = user_position.lp_amount as f64 / pool.total_lp_supply as f64;
    let reward_x = (pool.x_reward_amount - user_position.last_x_reward_amount) as f64 * user_lp_percent;
    let reward_y = (pool.y_reward_amount - user_position.last_y_reward_amount) as f64 * user_lp_percent;
    user_position.pending_x_reward_amount = reward_x as u128;
    user_position.pending_y_reward_amount = reward_y as u128;

    // 当前的所有奖池累计值
    user_position.last_x_reward_amount = pool.x_reward_amount;
    user_position.last_y_reward_amount = pool.y_reward_amount;
    user_position.bump = ctx.bumps.user_position;

    msg!(
        "移除流动性成功，x={}, y={}, lp={}",
        amount_x,
        amount_y,
        lp_amount
    );

    Ok(())
}
