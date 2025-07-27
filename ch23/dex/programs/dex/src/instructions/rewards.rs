use anchor_lang::prelude::*;
use anchor_spl::token::{TokenAccount, Token, Transfer, transfer};
use crate::state::{Pool, UserPosition};
use crate::constants::POOL_SEED;

#[derive(Accounts)]
pub struct ClaimRewards<'info> {
  #[account(mut)]
  pub user: Signer<'info>,

  #[account(mut)]
  pub pool: Account<'info, Pool>,

  #[account(mut)]
  pub user_position: Account<'info, UserPosition>,

  #[account(mut)]
  pub user_token_x: Account<'info, TokenAccount>,

  #[account(mut)]
  pub user_token_y: Account<'info, TokenAccount>,

  #[account(mut)]
  pub pool_token_x: Account<'info, TokenAccount>,
  #[account(mut)]
  pub pool_token_y: Account<'info, TokenAccount>,

  pub token_program: Program<'info, Token>,
  pub system_program: Program<'info, System>,
}

pub fn claim_rewards(
  ctx: Context<ClaimRewards>
) -> Result<()> {
  // 计算用户应该获得的奖励
  let user_position = &mut ctx.accounts.user_position;
  let pool = &ctx.accounts.pool;
  let token_program = &ctx.accounts.token_program;

  // 计算待领取的x和y
  let (pending_reward_x, pending_reward_y) = user_position.calculate_pending_rewards(pool)?;

  msg!("用户{}待领取的x奖励={}, y奖励={}", user_position.owner, pending_reward_x, pending_reward_y);

  // 把pool的x token转移到user x token
  let cpi_program = token_program.to_account_info();

  let pool_seeds = [
      POOL_SEED,
      pool.token_x_mint.as_ref(),
      pool.token_y_mint.as_ref(),
      &[pool.bump],
  ];
  let pool_signer_seeds = &[&pool_seeds[..]];

  let cpi_accounts_x = Transfer {
      from: ctx.accounts.pool_token_x.to_account_info(),
      to: ctx.accounts.user_token_x.to_account_info(),
      authority: pool.to_account_info(),
  };
  let cpi_ctx_x = CpiContext::new_with_signer(cpi_program.clone(), cpi_accounts_x, pool_signer_seeds);
  transfer(cpi_ctx_x, pending_reward_x)?;

  // 把pool的user_amount_out转移到user上  
  let cpi_program = token_program.to_account_info();

  let pool_seeds = [
      POOL_SEED,
      pool.token_x_mint.as_ref(),
      pool.token_y_mint.as_ref(),
      &[pool.bump],
  ];
  let pool_signer_seeds = &[&pool_seeds[..]];

  let cpi_accounts_y = Transfer {
      from: ctx.accounts.pool_token_y.to_account_info(),
      to: ctx.accounts.user_token_y.to_account_info(),
      authority: pool.to_account_info(),
  };
  let cpi_ctx_y = CpiContext::new_with_signer(cpi_program, cpi_accounts_y, pool_signer_seeds);
  transfer(cpi_ctx_y, pending_reward_y)?;

  user_position.last_x_reward_amount = pool.x_reward_amount;
  user_position.last_y_reward_amount = pool.y_reward_amount;
  user_position.pending_x_reward_amount = 0;
  user_position.pending_y_reward_amount = 0;
  Ok(())
}