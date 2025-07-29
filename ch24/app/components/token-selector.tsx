"use client"

import { useState } from "react"
import { Check, ChevronDown, Search } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"

export type Token = {
  address: string
  symbol: string
  name: string
  decimals: number
  balance?: number
  logoURI?: string
}

interface TokenSelectorProps {
  value: string | null
  onChange: (value: string) => void
  tokens: Token[]
  loading?: boolean
  label?: string
}

export function TokenSelector({ value, onChange, tokens, loading = false, label = "选择代币" }: TokenSelectorProps) {
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const { t } = useLanguage()

  const selectedToken = tokens.find((token) => token.address === value)

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

  return (
    <div className="w-full">
      {label && <div className="text-sm font-medium text-slate-300 mb-1.5">{label}</div>}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
            disabled={loading}
          >
            {selectedToken ? (
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
            ) : (
              <span className="text-slate-400">{loading ? t.components.tokenSelector.loading : label}</span>
            )}
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0 bg-slate-900 border-slate-700">
          <Command className="bg-transparent">
            <CommandInput
              placeholder={t.common.searchTokens}
              className="border-b border-slate-700 text-slate-200"
              value={searchQuery}
              onValueChange={setSearchQuery}
              startIcon={<Search className="h-4 w-4 text-slate-400" />}
            />
            {loading ? (
              <div className="py-6 text-center text-sm text-slate-400">{t.common.loading}</div>
            ) : (
              <CommandList>
                <CommandEmpty className="py-6 text-center text-sm text-slate-400">{t.common.noTokensFound}</CommandEmpty>
                <CommandGroup className="max-h-[300px] overflow-auto">
                  {tokens.map((token) => (
                    <CommandItem
                      key={token.address}
                      value={token.address}
                      onSelect={() => {
                        onChange(token.address)
                        setOpen(false)
                      }}
                      className={cn(
                        "flex items-center justify-between py-2 px-2 cursor-pointer hover:bg-slate-800",
                        value === token.address && "bg-slate-800",
                      )}
                    >
                      <div className="flex items-center">
                        <div
                          className={`w-8 h-8 rounded-full bg-gradient-to-r ${getTokenColor(token.symbol)} mr-2 flex items-center justify-center text-xs font-bold text-white`}
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
                      <div className="flex items-center gap-2">
                        {token.balance !== undefined && (
                          <span className="text-sm text-slate-400">{formatBalance(token.balance, token.decimals)}</span>
                        )}
                        {value === token.address && <Check className="h-4 w-4 text-violet-500" />}
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            )}
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
}
