"use client"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Pool } from "@/components/pool-selector"
import { useLanguage } from "@/contexts/language-context"

interface CustomPoolSelectorProps {
  value: string | null
  onChange: (value: string) => void
  pools: Pool[]
  loading?: boolean
}

export function CustomPoolSelector({ value, onChange, pools, loading = false }: CustomPoolSelectorProps) {
  const { t } = useLanguage()
  // Generate token icon background based on symbol
  const getTokenColor = (symbol: string) => {
    const colors = [
      "from-pink-500 to-rose-500",
      "from-violet-500 to-purple-500",
      "from-blue-500 to-cyan-500",
      "from-emerald-500 to-green-500",
      "from-amber-500 to-yellow-500",
      "from-orange-500 to-red-500",
    ]

    // Simple hash function to get consistent color for same symbol
    let hash = 0
    for (let i = 0; i < symbol.length; i++) {
      hash = symbol.charCodeAt(i) + ((hash << 5) - hash)
    }

    const index = Math.abs(hash) % colors.length
    return colors[index]
  }

  // Format address to show first and last few characters
  const formatAddress = (address: string) => {
    if (!address) return ""
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  const selectedPool = pools.find((pool) => pool.address === value)

  return (
    <Select value={value || undefined} onValueChange={onChange} disabled={loading}>
      <SelectTrigger className="w-full bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white">
        <SelectValue placeholder={loading ? t.common.loading : t.common.selectPool}>
          {selectedPool && (
            <div className="flex items-center">
              <div className="flex -space-x-2 mr-2">
                <div
                  className={`w-6 h-6 rounded-full bg-gradient-to-r ${getTokenColor(selectedPool.tokenA.symbol)} flex items-center justify-center text-xs font-bold text-white ring-2 ring-slate-900`}
                >
                  {selectedPool.tokenA.symbol.charAt(0)}
                </div>
                <div
                  className={`w-6 h-6 rounded-full bg-gradient-to-r ${getTokenColor(selectedPool.tokenB.symbol)} flex items-center justify-center text-xs font-bold text-white ring-2 ring-slate-900`}
                >
                  {selectedPool.tokenB.symbol.charAt(0)}
                </div>
              </div>
              <span>
                {selectedPool.tokenA.symbol}/{selectedPool.tokenB.symbol}
              </span>
            </div>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
        {pools.length === 0 ? (
          <div className="py-6 text-center text-sm text-slate-400">{t.common.noPoolsFound}</div>
        ) : (
          pools.map((pool) => (
            <SelectItem key={pool.address} value={pool.address} className="hover:bg-slate-800 focus:bg-slate-800">
              <div className="flex items-center">
                <div className="flex -space-x-2 mr-2">
                  <div
                    className={`w-6 h-6 rounded-full bg-gradient-to-r ${getTokenColor(pool.tokenA.symbol)} flex items-center justify-center text-xs font-bold text-white ring-2 ring-slate-900`}
                  >
                    {pool.tokenA.symbol.charAt(0)}
                  </div>
                  <div
                    className={`w-6 h-6 rounded-full bg-gradient-to-r ${getTokenColor(pool.tokenB.symbol)} flex items-center justify-center text-xs font-bold text-white ring-2 ring-slate-900`}
                  >
                    {pool.tokenB.symbol.charAt(0)}
                  </div>
                </div>
                <div>
                  <div className="font-medium text-slate-200">
                    {pool.tokenA.symbol}/{pool.tokenB.symbol}
                  </div>
                  <div className="text-xs text-slate-400">{formatAddress(pool.address)}</div>
                </div>
              </div>
            </SelectItem>
          ))
        )}
      </SelectContent>
    </Select>
  )
}
