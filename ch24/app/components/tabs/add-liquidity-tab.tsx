"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { TokenAmountInput } from "@/components/token-amount-input"
import { SlippageSelector } from "@/components/slippage-selector"
import type { Pool } from "@/components/pool-selector"
import { AlertCircle } from "lucide-react"
import { useWallet } from "@/components/wallet-provider"
import type { Token } from "@/components/token-selector"
import { CustomPoolSelector } from "@/components/custom-pool-selector"
import { RefreshButton } from "@/components/refresh-button"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"
import { useDexQuery } from "@/hooks/dex/use-dex-query"
import { useDexLiquidity } from "@/hooks/dex/use-dex-liquidity"
import { PublicKey } from "@solana/web3.js"

export function AddLiquidityTab() {
  const { connected } = useWallet()
  const { toast } = useToast()
  const { t } = useLanguage()
  const { getAllPools, getUserTokens, getPoolReserves } = useDexQuery()
  const { addLiquidity } = useDexLiquidity()
  
  const [selectedPool, setSelectedPool] = useState<string | null>(null)
  const [amountA, setAmountA] = useState("")
  const [amountB, setAmountB] = useState("")
  const [slippage, setSlippage] = useState(1) // Default 1%
  const [loading, setLoading] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const [pools, setPools] = useState<Pool[]>([])
  const [userTokens, setUserTokens] = useState<Token[]>([])
  const [poolDetails, setPoolDetails] = useState<{ reserveA: number; reserveB: number } | null>(null)
  const [loadingPoolDetails, setLoadingPoolDetails] = useState(false)
  
  // 用于防止无限循环的标记
  const isUpdating = useRef(false)

  // 获取池子列表
  useEffect(() => {
    if (connected) {
      fetchPools()
    }
  }, [connected])

  // 当选择的池子改变时，清空输入数量并获取池子详细信息
  useEffect(() => {
    setAmountA("")
    setAmountB("")
    if (selectedPool) {
      fetchPoolDetails()
    }
  }, [selectedPool])

  // 当连接状态改变时，重新获取池子详细信息
  useEffect(() => {
    if (selectedPool && connected) {
      fetchPoolDetails()
    }
  }, [connected])

  // 获取用户代币列表
  useEffect(() => {
    if (connected) {
      fetchUserTokens()
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
          })
        } catch (error) {
          console.error(`${t.errors.fetchPoolReservesFailed} ${pool.address}:`, error)
          // 如果获取储备量失败，使用默认值
          convertedPools.push({
            address: pool.address,
            tokenA: { address: pool.tokenAMint, symbol: pool.tokenASymbol || t.common.unknown },
            tokenB: { address: pool.tokenBMint, symbol: pool.tokenBSymbol || t.common.unknown },
            reserveA: 0,
            reserveB: 0,
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

  const pool = pools.find((p) => p.address === selectedPool)

  // Get tokens from the selected pool
  const tokenA = pool ? userTokens.find((t) => t.address === pool.tokenA.address) : null
  const tokenB = pool ? userTokens.find((t) => t.address === pool.tokenB.address) : null

  // Calculate the optimal ratio based on latest pool reserves
  const ratio = poolDetails?.reserveA && poolDetails?.reserveB ? poolDetails.reserveB / poolDetails.reserveA : 0

  // 处理代币A数量变化，自动计算代币B
  const handleAmountAChange = (value: string) => {
    if (isUpdating.current) return
    
    // 只有当输入是有效数字且超过余额时才限制，允许空值和删除操作
    if (value !== "" && tokenA?.balance !== undefined) {
      const inputValue = Number.parseFloat(value)
      if (!isNaN(inputValue) && inputValue > tokenA.balance) {
        value = tokenA.balance.toString()
      }
    }
    
    setAmountA(value)
    
    if (!poolDetails || !ratio || !value || Number.parseFloat(value) <= 0) {
      if (!isUpdating.current) {
        isUpdating.current = true
        setAmountB("")
        isUpdating.current = false
      }
      return
    }

    const amountAValue = Number.parseFloat(value)
    if (!isNaN(amountAValue) && amountAValue > 0) {
      const calculatedB = amountAValue * ratio
      isUpdating.current = true
                      setAmountB(calculatedB.toFixed(6))
      isUpdating.current = false
    }
  }

  // 处理代币B数量变化，自动计算代币A  
  const handleAmountBChange = (value: string) => {
    if (isUpdating.current) return
    
    // 只有当输入是有效数字且超过余额时才限制，允许空值和删除操作
    if (value !== "" && tokenB?.balance !== undefined) {
      const inputValue = Number.parseFloat(value)
      if (!isNaN(inputValue) && inputValue > tokenB.balance) {
        value = tokenB.balance.toString()
      }
    }
    
    setAmountB(value)
    
    if (!poolDetails || !ratio || !value || Number.parseFloat(value) <= 0) {
      if (!isUpdating.current) {
        isUpdating.current = true
        setAmountA("")
        isUpdating.current = false
      }
      return
    }

    const amountBValue = Number.parseFloat(value)
    if (!isNaN(amountBValue) && amountBValue > 0) {
      const calculatedA = amountBValue / ratio
      isUpdating.current = true
                      setAmountA(calculatedA.toFixed(6))
      isUpdating.current = false
    }
  }

  // 检查添加流动性按钮是否应该禁用
  const isAddLiquidityDisabled = () => {
    if (!connected || !pool || !tokenA || !tokenB || !poolDetails) return true
    if (loading || refreshing || loadingPoolDetails) return true
    if (!amountA || !amountB) return true
    if (Number.parseFloat(amountA) <= 0 || Number.parseFloat(amountB) <= 0) return true
    if (tokenA?.balance !== undefined && Number.parseFloat(amountA) > tokenA.balance) return true
    if (tokenB?.balance !== undefined && Number.parseFloat(amountB) > tokenB.balance) return true
    return false
  }

  // 获取添加流动性按钮文本
  const getAddLiquidityButtonText = () => {
    if (!connected) return t.common.connectWallet
    if (!pool) return t.common.selectPool
    if (loadingPoolDetails) return t.common.loading
    if (!poolDetails) return t.common.loading
    if (!tokenA || !tokenB) return t.common.loading
    if (!amountA || !amountB) return t.common.inputAmount
    if (Number.parseFloat(amountA) <= 0 || Number.parseFloat(amountB) <= 0) return t.addLiquidity.validTokenAmount
    if (tokenA?.balance !== undefined && Number.parseFloat(amountA) > tokenA.balance) return `${tokenA.symbol} ${t.common.insufficientBalance}`
    if (tokenB?.balance !== undefined && Number.parseFloat(amountB) > tokenB.balance) return `${tokenB.symbol} ${t.common.insufficientBalance}`
    return t.addLiquidity.addLiquidity
  }

  const handleAddLiquidity = async () => {
    if (!connected || !pool || !tokenA || !tokenB || !poolDetails) {
      toast({
        variant: "destructive",
        title: t.addLiquidity.addLiquidityError,
        description: t.addLiquidity.addLiquidityErrorDesc,
      })
      return
    }

    const amountAValue = Number.parseFloat(amountA)
    const amountBValue = Number.parseFloat(amountB)

    if (isNaN(amountAValue) || isNaN(amountBValue) || amountAValue <= 0 || amountBValue <= 0) {
      toast({
        variant: "destructive",
        title: t.common.error,
        description: t.addLiquidity.validTokenAmount,
      })
      return
    }

    setLoading(true)

    try {
      // 确保代币顺序与合约一致（tokenX < tokenY 按字典序）
      const tokenXAddress = pool.tokenA.address
      const tokenYAddress = pool.tokenB.address
      
      let amountX, amountY
      if (tokenXAddress < tokenYAddress) {
        // 当前顺序正确：A = X, B = Y
        amountX = amountAValue
        amountY = amountBValue
      } else {
        // 需要交换：A = Y, B = X
        amountX = amountBValue
        amountY = amountAValue
      }

      // 计算最小LP代币数量（使用几何平均数作为估算，然后应用滑点）
      const estimatedLp = Math.sqrt(amountX * amountY)
      const minLpAmount = estimatedLp * (1 - slippage / 100) // 应用滑点容忍度

      console.log('添加流动性参数:', {
        poolAddress: pool.address,
        tokenX: tokenXAddress,
        tokenY: tokenYAddress,
        amountX,
        amountY,
        estimatedLp,
        minLpAmount,
        slippage: slippage + '%'
      })

      // 调用真实的合约方法
      const txId = await addLiquidity(
        new PublicKey(pool.address),
        amountX,
        amountY,
        minLpAmount
      )

      if (txId) {
        toast({
          variant: "success",
          title: t.addLiquidity.addLiquiditySuccess,
          description: `已添加 ${amountAValue} ${tokenA.symbol} 和 ${amountBValue} ${tokenB.symbol} 到流动性池。交易ID: ${txId.slice(0, 8)}...`,
        })

        // 重置表单
        setAmountA("")
        setAmountB("")
        
        // 刷新池子信息和用户代币
        setTimeout(() => {
          fetchPoolDetails()
          fetchUserTokens()
        }, 2000)
      } else {
        throw new Error(t.errors.transactionFailedNoId)
      }
    } catch (error) {
      console.error("添加流动性失败:", error)
      
      // 提供更详细的错误信息
      let errorMessage = t.addLiquidity.addLiquidityErrorDesc
      if (error instanceof Error) {
        if (error.message.includes('insufficient')) {
          errorMessage = t.errors.insufficientBalanceDetailed
        } else if (error.message.includes('slippage')) {
                      errorMessage = t.errors.slippageTooHigh
        } else if (error.message.includes('InvalidAmount')) {
                      errorMessage = t.errors.invalidAmount
        } else {
          errorMessage = `${errorMessage}: ${error.message}`
        }
      }
      
      toast({
        variant: "destructive",
        title: t.addLiquidity.addLiquidityError,
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
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-200">{t.addLiquidity.title}</h2>
        <RefreshButton
          onClick={handleRefresh}
          loading={refreshing || loadingPoolDetails}
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
              {/* Token A Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-slate-300">
                    {tokenA?.symbol || "Token A"}
                  </div>
                  {tokenA && (
                    <div className="text-xs text-slate-400">
                      {t.common.balance}: <span className={`${
                        amountA && Number.parseFloat(amountA) > 0 && tokenA.balance
                          ? Number.parseFloat(amountA) / tokenA.balance >= 1
                            ? "text-red-400 font-medium" 
                            : Number.parseFloat(amountA) / tokenA.balance > 0.8 
                              ? "text-amber-400 font-medium" 
                              : "text-slate-400"
                          : "text-slate-400"
                      }`}>
                        {tokenA.balance?.toLocaleString() || "0"} {tokenA.symbol}
                      </span>
                      {amountA && Number.parseFloat(amountA) > 0 && tokenA.balance && (
                        <span className={`ml-2 font-medium ${
                          Number.parseFloat(amountA) / tokenA.balance >= 1
                            ? "text-red-400" 
                            : Number.parseFloat(amountA) / tokenA.balance > 0.8 
                              ? "text-amber-400" 
                              : "text-emerald-400"
                        }`}>
                          ({((Number.parseFloat(amountA) / tokenA.balance) * 100).toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <TokenAmountInput
                  value={amountA}
                  onChange={handleAmountAChange}
                  {...(tokenA?.balance !== undefined && { max: tokenA.balance })}
                  decimals={6}
                  placeholder={tokenA?.balance ? `${t.common.max}: ${tokenA.balance.toFixed(6)}` : "0.0"}
                  showMaxButton={!!tokenA?.balance}
                  onMaxClick={() => tokenA && handleAmountAChange(tokenA.balance?.toFixed(6) || "0")}
                  className={`${
                    amountA && tokenA?.balance && Number.parseFloat(amountA) > 0
                      ? Number.parseFloat(amountA) / tokenA.balance >= 1
                        ? "border-red-500 focus:border-red-500" 
                        : Number.parseFloat(amountA) / tokenA.balance > 0.8 
                          ? "border-amber-500 focus:border-amber-500" 
                          : ""
                      : ""
                  }`}
                />
              </div>

              {/* Token B Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="text-sm font-medium text-slate-300">
                    {tokenB?.symbol || "Token B"}
                  </div>
                  {tokenB && (
                    <div className="text-xs text-slate-400">
                      {t.common.balance}: <span className={`${
                        amountB && Number.parseFloat(amountB) > 0 && tokenB.balance
                          ? Number.parseFloat(amountB) / tokenB.balance >= 1
                            ? "text-red-400 font-medium" 
                            : Number.parseFloat(amountB) / tokenB.balance > 0.8 
                              ? "text-amber-400 font-medium" 
                              : "text-slate-400"
                          : "text-slate-400"
                      }`}>
                        {tokenB.balance?.toLocaleString() || "0"} {tokenB.symbol}
                      </span>
                      {amountB && Number.parseFloat(amountB) > 0 && tokenB.balance && (
                        <span className={`ml-2 font-medium ${
                          Number.parseFloat(amountB) / tokenB.balance >= 1
                            ? "text-red-400" 
                            : Number.parseFloat(amountB) / tokenB.balance > 0.8 
                              ? "text-amber-400" 
                              : "text-emerald-400"
                        }`}>
                          ({((Number.parseFloat(amountB) / tokenB.balance) * 100).toFixed(1)}%)
                        </span>
                      )}
                    </div>
                  )}
                </div>
                <TokenAmountInput
                  value={amountB}
                  onChange={handleAmountBChange}
                  {...(tokenB?.balance !== undefined && { max: tokenB.balance })}
                  decimals={6}
                  placeholder={tokenB?.balance ? `${t.common.max}: ${tokenB.balance.toFixed(6)}` : "0.0"}
                  showMaxButton={!!tokenB?.balance}
                  onMaxClick={() => tokenB && handleAmountBChange(tokenB.balance?.toFixed(6) || "0")}
                  className={`${
                    amountB && tokenB?.balance && Number.parseFloat(amountB) > 0
                      ? Number.parseFloat(amountB) / tokenB.balance >= 1
                        ? "border-red-500 focus:border-red-500" 
                        : Number.parseFloat(amountB) / tokenB.balance > 0.8 
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
                          <div className="text-xs text-slate-400">{pool.tokenA.symbol}</div>
                          <div className="text-sm font-medium text-slate-200">
                            {poolDetails?.reserveA?.toLocaleString(undefined, { 
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 4 
                            }) || "0"}
                          </div>
                        </div>
                        <div className="bg-slate-800/50 rounded-md p-3">
                          <div className="text-xs text-slate-400">{pool.tokenB.symbol}</div>
                          <div className="text-sm font-medium text-slate-200">
                            {poolDetails?.reserveB?.toLocaleString(undefined, { 
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 4 
                            }) || "0"}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 比例信息 */}
                    {ratio > 0 && (
                      <div className="border-t border-slate-600/50 pt-3">
                        <div className="flex justify-between items-center">
                          <span className="text-xs font-medium text-slate-300 uppercase tracking-wide">{t.common.exchangeRate}</span>
                          <span className="text-sm text-slate-200">
                            1 {pool.tokenA.symbol} = {ratio.toLocaleString(undefined, { 
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 6 
                            })} {pool.tokenB.symbol}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* 流动性预览 */}
                    {amountA && amountB && poolDetails?.reserveA && poolDetails?.reserveB && (
                      <div className="border-t border-slate-600/50 pt-3 space-y-2">
                        <h4 className="text-xs font-medium text-slate-300 uppercase tracking-wide">{t.addLiquidity.expectedLpTokens}</h4>
                        
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400">{t.addLiquidity.expectedLpTokens}</span>
                            <span className="text-sm text-slate-200 font-medium">
                              {Math.sqrt(Number.parseFloat(amountA) * Number.parseFloat(amountB)).toLocaleString(undefined, {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 6
                              })}
                            </span>
                          </div>
                          
                          <div className="flex justify-between items-center">
                            <span className="text-xs text-slate-400">池子份额</span>
                            <span className="text-sm text-slate-200">
                              {(() => {
                                const totalSupply = Math.sqrt(poolDetails.reserveA * poolDetails.reserveB)
                                const userLP = Math.sqrt(Number.parseFloat(amountA) * Number.parseFloat(amountB))
                                const sharePercentage = totalSupply > 0 ? (userLP / (totalSupply + userLP)) * 100 : 100
                                return sharePercentage.toFixed(4)
                              })()}%
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Add Liquidity Button */}
              <Button
                onClick={handleAddLiquidity}
                disabled={isAddLiquidityDisabled()}
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
              >
                {loading ? t.common.processing : getAddLiquidityButtonText()}
              </Button>
            </>
          )}

          {!pool && (
            <div className="text-center py-8">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-400" />
              <p className="text-slate-400">{t.addLiquidity.pleaseSelectPool}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
