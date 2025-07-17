use anchor_lang::prelude::*;

#[error_code]
pub enum ErrorCode {
    #[msg("交易费超过最大允许范围")]
    SwapFeeRateTooHigh,

    #[msg("协议费超过最大允许范围")]
    ProtocalFeeRateTooHigh,

    #[msg("无权限操作")]
    Unauthorized,

    #[msg("协议已暂停")]
    IsPaused,

    #[msg("代币 mint 地址无效")]
    InvalidMint,

    #[msg("代币数量无效")]
    InvalidAmount,

    #[msg("余额不足")]
    InsufficientBalance,

    #[msg("交换时输入代币数量无效")]
    SwapInputInvalidAmount,

    #[msg("交换时输出代币数量无效")]
    SwapOutInvalidAmount,

    #[msg("无效的TokenMint")]
    InvalidTokenMint,

    #[msg("精度溢出")]
    Overflow,
}
