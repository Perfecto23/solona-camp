use crate::constants::DISCRIMINATOR_SIZE;
use anchor_lang::prelude::*;

#[account]
pub struct Config {
    /// 管理员账户地址
    pub authority: Pubkey,
    /// 协议费收款账户地址
    pub treasury: Pubkey,
    /// 手续费率 万分比
    pub swap_fee_rate: u16,
    /// 协议费率 百分比
    pub protocol_fee_rate: u16,
    /// 是否暂停
    pub is_paused: bool,
    /// 随机数
    pub bump: u8,
}

impl Config {
    /// 账户大小
    pub const SIZE: usize = DISCRIMINATOR_SIZE+
     32+ // authority
  32+ // treasury
  2+// swap_fee_rate
  2+// protocol_fee_rate
  1+// is_paused
  1; // bump
}
