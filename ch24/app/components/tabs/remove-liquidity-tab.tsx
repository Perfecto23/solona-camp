"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TokenAmountInput } from "@/components/token-amount-input"
import { SlippageSelector } from "@/components/slippage-selector"
import { AlertCircle } from "lucide-react"
import { useWallet } from "@/components/wallet-provider"
import type { Token } from "@/components/token-selector"
import { CustomPoolSelector } from "@/components/custom-pool-selector"
import { RefreshButton } from "@/components/refresh-button"
import type { Pool } from "@/components/pool-selector"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"
import { useDexQuery } from "@/hooks/dex/use-dex-query"
import { useDexLiquidity } from "@/hooks/dex/use-dex-liquidity"
import { PublicKey } from "@solana/web3.js"

export function RemoveLiquidityTab() {
  const { connected } = useWallet()
  const { toast } = useToast()
  const { t } = useLanguage()
  const { getAllPools, getUserTokens, getPoolReserves } = useDexQuery()
  const { removeLiquidity } = useDexLiquidity()
  
  const [selectedPool, setSelectedPool] = useState<string | null>(null)
  const [lpAmount, setLpAmount] = useState("")
  const [slippage, setSlippage] = useState(1) // Default 1%
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pools, setPools] = useState<Pool[]>([])
  const [userTokens, setUserTokens] = useState<Token[]>([])
  const [poolDetails, setPoolDetails] = useState<{ reserveA: number; reserveB: number } | null>(null)
  const [loadingPoolDetails, setLoadingPoolDetails] = useState(false)
  const [userLpBalance, setUserLpBalance] = useState<number>(0)
  const [loadingLpBalance, setLoadingLpBalance] = useState(false)

  // 获取池子列表
  useEffect(() => {
    if (connected) {
      fetchPools()
    }
  }, [connected])

  // 获取用户代币列表
  useEffect(() => {
    if (connected) {
      fetchUserTokens()
    }
  }, [connected])

  // 当选择的池子改变时，清空输入数量并获取池子详细信息
  useEffect(() => {
    setLpAmount("")
    if (selectedPool) {
      fetchPoolDetails()
      fetchUserLpBalance()
    }
  }, [selectedPool])

  // 当连接状态改变时，重新获取池子详细信息
  useEffect(() => {
    if (selectedPool && connected) {
      fetchPoolDetails()
      fetchUserLpBalance()
    }
  }, [connected])

  const fetchPools = async () => {
    if (!connected) return
    
    setRefreshing(true)
    try {
      const poolsData = await getAllPools()
      // 转换为Pool类型，并获取真实的储备量数据
      const convertedPools: Pool[] = []
      
      for (const pool of poolsData) {
        try {
          // 获取池子的真实储备量
          const poolAddress = new PublicKey(pool.address)
          const reserves = await getPoolReserves(poolAddress)
          
          convertedPools.push({
            address: pool.address,
            tokenA: { address: pool.tokenAMint, symbol: pool.tokenASymbol || t.common.unknown },
            tokenB: { address: pool.tokenBMint, symbol: pool.tokenBSymbol || t.common.unknown },
            reserveA: reserves?.tokenAReserve || 0,
            reserveB: reserves?.tokenBReserve || 0,
            lpTokens: 0, // 将在获取用户LP余额时计算
          })
        } catch (error) {
          console.error(`获取池子 ${pool.address} 储备量失败:`, error)
          // 如果获取储备量失败，使用默认值
          convertedPools.push({
            address: pool.address,
            tokenA: { address: pool.tokenAMint, symbol: pool.tokenASymbol || t.common.unknown },
            tokenB: { address: pool.tokenBMint, symbol: pool.tokenBSymbol || t.common.unknown },
            reserveA: 0,
            reserveB: 0,
            lpTokens: 0,
          })
        }
      }
      
      setPools(convertedPools)
      console.log('✅ 池子列表和储备量获取成功:', convertedPools)
    } catch (error) {
      console.error(t.errors.fetchPoolListFailed, error)
      toast({
        variant: "destructive",
        title: t.errors.fetchPoolListFailed,
        description: t.common.error,
      })
    } finally {
      setRefreshing(false)
    }
  }

  const fetchUserTokens = async () => {
    if (!connected) return
    
    try {
      const tokensData = await getUserTokens()
      // 转换为Token类型
      const convertedTokens: Token[] = tokensData.map(token => ({
        address: token.mint,
        symbol: token.symbol,
        name: token.name,
        decimals: token.decimals,
        balance: token.balance,
      }))
      setUserTokens(convertedTokens)
    } catch (error) {
      console.error(t.errors.fetchUserTokensFailed, error)
    }
  }

  // 获取选中池子的详细储备量信息
  const fetchPoolDetails = async () => {
    if (!selectedPool || !connected) {
      setPoolDetails(null)
      return
    }

    setLoadingPoolDetails(true)
    try {
      const poolAddress = new PublicKey(selectedPool)
      const reserves = await getPoolReserves(poolAddress)
      
      if (reserves) {
        setPoolDetails({
          reserveA: reserves.tokenAReserve,
          reserveB: reserves.tokenBReserve,
        })
        console.log('✅ 获取选中池子储备量成功:', reserves)
      } else {
        setPoolDetails(null)
      }
    } catch (error) {
      console.error('获取选中池子储备量失败:', error)
      setPoolDetails(null)
    } finally {
      setLoadingPoolDetails(false)
    }
  }

  // 获取用户LP代币余额（模拟）
  const fetchUserLpBalance = async () => {
    if (!selectedPool || !connected) {
      setUserLpBalance(0)
      return
    }

    setLoadingLpBalance(true)
    try {
      // TODO: 实际从合约获取用户的LP代币余额
      // 这里先使用模拟数据
      const mockLpBalance = Math.random() * 100
      setUserLpBalance(mockLpBalance)
      console.log('✅ 获取用户LP余额成功:', mockLpBalance)
    } catch (error) {
      console.error(t.errors.fetchLpBalanceFailed, error)
      setUserLpBalance(0)
    } finally {
      setLoadingLpBalance(false)
    }
  }

  const pool = pools.find((p) => p.address === selectedPool)

  // Get tokens from the selected pool
  const tokenA = pool ? userTokens.find((t) => t.address === pool.tokenA.address) : null
  const tokenB = pool ? userTokens.find((t) => t.address === pool.tokenB.address) : null

  // Calculate expected output tokens
  const calculateOutputs = () => {
    if (!pool || !lpAmount || !poolDetails || !userLpBalance || userLpBalance === 0) {
      return { amountA: "0", amountB: "0" }
    }

    const amount = Number.parseFloat(lpAmount)
    if (isNaN(amount) || amount <= 0) {
      return { amountA: "0", amountB: "0" }
    }

    // 简化计算：假设用户LP占比等于移除的LP占比
    // 实际应该基于总LP供应量计算
    const totalLpSupply = Math.sqrt(poolDetails.reserveA * poolDetails.reserveB) // 简化估算
    const share = amount / totalLpSupply
    const outA = share * poolDetails.reserveA
    const outB = share * poolDetails.reserveB

    return {
                amountA: outA.toFixed(6),
          amountB: outB.toFixed(6),
    }
  }

  const { amountA, amountB } = calculateOutputs()

  // Calculate minimum output tokens based on slippage
  const calculateMinOutputs = () => {
    const outA = Number.parseFloat(amountA)
    const outB = Number.parseFloat(amountB)

    if (isNaN(outA) || isNaN(outB) || outA <= 0 || outB <= 0) {
      return { minA: "0", minB: "0" }
    }

    return {
              minA: (outA * (1 - slippage / 100)).toFixed(6),
        minB: (outB * (1 - slippage / 100)).toFixed(6),
    }
  }

  const { minA, minB } = calculateMinOutputs()

  const handleRemoveLiquidity = async () => {
    if (!connected || !pool || !tokenA || !tokenB || !poolDetails) {
      toast({
        variant: "destructive",
        title: t.removeLiquidity.removeLiquidityError,
        description: t.removeLiquidity.removeLiquidityErrorDesc,
      })
      return
    }

    const lpAmountValue = Number.parseFloat(lpAmount)

    if (isNaN(lpAmountValue) || lpAmountValue <= 0) {
      toast({
        variant: "destructive",
        title: t.common.error,
        description: t.removeLiquidity.validLpAmount,
      })
      return
    }

    // 由于输入已被限制，不再需要余额检查提示

    setLoading(true)

    try {
      // 计算最小输出数量（应用滑点）
      const { amountA, amountB } = calculateOutputs()
      
      // 确保代币顺序与合约一致（tokenX < tokenY 按字典序）
      const tokenXAddress = pool.tokenA.address
      const tokenYAddress = pool.tokenB.address
      
      let minAmountX, minAmountY
      if (tokenXAddress < tokenYAddress) {
        // 当前顺序正确：A = X, B = Y
        minAmountX = Number.parseFloat(amountA) * (1 - slippage / 100)
        minAmountY = Number.parseFloat(amountB) * (1 - slippage / 100)
      } else {
        // 需要交换：A = Y, B = X
        minAmountX = Number.parseFloat(amountB) * (1 - slippage / 100)
        minAmountY = Number.parseFloat(amountA) * (1 - slippage / 100)
      }

      console.log('移除流动性参数:', {
        poolAddress: pool.address,
        tokenX: tokenXAddress,
        tokenY: tokenYAddress,
        lpAmount: lpAmountValue,
        expectedAmountA: amountA,
        expectedAmountB: amountB,
        minAmountX,
        minAmountY,
        slippage: slippage + '%'
      })

      // 调用真实的合约方法
      const txId = await removeLiquidity(
        new PublicKey(pool.address),
        lpAmountValue,
        minAmountX,
        minAmountY
      )

      if (txId) {
        toast({
          variant: "success",
          title: t.removeLiquidity.removeLiquiditySuccess,
          description: `已移除 ${lpAmountValue} LP代币，获得 ${amountA} ${tokenA.symbol} 和 ${amountB} ${tokenB.symbol}。交易ID: ${txId.slice(0, 8)}...`,
        })

        // 重置表单
        setLpAmount("")
        
        // 刷新数据
        setTimeout(() => {
          fetchPoolDetails()
          fetchUserLpBalance()
          fetchUserTokens()
        }, 2000)
      } else {
        throw new Error(t.errors.transactionFailedNoId)
      }
    } catch (error) {
      console.error("移除流动性失败:", error)
      
      // 提供更详细的错误信息
      let errorMessage = "请检查您的输入并重试"
      if (error instanceof Error) {
        if (error.message.includes('insufficient')) {
          errorMessage = t.removeLiquidity.insufficientLpBalance
        } else if (error.message.includes('slippage')) {
                      errorMessage = t.errors.slippageTooHigh
        } else {
          errorMessage = `${errorMessage}: ${error.message}`
        }
      }
      
      toast({
        variant: "destructive",
        title: t.removeLiquidity.removeLiquidityError,
        description: errorMessage,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleRefresh = async () => {
    await fetchPools()
    if (selectedPool) {
      await fetchPoolDetails()
      await fetchUserLpBalance()
    }
  }

  // 检查移除流动性按钮是否应该禁用
  const isRemoveLiquidityDisabled = () => {
    if (!connected || !pool || !tokenA || !tokenB || !poolDetails) return true
    if (loading || refreshing || loadingPoolDetails || loadingLpBalance) return true
    if (!lpAmount) return true
    if (Number.parseFloat(lpAmount) <= 0) return true
    if (Number.parseFloat(lpAmount) > userLpBalance) return true
    return false
  }

  // 获取移除流动性按钮文本
  const getRemoveLiquidityButtonText = () => {
    if (!connected) return t.common.connectWallet
    if (!pool) return t.common.selectPool
    if (loadingPoolDetails) return t.common.loading
    if (loadingLpBalance) return t.common.loading
    if (!poolDetails) return t.common.loading
    if (!lpAmount) return t.removeLiquidity.pleaseInputLpAmount
    if (Number.parseFloat(lpAmount) <= 0) return t.removeLiquidity.validLpAmount
    if (Number.parseFloat(lpAmount) > userLpBalance) return t.removeLiquidity.insufficientLpBalance
    return t.removeLiquidity.removeLiquidity
  }

  // 处理LP数量变化，并限制余额
  const handleLpAmountChange = (value: string) => {
    // 只有当输入是有效数字且超过余额时才限制，允许空值和删除操作
    if (value !== "" && userLpBalance > 0) {
      const inputValue = Number.parseFloat(value)
      if (!isNaN(inputValue) && inputValue > userLpBalance) {
        value = userLpBalance.toString()
      }
    }
    
    setLpAmount(value)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-200">{t.removeLiquidity.title}</h2>
        <RefreshButton
          onClick={handleRefresh}
          loading={refreshing || loadingPoolDetails || loadingLpBalance}
        />
      </div>

      <Card className="bg-slate-800/30 border-slate-700">
        <CardContent className="p-6 space-y-4">
          {/* Pool Selector */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">
              {t.common.selectPool}
            </label>
            <CustomPoolSelector
              value={selectedPool}
              onChange={setSelectedPool}
              pools={pools}
              loading={refreshing}
            />
          </div>

          {pool && (
            <>
              {/* LP Amount Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-slate-300">
                    {t.removeLiquidity.lpAmount}
                  </div>
                  <div className="text-xs text-slate-400">
                    {loadingLpBalance ? t.common.loading : (
                      <>
                        {t.common.balance}: <span className={`${
                          lpAmount && Number.parseFloat(lpAmount) > 0 && userLpBalance > 0
                            ? Number.parseFloat(lpAmount) / userLpBalance >= 1
                              ? "text-red-400 font-medium" 
                              : Number.parseFloat(lpAmount) / userLpBalance > 0.8 
                                ? "text-amber-400 font-medium" 
                                : "text-slate-400"
                            : "text-slate-400"
                        }`}>
                          {userLpBalance.toFixed(6)} LP
                        </span>
                        {lpAmount && Number.parseFloat(lpAmount) > 0 && userLpBalance > 0 && (
                          <span className={`ml-2 font-medium ${
                            Number.parseFloat(lpAmount) / userLpBalance >= 1
                              ? "text-red-400" 
                              : Number.parseFloat(lpAmount) / userLpBalance > 0.8 
                                ? "text-amber-400" 
                                : "text-emerald-400"
                          }`}>
                            ({((Number.parseFloat(lpAmount) / userLpBalance) * 100).toFixed(1)}%)
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
                <TokenAmountInput
                  value={lpAmount}
                  onChange={handleLpAmountChange}
                  max={userLpBalance}
                  decimals={6}
                  placeholder={userLpBalance > 0 ? `${t.common.max}: ${userLpBalance.toFixed(6)}` : "0.0"}
                  showMaxButton={userLpBalance > 0}
                  onMaxClick={() => handleLpAmountChange(userLpBalance.toFixed(6))}
                  className={`${
                    lpAmount && userLpBalance > 0 && Number.parseFloat(lpAmount) > 0
                      ? Number.parseFloat(lpAmount) / userLpBalance >= 1
                        ? "border-red-500 focus:border-red-500" 
                        : Number.parseFloat(lpAmount) / userLpBalance > 0.8 
                          ? "border-amber-500 focus:border-amber-500" 
                          : ""
                      : ""
                  }`}
                />
              </div>

              {/* Slippage Selector */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-slate-300">
                    {t.slippage.slippageTolerance}
                  </label>
                  <span className="text-xs text-slate-400">
                    {t.addLiquidity.currentSlippage}: {slippage}%
                  </span>
                </div>
                <SlippageSelector value={slippage} onChange={setSlippage} />
              </div>

              {/* Pool Info */}
              {poolDetails && (
                <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
                  {loadingPoolDetails ? (
                    <div className="text-center text-slate-400 text-sm">{t.common.loading}</div>
                  ) : (
                    <>
                      {/* 储备量信息 */}
                      <div className="space-y-2">
                        <h4 className="text-xs font-medium text-slate-300 uppercase tracking-wide">{t.common.poolReserves}</h4>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-slate-800/50 rounded-md p-3">
                            <div className="text-xs text-slate-400">{tokenA?.symbol}</div>
                            <div className="text-sm font-medium text-slate-200">
                              {poolDetails.reserveA?.toLocaleString(undefined, { 
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 4 
                              }) || "0"}
                            </div>
                          </div>
                          <div className="bg-slate-800/50 rounded-md p-3">
                            <div className="text-xs text-slate-400">{tokenB?.symbol}</div>
                            <div className="text-sm font-medium text-slate-200">
                              {poolDetails.reserveB?.toLocaleString(undefined, { 
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 4 
                              }) || "0"}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 移除预览 */}
                      {lpAmount && Number.parseFloat(lpAmount) > 0 && (
                        <div className="border-t border-slate-600/50 pt-3 space-y-2">
                          <h4 className="text-xs font-medium text-slate-300 uppercase tracking-wide">移除预览</h4>
                          
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-400">预计获得 {tokenA?.symbol}</span>
                              <span className="text-sm text-slate-200 font-medium">
                                {Number.parseFloat(amountA).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 6
                                })}
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center">
                              <span className="text-xs text-slate-400">预计获得 {tokenB?.symbol}</span>
                              <span className="text-sm text-slate-200 font-medium">
                                {Number.parseFloat(amountB).toLocaleString(undefined, {
                                  minimumFractionDigits: 2,
                                  maximumFractionDigits: 6
                                })}
                              </span>
                            </div>

                            <div className="border-t border-slate-600/30 pt-2 mt-2">
                              <div className="flex justify-between items-center">
                                <span className="text-xs text-slate-400">最小获得 (滑点 {slippage}%)</span>
                              </div>
                              <div className="space-y-1 mt-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-400">{tokenA?.symbol}</span>
                                  <span className="text-slate-300">{minA}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                  <span className="text-slate-400">{tokenB?.symbol}</span>
                                  <span className="text-slate-300">{minB}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Remove Liquidity Button */}
              <Button
                onClick={handleRemoveLiquidity}
                disabled={isRemoveLiquidityDisabled()}
                className="w-full bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-700 hover:to-pink-700"
              >
                {loading ? t.common.processing : getRemoveLiquidityButtonText()}
              </Button>
            </>
          )}

          {!pool && (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-400" />
              <p className="text-slate-400">{t.removeLiquidity.pleaseSelectPool}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
