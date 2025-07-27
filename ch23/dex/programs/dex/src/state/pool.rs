use crate::constants::DISCRIMINATOR_SIZE;
use anchor_lang::prelude::*;

#[account]
pub struct Pool {
    /// 第一个代币的 mint 地址
    pub token_x_mint: Pubkey,
    /// 第二个代币的 mint 地址
    pub token_y_mint: Pubkey,
    /// 池子的第一个代币的持币地址
    pub vault_x: Pubkey,
    /// 池子的第二个代币的持币地址
    pub vault_y: Pubkey,
    /// 池子的LP总量
    pub total_lp_supply: u64,
    // 每次产生收益，更新x_reward_amount和y_reward_amount
    // 怎么产生收益？swap
    /// x奖励的累计值
    pub x_reward_amount: u128,
    /// y奖励的累计值
    pub y_reward_amount: u128,
    /// 随机数
    pub bump: u8,
}

impl Pool {
    /// 账户大小
    pub const SIZE: usize = DISCRIMINATOR_SIZE+
        32+ // token_x_mint
        32+ // token_y_mint
        32+// vault_x
        32+// vault_y
        8+// total_lp_amount
        16+ // x_reward_amount
        16+ // y_reward_amount
        1; // bump
}
