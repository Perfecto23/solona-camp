use crate::constants::CONFIG_SEED;
use crate::error::ErrorCode;
use crate::state::Config;
use anchor_lang::prelude::*;

fn validate_config_params(swap_fee_rate: u16, protocol_fee_rate: u16) -> Result<()> {
    // 交易费最大允许 10%
    if swap_fee_rate > 1000 {
        return err!(ErrorCode::SwapFeeRateTooHigh);
    }

    // 协议费最大允许 50%
    if protocol_fee_rate > 5000 {
        return err!(ErrorCode::ProtocalFeeRateTooHigh);
    }

    Ok(())
}

#[derive(Accounts)]
pub struct InitializeConfig<'info> {
    #[account(mut)]
    pub payer: Signer<'info>,

    pub authority: Signer<'info>,

    /// CHECK: 这是协议费的收款账户
    pub treasury: AccountInfo<'info>,

    // 手续费 0.3% 万分比
    // 协议费 20%
    // 协议费收款账户 Pubkey
    // 管理员 Pubkey
    // 是否暂停
    #[account(
        init,
        payer = payer,
        space = Config::SIZE,
        seeds = [CONFIG_SEED],
        bump
    )]
    pub config: Account<'info, Config>,

    pub system_program: Program<'info, System>,
}

pub fn initialize_config(
    ctx: Context<InitializeConfig>,
    swap_fee_rate: u16,
    protocol_fee_rate: u16,
) -> Result<()> {
    // 检查参数的合理性
    let _ = validate_config_params(swap_fee_rate, protocol_fee_rate);

    let config = &mut ctx.accounts.config;
    let authority = ctx.accounts.authority.key();
    let treasury = ctx.accounts.treasury.key();

    config.swap_fee_rate = swap_fee_rate;
    config.protocol_fee_rate = protocol_fee_rate;
    config.authority = authority;
    config.treasury = treasury;
    config.is_paused = false;
    config.bump = ctx.bumps.config;

    msg!(
        "初始化配置成功！交易费率：{}，协议费率：{}，管理员：{}，协议费收款账户：{}",
        swap_fee_rate,
        protocol_fee_rate,
        authority,
        treasury
    );
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateBasicConfig<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        // 条件约束
        constraint = authority.key() == config.authority @ ErrorCode::Unauthorized
    )]
    pub config: Account<'info, Config>,
}

pub fn update_config_basic(
    ctx: Context<UpdateBasicConfig>,
    swap_fee_rate: u16,
    protocol_fee_rate: u16,
    is_paused: bool,
) -> Result<()> {
    // 检查参数的合理性
    let _ = validate_config_params(swap_fee_rate, protocol_fee_rate);

    let config = &mut ctx.accounts.config;

    config.swap_fee_rate = swap_fee_rate;
    config.protocol_fee_rate = protocol_fee_rate;

    msg!(
        "修改基础配置成功！交易费率：{}，协议费率：{}，是否暂停：{}",
        swap_fee_rate,
        protocol_fee_rate,
        is_paused
    );
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateTreasury<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    /// CHECK: 这是协议费的收款账户
    pub new_treasury: AccountInfo<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        // 条件约束
        constraint = authority.key() == config.authority @ ErrorCode::Unauthorized
    )]
    pub config: Account<'info, Config>,
}

pub fn update_treasury(ctx: Context<UpdateTreasury>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let new_treasury = ctx.accounts.new_treasury.key(); 
    config.treasury = new_treasury;

    msg!(
        "修改协议费收款账户成功！新的收款账户：{}",
        new_treasury
    );
    Ok(())
}

#[derive(Accounts)]
pub struct UpdateAuthority<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    pub new_authority: Signer<'info>,

    #[account(
        mut,
        seeds = [CONFIG_SEED],
        bump = config.bump,
        // 条件约束
        constraint = authority.key() == config.authority @ ErrorCode::Unauthorized
    )]
    pub config: Account<'info, Config>,
}

pub fn update_authority(ctx: Context<UpdateAuthority>) -> Result<()> {
    let config = &mut ctx.accounts.config;
    let new_authority = ctx.accounts.new_authority.key(); 
    config.authority = new_authority;

    msg!(
        "修改管理员成功！新的管理员账户：{}",
        new_authority
    );
    Ok(())
}
