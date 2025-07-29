"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { PublicKey } from "@solana/web3.js"
import type { Token } from "@/components/token-selector"
import { TokenAmountInput } from "@/components/token-amount-input"
import { ArrowLeftRight, AlertCircle, CheckCircle2, Loader2, Info } from "lucide-react"
import { useWallet } from "@/components/wallet-provider"
import { CustomTokenSelector } from "@/components/custom-token-selector"
import { RefreshButton } from "@/components/refresh-button"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"
import { useDex } from "@/hooks/use-dex"
import { cn } from "@/lib/utils"
import { logger } from "@/lib/logger"
import { TOKEN_SYMBOL_MAP, ERROR_MESSAGES, SUCCESS_MESSAGES } from "@/lib/constants"

// 获取代币符号
const getTokenSymbol = (address: string) => {
  return TOKEN_SYMBOL_MAP[address] || address.slice(0, 8) + "..."
}

// 检查地址是否有效
const isValidAddress = (address: string): boolean => {
  try {
    new PublicKey(address)
    return true
  } catch {
    return false
  }
}

export function CreatePoolTab() {
  const { connected, publicKey } = useWallet()
  const { toast } = useToast()
  const { t } = useLanguage()
  const dex = useDex()
  
  // 基础状态
  const [tokenA, setTokenA] = useState<string | null>(null)
  const [tokenB, setTokenB] = useState<string | null>(null)
  const [amountA, setAmountA] = useState("")
  const [amountB, setAmountB] = useState("")
  
  // 池子检查状态
  const [poolExists, setPoolExists] = useState<boolean | null>(null)
  const [checkingPool, setCheckingPool] = useState(false)
  const [poolAddress, setPoolAddress] = useState<string | null>(null)
  
  // 用户代币和余额
  const [userTokens, setUserTokens] = useState<Token[]>([])
  const [loadingTokens, setLoadingTokens] = useState(false)
  const [userTokenABalance, setUserTokenABalance] = useState(0)
  const [userTokenBBalance, setUserTokenBBalance] = useState(0)
  const [loadingBalances, setLoadingBalances] = useState(false)
  
  // 创建池子状态
  const [creating, setCreating] = useState(false)

  // 获取用户代币列表
  const fetchUserTokens = async () => {
    if (!connected || !dex.getUserTokens) return

    setLoadingTokens(true)
    try {
      logger.info('🔄 获取用户代币列表...')
      const realTokens = await dex.getUserTokens()
      
      // 转换为组件需要的格式
      const convertedTokens: Token[] = realTokens.map((userToken) => ({
        address: userToken.mint,
        symbol: userToken.symbol || getTokenSymbol(userToken.mint),
        name: userToken.symbol || getTokenSymbol(userToken.mint),
        decimals: userToken.decimals,
        balance: userToken.balance,
      }))
      
      setUserTokens(convertedTokens)
      logger.info('✅ 已加载', convertedTokens.length, '个用户代币')
      
    } catch (error) {
      logger.error('❌ 获取用户代币失败:', error)
      // 降级到常见代币列表
      const fallbackTokens: Token[] = Object.entries(TOKEN_SYMBOL_MAP).map(([address, symbol]) => ({
        address,
        symbol,
        name: symbol,
        decimals: symbol === "SOL" ? 9 : 6,
        balance: 0,
      }))
      setUserTokens(fallbackTokens)
    } finally {
      setLoadingTokens(false)
    }
  }

  // 获取用户代币余额
  const fetchUserBalances = async () => {
    if (!connected || !tokenA || !tokenB || !dex.getUserTokenBalance) {
      setUserTokenABalance(0)
      setUserTokenBBalance(0)
      return
    }

    setLoadingBalances(true)
    try {
      logger.info('🔄 获取用户代币余额...')
      const [balanceA, balanceB] = await Promise.all([
        dex.getUserTokenBalance(new PublicKey(tokenA)),
        dex.getUserTokenBalance(new PublicKey(tokenB))
      ])
      
      setUserTokenABalance(balanceA)
      setUserTokenBBalance(balanceB)
      logger.info('✅ 获取到用户余额:', { tokenA: balanceA, tokenB: balanceB })
      
    } catch (error) {
      logger.error('❌ 获取用户余额失败:', error)
      setUserTokenABalance(0)
      setUserTokenBBalance(0)
    } finally {
      setLoadingBalances(false)
    }
  }

  // 检查池子是否存在
  const checkPoolExists = async () => {
    if (!tokenA || !tokenB || tokenA === tokenB || !dex.getPoolAddress || !dex.getPoolInfo) {
      setPoolExists(null)
      setPoolAddress(null)
      return
    }

    setCheckingPool(true)
    try {
      logger.info('🔄 检查池子是否存在...')
      const tokenAPK = new PublicKey(tokenA)
      const tokenBPK = new PublicKey(tokenB)
      
      // 获取池子地址
      const poolAddr = dex.getPoolAddress(tokenAPK, tokenBPK)
      setPoolAddress(poolAddr.toString())
      
      // 检查池子是否已创建
      try {
        const poolInfo = await dex.getPoolInfo(poolAddr)
        if (poolInfo) {
          setPoolExists(true)
          logger.info('✅ 池子已存在:', poolAddr.toString())
        } else {
          setPoolExists(false)
          logger.info('✅ 池子不存在，可以创建:', poolAddr.toString())
        }
      } catch {
        setPoolExists(false)
        logger.info('✅ 池子不存在，可以创建:', poolAddr.toString())
      }
      
    } catch (error) {
      logger.error('❌ 检查池子失败:', error)
      setPoolExists(null)
      setPoolAddress(null)
    } finally {
      setCheckingPool(false)
    }
  }

  // 自动获取用户代币列表
  useEffect(() => {
    fetchUserTokens()
  }, [connected])

  // 当代币选择改变时检查池子和获取余额
  useEffect(() => {
    if (tokenA && tokenB && isValidAddress(tokenA) && isValidAddress(tokenB)) {
      checkPoolExists()
      fetchUserBalances()
    } else {
      setPoolExists(null)
      setPoolAddress(null)
      setUserTokenABalance(0)
      setUserTokenBBalance(0)
    }
  }, [tokenA, tokenB, connected])

  const selectedTokenA = userTokens.find((t) => t.address === tokenA)
  const selectedTokenB = userTokens.find((t) => t.address === tokenB)

  // 过滤代币列表，避免在A和B中选择相同代币
  const availableTokensForA = userTokens.filter(token => token.address !== tokenB)
  const availableTokensForB = userTokens.filter(token => token.address !== tokenA)

  // 处理代币A选择
  const handleTokenAChange = (newTokenA: string) => {
    setTokenA(newTokenA)
    setAmountA("") // 清空金额
    // 如果新选择的代币A与代币B相同，清除代币B的选择
    if (newTokenA === tokenB) {
      setTokenB(null)
      setAmountB("")
    }
  }

  // 处理代币B选择
  const handleTokenBChange = (newTokenB: string) => {
    setTokenB(newTokenB)
    setAmountB("") // 清空金额
    // 如果新选择的代币B与代币A相同，清除代币A的选择
    if (newTokenB === tokenA) {
      setTokenA(null)
      setAmountA("")
    }
  }

  // 交换代币A和代币B
  const handleSwapTokens = () => {
    const tempTokenA = tokenA
    const tempTokenB = tokenB
    const tempAmountA = amountA
    const tempAmountB = amountB

    setTokenA(tempTokenB)
    setTokenB(tempTokenA)
    setAmountA(tempAmountB)
    setAmountB(tempAmountA)
  }

  // 刷新数据
  const handleRefresh = async () => {
    await Promise.all([
      fetchUserTokens(),
      tokenA && tokenB ? checkPoolExists() : Promise.resolve(),
      tokenA && tokenB ? fetchUserBalances() : Promise.resolve()
    ])
  }

  // 计算预期LP代币数量
  const calculateExpectedLpAmount = () => {
    if (!amountA || !amountB) return "0"

    const a = Number.parseFloat(amountA)
    const b = Number.parseFloat(amountB)

    if (isNaN(a) || isNaN(b) || a <= 0 || b <= 0) return "0"

    // 使用 sqrt(a * b) 公式计算LP代币
    return Math.sqrt(a * b).toFixed(6)
  }

  // 设置最大金额，保留足够的小数位数
  const handleMaxAmountA = () => {
    const maxDecimals = 6
    const maxValue = Math.min(userTokenABalance, Math.pow(10, maxDecimals - 1))
    setAmountA(maxValue.toFixed(Math.min(6, maxDecimals)))
  }

  const handleMaxAmountB = () => {
    const maxDecimals = 6
    const maxValue = Math.min(userTokenBBalance, Math.pow(10, maxDecimals - 1))
    setAmountB(maxValue.toFixed(Math.min(6, maxDecimals)))
  }

  // 创建流动性池
  const handleCreatePool = async () => {
    if (!connected || !tokenA || !tokenB || !dex.initializePool) return

    setCreating(true)
    try {
      logger.info('🔄 创建流动性池...')
      const tokenAPK = new PublicKey(tokenA)
      const tokenBPK = new PublicKey(tokenB)
      const amountAValue = Number.parseFloat(amountA)
      const amountBValue = Number.parseFloat(amountB)

      const result = await dex.initializePool(tokenAPK, tokenBPK, amountAValue, amountBValue)
      
      if (result) {
        toast({
          variant: "success",
          title: t.createPool.createPoolSuccess,
          description: t.createPool.createPoolSuccessDesc
            .replace("{0}", selectedTokenA?.symbol || "")
            .replace("{1}", selectedTokenB?.symbol || ""),
        })

        // 重置表单
        setAmountA("")
        setAmountB("")
        
        // 刷新池子状态
        setTimeout(() => {
          checkPoolExists()
          fetchUserBalances()
        }, 2000)
      } else {
        throw new Error("创建池子失败")
      }
    } catch (error) {
      logger.error('❌ 创建池子失败:', error)
      toast({
        variant: "destructive",
        title: t.createPool.createPoolError,
        description: t.createPool.createPoolErrorDesc,
      })
    } finally {
      setCreating(false)
    }
  }

  // 检查创建池子按钮是否应该禁用
  const isCreateDisabled = () => {
    if (!connected || !tokenA || !tokenB || poolExists === true || checkingPool || creating) return true
    if (tokenA === tokenB) return true
    if (!isValidAddress(tokenA) || !isValidAddress(tokenB)) return true
    if (!amountA || !amountB) return true
    if (Number.parseFloat(amountA) <= 0 || Number.parseFloat(amountB) <= 0) return true
    if (Number.parseFloat(amountA) > userTokenABalance || Number.parseFloat(amountB) > userTokenBBalance) return true
    return false
  }

  // 获取创建池子按钮文本
  const getCreateButtonText = () => {
    if (!connected) return t.createPool.pleaseConnectWallet
    if (!tokenA || !tokenB) return t.createPool.selectTokens
    if (tokenA === tokenB) return "请选择不同的代币"
    if (!isValidAddress(tokenA) || !isValidAddress(tokenB)) return "无效的代币地址"
    if (checkingPool) return t.createPool.checkingPool
    if (poolExists === true) return t.createPool.poolExists
    if (!amountA || !amountB) return t.createPool.inputAmount
    if (Number.parseFloat(amountA) <= 0 || Number.parseFloat(amountB) <= 0) return t.common.validAmount
    if (Number.parseFloat(amountA) > userTokenABalance) return `${selectedTokenA?.symbol} ${t.common.insufficientBalance}`
    if (Number.parseFloat(amountB) > userTokenBBalance) return `${selectedTokenB?.symbol} ${t.common.insufficientBalance}`
    return t.createPool.createPool
  }

  return (
    <div className="space-y-6">
      {/* 标题和刷新按钮 */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500">
          {t.createPool.title}
        </h3>
        <RefreshButton
          onClick={handleRefresh}
          loading={loadingTokens || checkingPool || loadingBalances}
        />
      </div>

      {/* 说明卡片 */}
      <Card className="bg-slate-800/50 border-slate-700/50 shadow-lg">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-slate-300 leading-relaxed">
              {t.createPool.createPoolDesc}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 代币选择区域 */}
      <Card className="bg-slate-800/30 border-slate-700/50">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg text-slate-200">{t.createPool.selectTokenPair}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* 代币选择器 - 移动端优化布局 */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-4 items-end">
            <div className="space-y-2">
              <CustomTokenSelector 
                value={tokenA} 
                onChange={handleTokenAChange} 
                tokens={availableTokensForA} 
                label={t.createPool.tokenA}
                loading={loadingTokens}
              />
            </div>

            {/* 交换按钮 - 改进定位 */}
            <div className="flex justify-center md:mt-0 mt-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={handleSwapTokens}
                disabled={(!tokenA && !tokenB) || loadingTokens}
                className="h-10 w-10 rounded-full bg-slate-700/50 border border-slate-600 text-slate-400 hover:text-violet-300 hover:bg-slate-600/50 hover:border-violet-500/30 transition-all duration-200"
              >
                <ArrowLeftRight className="h-4 w-4" />
                <span className="sr-only">{t.createPool.swapTokens}</span>
              </Button>
            </div>

            <div className="space-y-2">
              <CustomTokenSelector 
                value={tokenB} 
                onChange={handleTokenBChange} 
                tokens={availableTokensForB} 
                label={t.createPool.tokenB}
                loading={loadingTokens}
              />
            </div>
          </div>

          {/* 池子状态检查 */}
          {tokenA && tokenB && (
            <div className="mt-4">
              <Card className={cn(
                "transition-all duration-200",
                checkingPool ? "bg-slate-700/30 border-slate-600" :
                poolExists === true ? "bg-amber-500/10 border-amber-500/30" :
                poolExists === false ? "bg-emerald-500/10 border-emerald-500/30" :
                "bg-slate-700/30 border-slate-600"
              )}>
                <CardContent className="p-3">
                  <div className="flex items-center gap-3">
                    {checkingPool ? (
                      <>
                        <Loader2 className="h-4 w-4 text-slate-400 animate-spin" />
                        <div className="text-sm text-slate-300">{t.createPool.checkingPool}</div>
                      </>
                    ) : poolExists === true ? (
                      <>
                        <AlertCircle className="h-4 w-4 text-amber-400" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-amber-400">
                            {t.createPool.poolExists}
                          </div>
                          <div className="text-xs text-amber-300 mt-1">
                            {t.swap.poolAddress}: {poolAddress?.slice(0, 8)}...{poolAddress?.slice(-8)}
                          </div>
                        </div>
                      </>
                    ) : poolExists === false ? (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-emerald-400">
                            {t.createPool.canCreatePool}
                          </div>
                          <div className="text-xs text-emerald-300 mt-1">
                            {t.createPool.expectedAddress}: {poolAddress?.slice(0, 8)}...{poolAddress?.slice(-8)}
                          </div>
                        </div>
                      </>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 流动性输入区域 */}
      {tokenA && tokenB && poolExists === false && (
        <Card className="bg-slate-800/30 border-slate-700/50">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg text-slate-200">{t.createPool.setInitialLiquidity}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* 代币A数量输入 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-slate-300">
                  {t.createPool.initialAmount} {selectedTokenA?.symbol}
                </div>
                {selectedTokenA && (
                  <div className="text-xs text-slate-400">
                    {t.common.balance}: {loadingBalances ? (
                      <span className="inline-flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {t.common.loading}
                      </span>
                    ) : (
                      `${userTokenABalance.toLocaleString()} ${selectedTokenA.symbol}`
                    )}
                  </div>
                )}
              </div>

              <TokenAmountInput
                value={amountA}
                onChange={setAmountA}
                max={userTokenABalance}
                decimals={6}
                showMaxButton
                onMaxClick={handleMaxAmountA}
                disabled={loadingBalances}
              />
            </div>

            {/* 代币B数量输入 */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-slate-300">
                  {t.createPool.initialAmount} {selectedTokenB?.symbol}
                </div>
                {selectedTokenB && (
                  <div className="text-xs text-slate-400">
                    {t.common.balance}: {loadingBalances ? (
                      <span className="inline-flex items-center gap-1">
                        <Loader2 className="h-3 w-3 animate-spin" />
                        {t.common.loading}
                      </span>
                    ) : (
                      `${userTokenBBalance.toLocaleString()} ${selectedTokenB.symbol}`
                    )}
                  </div>
                )}
              </div>

              <TokenAmountInput
                value={amountB}
                onChange={setAmountB}
                max={userTokenBBalance}
                decimals={6}
                showMaxButton
                onMaxClick={handleMaxAmountB}
                disabled={loadingBalances}
              />
            </div>

            {/* 池子信息预览 */}
            {amountA && amountB && Number.parseFloat(amountA) > 0 && Number.parseFloat(amountB) > 0 && (
              <Card className="bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border-violet-500/20">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">{t.createPool.expectedLpTokens}:</span>
                      <span className="text-sm font-medium text-violet-300">
                        {calculateExpectedLpAmount()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">{t.createPool.initialPrice}:</span>
                      <span className="text-sm font-medium text-violet-300">
                        1 {selectedTokenA?.symbol} = {(Number.parseFloat(amountB) / Number.parseFloat(amountA)).toFixed(6)} {selectedTokenB?.symbol}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-slate-400">反向价格:</span>
                      <span className="text-sm font-medium text-violet-300">
                        1 {selectedTokenB?.symbol} = {(Number.parseFloat(amountA) / Number.parseFloat(amountB)).toFixed(6)} {selectedTokenA?.symbol}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 创建池子按钮 */}
            <Button
              onClick={handleCreatePool}
              disabled={isCreateDisabled() || creating || dex.loading}
              className={cn(
                "w-full h-12 text-base font-medium transition-all duration-200",
                isCreateDisabled() || creating || dex.loading
                  ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                  : "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white shadow-lg hover:shadow-xl"
              )}
            >
              {creating || dex.loading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t.common.processing}
                </span>
              ) : (
                getCreateButtonText()
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
