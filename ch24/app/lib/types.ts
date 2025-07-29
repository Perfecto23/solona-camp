export interface Token {
  id: string
  name: string
  symbol: string
  price: number
  balance: number
  change24h: number
  mintAddress: string // 添加mint地址属性
}

export interface Pool {
  token1: Token
  token2: Token
  tvl: number
  volume24h: number
  apr: number
  feeTier: number
}
