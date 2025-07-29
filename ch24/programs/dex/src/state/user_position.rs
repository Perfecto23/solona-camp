use crate::constants::*;
use crate::state::Pool;
use anchor_lang::prelude::*;

/// 用户在池子中提供 LP 的仓位
#[account]
pub struct UserPosition {
    /// 池子的地址
    pub pool: Pubkey,

    /// 用户的地址
    pub owner: Pubkey,

    /// lp 数量
    pub lp_amount: u64,

    /// 用户上次领取x奖励的累计值
    pub last_x_reward_amount: u128,

    /// 用户上次领取y奖励的累计值
    pub last_y_reward_amount: u128,

    /// 用户当前待领取的x奖励
    pub pending_x_reward_amount: u128,

    /// 用户当前待领取的y奖励
    pub pending_y_reward_amount: u128,

    /// PDA 种子
    pub bump: u8,
}

impl UserPosition {
    pub const SIZE: usize = DISCRIMINATOR_SIZE +
  32+ // pool
  32+ // owenr
  8+ // lp amount
  16+ // last x reward amount
  16+ // last y reward amount
  16+ // pending x reward amount
  16+ // pending y reward amount
  1 // bump 
  ;

    pub fn calculate_pending_rewards(&self, pool: &Pool) -> Result<(u64, u64)> {
        if self.lp_amount == 0 {
            return Ok((self.pending_x_reward_amount as u64, self.pending_y_reward_amount as u64));
        }

        let user_lp_percent = self.lp_amount as f64 / pool.total_lp_supply as f64;
        let reward_x = (pool.x_reward_amount - self.last_x_reward_amount) as f64 * user_lp_percent
            + self.pending_x_reward_amount as f64;
        let reward_y = (pool.y_reward_amount - self.last_y_reward_amount) as f64 * user_lp_percent
            + self.pending_y_reward_amount as f64;

        return Ok((reward_x as u64, reward_y as u64));
    }
}

// 用户A 在池子XY中提供了10X和20Y，假设获得了1000个LP。
// 此时所有人的交易，手续费全部归属于用户A。
// 累计1000Y

// 用户B 在池子XY中提供了100X和200Y，假设获得了9000个LP。
// 此时用户A和用户B瓜分手续费。其中用户A大约会获得10%，用户B大约会获得90%。
// 累计10000Y
// 用户A从0开始计算奖励，所以 10000Y 的10%=1000Y
// 用户B从1000Y开始计算奖励，所以 10000Y-1000Y=9000Y 90%=8100Y
// 剩余的900Y归属于池子。

// 累计10000LP
// 用户B移除了5000LP，它可以分到 9000Y * 50% = 4500Y

// 当LP发生变化时，需要处理奖励
// 当用户添加流动性时，需要从添加流动性那一刻开始计算奖励。
// 当用户移除流动性时，需要计算移除前的LP和移除后的LP之间的差值，并根据差值计算奖励。
