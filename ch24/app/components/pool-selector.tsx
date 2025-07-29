"use client"

import { useState } from "react"
import { Check, ChevronDown } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"

export type Pool = {
  address: string
  tokenA: {
    address: string
    symbol: string
  }
  tokenB: {
    address: string
    symbol: string
  }
  reserveA?: number
  reserveB?: number
  lpTokens?: number
}

interface PoolSelectorProps {
  value: string | null
  onChange: (value: string) => void
  pools: Pool[]
  loading?: boolean
}

export function PoolSelector({ value, onChange, pools, loading = false }: PoolSelectorProps) {
  const [open, setOpen] = useState(false)
  const { t } = useLanguage()

  const selectedPool = pools.find((pool) => pool.address === value)

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

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
          disabled={loading}
        >
          {selectedPool ? (
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
          ) : (
            <span className="text-slate-400">{loading ? t.common.loading : t.common.selectPool}</span>
          )}
          <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-slate-900 border-slate-700">
        <Command className="bg-transparent">
          <CommandInput placeholder={t.common.searchPools} className="border-b border-slate-700 text-slate-200" />
          {loading ? (
            <div className="py-6 text-center text-sm text-slate-400">{t.common.loading}</div>
          ) : (
            <CommandList>
              <CommandEmpty className="py-6 text-center text-sm text-slate-400">{t.common.noPoolsFound}</CommandEmpty>
              <CommandGroup className="max-h-[300px] overflow-auto">
                {pools.map((pool) => (
                  <CommandItem
                    key={pool.address}
                    value={pool.address}
                    onSelect={() => {
                      onChange(pool.address)
                      setOpen(false)
                    }}
                    className={cn(
                      "flex items-center justify-between py-2 px-2 cursor-pointer hover:bg-slate-800",
                      value === pool.address && "bg-slate-800",
                    )}
                  >
                    <div className="flex items-center">
                      <div className="flex -space-x-2 mr-2">
                        <div
                          className={`w-8 h-8 rounded-full bg-gradient-to-r ${getTokenColor(pool.tokenA.symbol)} flex items-center justify-center text-xs font-bold text-white ring-2 ring-slate-900`}
                        >
                          {pool.tokenA.symbol.charAt(0)}
                        </div>
                        <div
                          className={`w-8 h-8 rounded-full bg-gradient-to-r ${getTokenColor(pool.tokenB.symbol)} flex items-center justify-center text-xs font-bold text-white ring-2 ring-slate-900`}
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
                    <div className="flex items-center">
                      {value === pool.address && <Check className="h-4 w-4 text-violet-500" />}
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          )}
        </Command>
      </PopoverContent>
    </Popover>
  )
}
