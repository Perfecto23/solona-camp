use anchor_lang::prelude::*;

#[constant]
pub const CONFIG_SEED: &[u8] = b"config";
#[constant]
pub const POOL_SEED: &[u8] = b"pool";
#[constant]
pub const VAULT_SEED: &[u8] = b"vault";
#[constant]
pub const USER_POSITION_SEED: &[u8] = b"user_position";

pub const DISCRIMINATOR_SIZE: usize = 8;