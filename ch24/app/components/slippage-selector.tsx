"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Settings2, Percent } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"

interface SlippageSelectorProps {
  value: number
  onChange: (value: number) => void
  presets?: number[]
}

export function SlippageSelector({ value, onChange, presets = [0.5, 1, 2, 5] }: SlippageSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [customValue, setCustomValue] = useState("")
  const [isCustom, setIsCustom] = useState(!presets.includes(value))
  const { t } = useLanguage()

  // Handle preset selection
  const handlePresetClick = (preset: number) => {
    onChange(preset)
    setCustomValue("")
    setIsCustom(false)
  }

  // Handle custom input change
  const handleCustomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value

    // Allow empty input
    if (val === "") {
      setCustomValue("")
      setIsCustom(true)
      return
    }

    // Only allow numbers and a single decimal point
    if (!/^[0-9]*\.?[0-9]*$/.test(val)) {
      return
    }

    // Prevent more than 2 decimal places
    const parts = val.split(".")
    if (parts.length > 1 && parts[1].length > 2) {
      return
    }

    setCustomValue(val)
    setIsCustom(true)
    const numVal = Number.parseFloat(val)
    if (!isNaN(numVal)) {
      onChange(numVal)
    }
  }

  // Format slippage for display
  const formatSlippage = (slippage: number) => {
    return `${slippage}%`
  }

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-8 px-3 bg-slate-800/50 border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white hover:border-slate-600 transition-all",
          isOpen && "bg-slate-800 text-white border-slate-600",
        )}
      >
        <Settings2 className="h-3.5 w-3.5 mr-1.5" />
        <span className="text-xs font-medium">
          {t.slippage.slippageTolerance} {formatSlippage(value)}
        </span>
      </Button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 top-10 z-50 w-72 rounded-lg border border-slate-700 bg-slate-900/95 backdrop-blur-md shadow-xl">
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
                  <Percent className="h-4 w-4 text-violet-400" />
                  {t.slippage.slippageTolerance}
                </h4>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-slate-200 transition-colors"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                {presets.map((preset) => (
                  <button
                    key={preset}
                    onClick={() => handlePresetClick(preset)}
                    className={cn(
                      "h-9 rounded-md text-xs font-medium transition-all",
                      value === preset && !isCustom
                        ? "bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white shadow-lg shadow-violet-500/25"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white border border-slate-700",
                    )}
                  >
                    {formatSlippage(preset)}
                  </button>
                ))}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">{t.slippage.custom}</label>
                <div className="relative">
                  <Input
                    type="text"
                    value={customValue}
                    onChange={handleCustomChange}
                    placeholder="0.00"
                    className={cn(
                      "pr-8 h-9 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500 focus:border-violet-500 focus:ring-1 focus:ring-violet-500",
                      isCustom && "border-violet-500",
                    )}
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                </div>
              </div>

              {value > 5 && (
                <div className="flex items-start gap-2 p-2.5 rounded-md bg-amber-500/10 border border-amber-500/20">
                  <svg
                    className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <p className="text-xs text-amber-400">{t.slippage.highSlippageWarning}</p>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800">
                <p className="text-xs text-slate-400 leading-relaxed">{t.slippage.slippageDesc}</p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
