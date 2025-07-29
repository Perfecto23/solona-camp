"use client"

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import type { Token } from "@/components/token-selector"
import { useLanguage } from "@/contexts/language-context"

interface CustomTokenSelectorProps {
  value: string | null
  onChange: (value: string) => void
  tokens: Token[]
  loading?: boolean
  label?: string
}

export function CustomTokenSelector({
  value,
  onChange,
  tokens,
  loading = false,
  label = "选择代币",
}: CustomTokenSelectorProps) {
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

  // Format balance with appropriate decimals
  const formatBalance = (balance?: number, decimals = 6) => {
    if (balance === undefined) return "0"

    const balanceStr = balance.toFixed(decimals)
    if (balance < 0.000001 && balance > 0) {
      return "<0.000001"
    }

    // Remove trailing zeros
    return balanceStr.replace(/\.?0+$/, "")
  }

  // Format address to show first and last few characters
  const formatAddress = (address: string) => {
    if (!address) return ""
    return `${address.slice(0, 4)}...${address.slice(-4)}`
  }

  const selectedToken = tokens.find((token) => token.address === value)

  return (
    <div className="w-full">
      {label && <div className="text-sm font-medium text-slate-300 mb-1.5">{label}</div>}
      <Select value={value || undefined} onValueChange={onChange} disabled={loading}>
        <SelectTrigger className="w-full bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white">
          <SelectValue placeholder={loading ? t.common.loading : label}>
            {selectedToken && (
              <div className="flex items-center">
                <div
                  className={`w-6 h-6 rounded-full bg-gradient-to-r ${getTokenColor(selectedToken.symbol)} mr-2 flex items-center justify-center text-xs font-bold text-white`}
                >
                  {selectedToken.symbol.charAt(0)}
                </div>
                <span>{selectedToken.symbol}</span>
                {selectedToken.balance !== undefined && (
                  <span className="ml-2 text-xs text-slate-400">
                    {formatBalance(selectedToken.balance, selectedToken.decimals)}
                  </span>
                )}
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-slate-900 border-slate-700 text-slate-200">
          {tokens.length === 0 ? (
            <div className="py-6 text-center text-sm text-slate-400">{t.common.noTokensFound}</div>
          ) : (
            tokens.map((token) => (
              <SelectItem key={token.address} value={token.address} className="hover:bg-slate-800 focus:bg-slate-800">
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center">
                    <div
                      className={`w-6 h-6 rounded-full bg-gradient-to-r ${getTokenColor(token.symbol)} mr-2 flex items-center justify-center text-xs font-bold text-white`}
                    >
                      {token.symbol.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-200">{token.symbol}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1">
                        <span>{token.name}</span>
                        <span className="opacity-60">•</span>
                        <span>{formatAddress(token.address)}</span>
                      </div>
                    </div>
                  </div>
                  {token.balance !== undefined && (
                    <span className="text-sm text-slate-400">{formatBalance(token.balance, token.decimals)}</span>
                  )}
                </div>
              </SelectItem>
            ))
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
