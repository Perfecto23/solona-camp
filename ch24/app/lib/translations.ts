export type Language = "en" | "zh"

export type TranslationKey =
  | "swap"
  | "liquidity"
  | "connectWallet"
  | "yourPositions"
  | "allPools"
  | "createPool"
  | "add"
  | "remove"
  | "poolStatistics"
  | "volume"
  | "tvl"
  | "fees"
  | "price"
  | "liquidityProviders"
  | "poolShare"
  | "currentRate"
  | "apr"
  | "networkFee"
  | "addLiquidity"
  | "removeLiquidity"
  | "claimFees"
  | "selectPosition"
  | "noMorePositions"
  | "token1"
  | "token2"
  | "balance"
  | "selectToken"
  | "searchTokens"
  | "noTokensFound"
  | "step1"
  | "step2"
  | "step3"
  | "selectTokens"
  | "setAmounts"
  | "confirmCreation"
  | "cancel"
  | "next"
  | "back"
  | "creating"
  | "createPoolTitle"
  | "createPoolDescription"
  | "firstToken"
  | "secondToken"
  | "feeTier"
  | "stablePairs"
  | "standardPairs"
  | "volatilePairs"
  | "initialLiquidity"
  | "estimatedApr"
  | "youWillDeposit"
  | "createPoolInfo"
  | "createPool"
  | "cannotSelectSameToken"
  | "pairAlreadyExists"
  | "h24Volume"
  | "h24Fees"
  | "h24Change"
  | "w7dChange"
  | "yourLiquidity"
  | "yourShare"
  | "unclaimedFees"
  | "yourPooledTokens"
  | "poolUtilization"
  | "utilized"
  | "healthy"
  | "refreshRates"
  | "settings"
  | "swapSettings"
  | "liquiditySettings"
  | "tradingPair"
  | "rate"
  | "priceImpact"
  | "slippageTolerance"
  | "youPay"
  | "youReceive"
  | "marketStats"
  | "recentTrades"
  | "type"
  | "amount"
  | "time"
  | "buy"
  | "sell"
  | "chart"
  | "orderbook"
  | "copyright"

export const translations: Record<Language, Record<TranslationKey, string>> = {
  en: {
    swap: "Swap",
    liquidity: "Liquidity",
    connectWallet: "Connect Wallet",
    yourPositions: "Your Positions",
    allPools: "All Pools",
    createPool: "Create Pool",
    add: "Add",
    remove: "Remove",
    poolStatistics: "Pool Statistics",
    volume: "Volume",
    tvl: "TVL",
    fees: "Fees",
    price: "Price",
    liquidityProviders: "Liquidity Providers",
    poolShare: "Pool Share",
    currentRate: "Current Rate",
    apr: "APR",
    networkFee: "Network Fee",
    addLiquidity: "Add Liquidity",
    removeLiquidity: "Remove Liquidity",
    claimFees: "Claim Fees",
    selectPosition: "Select a position to remove liquidity",
    noMorePositions: "No more positions found",
    token1: "Token 1",
    token2: "Token 2",
    balance: "Balance",
    selectToken: "Select a token",
    searchTokens: "Search tokens...",
    noTokensFound: "No tokens found",
    step1: "Select Tokens",
    step2: "Set Amounts",
    step3: "Confirm Creation",
    selectTokens: "Select Tokens",
    setAmounts: "Set Amounts",
    confirmCreation: "Confirm Creation",
    cancel: "Cancel",
    next: "Next",
    back: "Back",
    creating: "Creating...",
    createPoolTitle: "Create Liquidity Pool",
    createPoolDescription: "Create a new trading pair and add initial liquidity",
    firstToken: "First Token",
    secondToken: "Second Token",
    feeTier: "Fee Tier",
    stablePairs: "Stable Pairs",
    standardPairs: "Standard Pairs",
    volatilePairs: "Volatile Pairs",
    initialLiquidity: "Initial Liquidity",
    estimatedApr: "Estimated APR",
    youWillDeposit: "You will deposit",
    createPoolInfo: "After creating the pool, you will receive LP tokens representing your pool share",
    createPool: "Create Pool",
    cannotSelectSameToken: "Cannot select the same token, please choose two different tokens",
    pairAlreadyExists: "This pair already exists. You can add liquidity to the existing pool.",
    h24Volume: "24h Volume",
    h24Fees: "24h Fees",
    h24Change: "24h Change",
    w7dChange: "7d Change",
    yourLiquidity: "Your liquidity",
    yourShare: "Your share",
    unclaimedFees: "Unclaimed fees",
    yourPooledTokens: "Your pooled tokens",
    poolUtilization: "Pool utilization",
    utilized: "utilized",
    healthy: "Healthy",
    refreshRates: "Refresh rates",
    settings: "Settings",
    swapSettings: "Swap settings",
    liquiditySettings: "Liquidity settings",
    tradingPair: "Trading Pair",
    rate: "Rate",
    priceImpact: "Price Impact",
    slippageTolerance: "Slippage Tolerance",
    youPay: "You pay",
    youReceive: "You receive",
    marketStats: "Market Stats",
    recentTrades: "Recent Trades",
    type: "Type",
    amount: "Amount",
    time: "Time",
    buy: "buy",
    sell: "sell",
    chart: "Chart",
    orderbook: "Orderbook",
    copyright: "© 2025 Solana DEX. All rights reserved.",
  },
  zh: {
    swap: "兑换",
    liquidity: "流动性",
    connectWallet: "连接钱包",
    yourPositions: "您的仓位",
    allPools: "所有资金池",
    createPool: "创建资金池",
    add: "添加",
    remove: "移除",
    poolStatistics: "资金池统计",
    volume: "交易量",
    tvl: "总锁仓量",
    fees: "手续费",
    price: "价格",
    liquidityProviders: "流动性提供者",
    poolShare: "池份额",
    currentRate: "当前汇率",
    apr: "年化收益率",
    networkFee: "网络费用",
    addLiquidity: "添加流动性",
    removeLiquidity: "移除流动性",
    claimFees: "领取手续费",
    selectPosition: "选择要移除流动性的仓位",
    noMorePositions: "没有更多仓位",
    token1: "代币 1",
    token2: "代币 2",
    balance: "余额",
    selectToken: "选择代币",
    searchTokens: "搜索代币...",
    noTokensFound: "未找到代币",
    step1: "选择代币",
    step2: "设置金额",
    step3: "确认创建",
    selectTokens: "选择代币",
    setAmounts: "设置金额",
    confirmCreation: "确认创建",
    cancel: "取消",
    next: "下一步",
    back: "上一步",
    creating: "创建中...",
    createPoolTitle: "创建流动性池",
    createPoolDescription: "创建一个新的交易对并添加初始流动性",
    firstToken: "第一个代币",
    secondToken: "第二个代币",
    feeTier: "费率层级",
    stablePairs: "稳定币对",
    standardPairs: "标准对",
    volatilePairs: "波动对",
    initialLiquidity: "初始流动性",
    estimatedApr: "预计年化收益率",
    youWillDeposit: "您将存入",
    createPoolInfo: "创建池后，您将收到代表您池份额的LP代币",
    createPool: "创建池",
    cannotSelectSameToken: "不能选择相同的代币，请选择两种不同的代币",
    pairAlreadyExists: "这个交易对已经存在。您可以直接向现有池添加流动性。",
    h24Volume: "24小时交易量",
    h24Fees: "24小时手续费",
    h24Change: "24小时变化",
    w7dChange: "7天变化",
    yourLiquidity: "您的流动性",
    yourShare: "您的份额",
    unclaimedFees: "未领取手续费",
    yourPooledTokens: "您的池代币",
    poolUtilization: "池利用率",
    utilized: "已使用",
    healthy: "健康",
    refreshRates: "刷新汇率",
    settings: "设置",
    swapSettings: "兑换设置",
    liquiditySettings: "流动性设置",
    tradingPair: "交易对",
    rate: "汇率",
    priceImpact: "价格影响",
    slippageTolerance: "滑点容忍度",
    youPay: "您支付",
    youReceive: "您收到",
    marketStats: "市场统计",
    recentTrades: "最近交易",
    type: "类型",
    amount: "数量",
    time: "时间",
    buy: "买入",
    sell: "卖出",
    chart: "图表",
    orderbook: "订单簿",
    copyright: "© 2025 Solana DEX. 保留所有权利。",
  },
}
