"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Trophy, Clock, Sparkles, Gift } from "lucide-react"
import { useWallet } from "@/components/wallet-provider"
import { RefreshButton } from "@/components/refresh-button"
import type { Pool } from "@/components/pool-selector"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"
import { useDexQuery } from "@/hooks/dex/use-dex-query"
import { useDexRewards } from "@/hooks/dex/use-dex-rewards"
import { PublicKey } from "@solana/web3.js"
import type { UnclaimedRewards } from "@/hooks/types/dex-types"

// 奖励数据类型
type PoolReward = {
  poolAddress: string
  tokenAReward: number
  tokenBReward: number
}

export function RewardsTab() {
  const { connected } = useWallet()
  const { toast } = useToast()
  const { t } = useLanguage()
  const { getAllPools } = useDexQuery()
  const { 
    getUserUnclaimedRewards, 
    claimRewards, 
    loading: rewardsLoading, 
    error: rewardsError 
  } = useDexRewards()
  
  const [rewards, setRewards] = useState<PoolReward[]>([])
  const [refreshing, setRefreshing] = useState(false)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [claimingAll, setClaimingAll] = useState(false)
  const [claimingPool, setClaimingPool] = useState<string | null>(null)
  const [pools, setPools] = useState<Pool[]>([])
  const [currentTime, setCurrentTime] = useState(new Date())

  // 获取池子列表
  useEffect(() => {
    if (connected) {
      fetchPools()
    }
  }, [connected, getAllPools])

  // 获取奖励数据 - 需要等待pools数据加载完成
  useEffect(() => {
    if (connected && pools.length > 0) {
      fetchRewards()
    }
  }, [connected, pools.length])

  // 显示合约错误
  useEffect(() => {
    if (rewardsError) {
      toast({
        variant: "destructive",
        title: t.errors.contractError,
        description: rewardsError,
      })
    }
  }, [rewardsError, toast])

  // 更新当前时间
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  const fetchPools = async () => {
    if (!connected) return
    
    try {
      const poolsData = await getAllPools()
      // 转换为Pool类型
      const convertedPools: Pool[] = poolsData.map(pool => ({
        address: pool.address,
        tokenA: { address: pool.tokenAMint, symbol: pool.tokenASymbol || t.common.unknown },
        tokenB: { address: pool.tokenBMint, symbol: pool.tokenBSymbol || t.common.unknown },
        reserveA: 0, // TODO: 从合约获取真实数据
        reserveB: 0, // TODO: 从合约获取真实数据
        lpTokens: 0, // TODO: 从合约获取真实数据
      }))
      setPools(convertedPools)
    } catch (error) {
      console.error(t.errors.fetchPoolListFailed, error)
    }
  }

  // 获取奖励数据
  const fetchRewards = async () => {
    if (!connected || pools.length === 0) return

    setRefreshing(true)

    try {
      const rewardsData: PoolReward[] = []
      
      // 并行获取所有池子的奖励
      const rewardPromises = pools.map(async (pool) => {
        try {
          const poolPublicKey = new PublicKey(pool.address)
          const reward = await getUserUnclaimedRewards(poolPublicKey)
          
          if (reward && (reward.rewardA > 0 || reward.rewardB > 0)) {
            return {
              poolAddress: pool.address,
              tokenAReward: reward.rewardA,
              tokenBReward: reward.rewardB,
            }
          }
          return null
        } catch (error) {
          console.error(`${t.rewards.fetchRewardsFailed} ${pool.address}:`, error)
          return null
        }
      })

      const results = await Promise.all(rewardPromises)
      
      // 过滤掉空值并只保留有奖励的池子
      results.forEach(reward => {
        if (reward) {
          rewardsData.push(reward)
        }
      })

      setRewards(rewardsData)
      setLastUpdated(new Date())
    } catch (error) {
      console.error(t.rewards.fetchRewardsFailed, error)
      toast({
        variant: "destructive",
        title: t.rewards.fetchRewardsFailed,
        description: t.common.error,
      })
    } finally {
      setRefreshing(false)
    }
  }

  // 处理刷新按钮点击
  const handleRefresh = () => {
    if (pools.length > 0) {
      fetchRewards()
    } else {
      // 如果pools为空，先获取pools再获取奖励
      fetchPools()
    }
  }

  // 处理领取所有奖励
  const handleClaimAll = async () => {
    if (!connected || rewards.length === 0) return

    setClaimingAll(true)

    try {
      // 并行领取所有池子的奖励
      const claimPromises = rewards.map(async (reward) => {
        try {
          const poolPublicKey = new PublicKey(reward.poolAddress)
          const txId = await claimRewards(poolPublicKey)
          
          if (txId) {
            console.log(`池子 ${reward.poolAddress} 奖励领取成功, 交易ID: ${txId}`)
            return { poolAddress: reward.poolAddress, success: true, txId }
          }
          return { poolAddress: reward.poolAddress, success: false }
        } catch (error) {
          console.error(`领取池子 ${reward.poolAddress} 奖励失败:`, error)
          return { poolAddress: reward.poolAddress, success: false, error }
        }
      })

      const results = await Promise.all(claimPromises)
      
      // 检查结果
      const successCount = results.filter(r => r.success).length
      const failCount = results.length - successCount

      if (successCount > 0) {
        toast({
          variant: "success",
          title: "领取完成",
          description: `成功领取 ${successCount} 个池子的奖励${failCount > 0 ? `，${failCount} 个失败` : ''}`,
        })
        
        // 刷新奖励数据
        await fetchRewards()
      } else {
        throw new Error("所有奖励领取失败")
      }
    } catch (error) {
      console.error("领取所有奖励失败:", error)
      toast({
        variant: "destructive",
        title: "领取失败",
        description: "请稍后重试",
      })
    } finally {
      setClaimingAll(false)
    }
  }

  // 处理领取单个池子的奖励
  const handleClaimPool = async (poolAddress: string) => {
    if (!connected) return

    setClaimingPool(poolAddress)

    try {
      const poolPublicKey = new PublicKey(poolAddress)
      const txId = await claimRewards(poolPublicKey)
      
      if (txId) {
        const pool = pools.find((p) => p.address === poolAddress)
        const reward = rewards.find((r) => r.poolAddress === poolAddress)

        if (pool && reward) {
          toast({
            variant: "success",
            title: "领取成功",
            description: `已成功领取 ${pool.tokenA.symbol}/${pool.tokenB.symbol} 池子的奖励`,
          })
        }

        // 刷新奖励数据以获取最新状态
        await fetchRewards()
      } else {
        throw new Error(t.errors.transactionFailed)
      }
    } catch (error) {
      console.error("领取池子奖励失败:", error)
      toast({
        variant: "destructive",
        title: "领取失败",
        description: error instanceof Error ? error.message : "请稍后重试",
      })
    } finally {
      setClaimingPool(null)
    }
  }

  // 格式化最后更新时间
  const formatLastUpdated = () => {
    if (!lastUpdated) return t.common.neverUpdated

    const diffMs = currentTime.getTime() - lastUpdated.getTime()
    const diffSec = Math.max(0, Math.floor(diffMs / 1000)) // 确保不会显示负数

    if (diffSec < 60) return `${diffSec}${t.rewards.secondsAgo}`
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}${t.rewards.minutesAgo}`
    return `${Math.floor(diffSec / 3600)}${t.rewards.hoursAgo}`
  }



  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-200">{t.rewards.title}</h2>
        <div className="flex items-center gap-2">
          <RefreshButton
            onClick={handleRefresh}
            loading={refreshing || rewardsLoading}
          />
          {rewards.length > 0 && (
            <Button
              size="sm"
              onClick={handleClaimAll}
              disabled={claimingAll || rewardsLoading}
              className="relative overflow-hidden bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:text-white border-0 shadow-lg transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center gap-2">
                {claimingAll ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>领取中...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>领取全部</span>
                  </>
                )}
              </div>
            </Button>
          )}
        </div>
      </div>

      {/* 最后更新时间 */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <Clock className="h-4 w-4" />
                            <span>{t.rewards.lastUpdated}: {formatLastUpdated()}</span>
      </div>

      {/* 奖励列表 */}
      <div className="space-y-4">
        {rewards.length === 0 ? (
          <div className="text-center py-8">
            <Trophy className="h-8 w-8 mx-auto mb-2 text-slate-400" />
            <p className="text-slate-400">{t.common.noRewardsAvailable}</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {rewards.map((reward) => {
                const pool = pools.find((p) => p.address === reward.poolAddress)
                if (!pool) return null

                return (
                  <Card key={reward.poolAddress} className="bg-slate-800/30 border-slate-700">
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white ring-2 ring-slate-900">
                              {pool.tokenA.symbol.charAt(0)}
                            </div>
                            <div className="w-6 h-6 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 flex items-center justify-center text-xs font-bold text-white ring-2 ring-slate-900">
                              {pool.tokenB.symbol.charAt(0)}
                            </div>
                          </div>
                          <span className="text-sm font-medium text-slate-200">
                            {pool.tokenA.symbol}/{pool.tokenB.symbol}
                          </span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleClaimPool(reward.poolAddress)}
                          disabled={claimingPool === reward.poolAddress || rewardsLoading}
                          className="relative overflow-hidden bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:text-white border-0 shadow-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group min-w-[80px]"
                        >
                          <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="relative flex items-center gap-2">
                            {claimingPool === reward.poolAddress ? (
                              <>
                                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span className="text-xs">领取中...</span>
                              </>
                            ) : (
                              <>
                                <Gift className="w-3 h-3" />
                                <span className="text-xs font-medium">领取</span>
                              </>
                            )}
                          </div>
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-slate-400">{pool.tokenA.symbol} 奖励</div>
                          <div className="text-slate-200 font-medium">
                            {reward.tokenAReward.toFixed(6)}
                          </div>
                        </div>
                        <div>
                          <div className="text-slate-400">{pool.tokenB.symbol} 奖励</div>
                          <div className="text-slate-200 font-medium">
                            {reward.tokenBReward.toFixed(6)}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
