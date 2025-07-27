pub mod constants;
pub mod error;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use constants::*;
pub use instructions::*;
pub use state::*;

declare_id!("tWQpMAbcKA875EGo12a3iYw3f2cTTx5Yb5tmXSB4vGM");

#[program]
pub mod dex {
    use super::*;

    pub fn initialize_config(
        ctx: Context<InitializeConfig>,
        swap_fee_rate: u16,
        protocol_fee_rate: u16,
    ) -> Result<()> {
        instructions::config::initialize_config(ctx, swap_fee_rate, protocol_fee_rate)
    }

    pub fn update_config_basic(
        ctx: Context<UpdateBasicConfig>,
        swap_fee_rate: u16,
        protocol_fee_rate: u16,
        is_paused: bool,
    ) -> Result<()> {
        instructions::config::update_config_basic(ctx, swap_fee_rate, protocol_fee_rate, is_paused)
    }

    pub fn update_treasury(ctx: Context<UpdateTreasury>) -> Result<()> {
        instructions::config::update_treasury(ctx)
    }

    pub fn update_authority(ctx: Context<UpdateAuthority>) -> Result<()> {
        instructions::config::update_authority(ctx)
    }

    pub fn initialize_pool(
        ctx: Context<InitializePool>,
        initial_amount_x: u64,
        initial_amount_y: u64,
    ) -> Result<()> {
        instructions::pool::initialize_pool(ctx, initial_amount_x, initial_amount_y)
    }

    pub fn swap(ctx: Context<Swap>, amount_in: u64, min_amount_out: u64) -> Result<()> {
        instructions::swap::swap(ctx, amount_in, min_amount_out)
    }

    pub fn add_liquidity(
        ctx: Context<AddLiquidity>,
        amount_x: u64,
        amount_y: u64,
        min_lp_amount: u64,
    ) -> Result<()> {
        instructions::liquidity::add_liquidity(ctx, amount_x, amount_y, min_lp_amount)
    }

    pub fn remove_liquidity(
        ctx: Context<RemoveLiquidity>,
        lp_amount: u64,
        min_amount_x: u64,
        min_amount_y: u64,
    ) -> Result<()> {
        instructions::liquidity::remove_liquidity(ctx, lp_amount, min_amount_x, min_amount_y)
    }

    pub fn claim_rewards(
        ctx: Context<ClaimRewards>
      ) -> Result<()> {
        instructions::rewards::claim_rewards(ctx)
      }
}
