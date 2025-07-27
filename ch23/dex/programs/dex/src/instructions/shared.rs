use crate::error::ErrorCode;
use crate::state::Config;
use anchor_lang::prelude::*;

pub fn check_not_paused(config: &Account<Config>) -> Result<()> {
    if config.is_paused {
        return err!(ErrorCode::IsPaused);
    }
    Ok(())
}

// 根据 x 和 y 计算 lp amount
pub fn calculate_lp_amount(x_amount: u64, y_amount: u64) -> Result<u64> {
    // 计算公式：sqrt(x * y)
    let product = x_amount as u128 * y_amount as u128;
    let sqrt = (product as f64).sqrt() as u64;
    Ok(sqrt)
}

// 根据 lp 计算 x 和 y
pub fn calculate_token_amount(
    lp_amount: u64,
    total_lp_supply: u64,
    x_amount: u64,
    y_amount: u64,
) -> Result<(u64, u64)> {
    // 根据 lp 占比，计算 x 和 y
    let rate = (lp_amount * 100) / (total_lp_supply * 100);
    let x = rate * x_amount / 100;
    let y = rate * y_amount / 100;
    Ok((x, y))
}

// 根据恒定乘积计算 out
pub fn calculate_out(current_x: u64, current_y: u64, input_amount: u64) -> Result<u64> {
    // x * y = k;
    let current_x_u128 = current_x as u128;
    let current_y_u128 = current_y as u128;
    let k = current_x_u128
        .checked_mul(current_y_u128)
        .ok_or(ErrorCode::Overflow)?;

    // 先去计算新的x
    let new_x = (current_x
        .checked_add(input_amount)
        .ok_or(ErrorCode::Overflow)?) as u128;

    // 再计算新的y
    let new_y = k.checked_div(new_x).ok_or(ErrorCode::Overflow)?;

    // 兑换的y
    let out = current_y_u128
        .checked_sub(new_y)
        .ok_or(ErrorCode::Overflow)?;

    Ok(out as u64)
}
