"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface TokenAmountInputProps {
  value: string
  onChange: (value: string) => void
  max?: number
  decimals?: number
  disabled?: boolean
  showMaxButton?: boolean
  onMaxClick?: () => void
  className?: string
  placeholder?: string
}

export function TokenAmountInput({
  value,
  onChange,
  max,
  decimals = 6,
  disabled = false,
  showMaxButton = false,
  onMaxClick,
  className,
  placeholder = "0.0",
}: TokenAmountInputProps) {
  // Handle input change with validation
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value

    // Allow empty input
    if (val === "") {
      onChange("")
      return
    }

    // Only allow numbers and a single decimal point
    if (!/^[0-9]*\.?[0-9]*$/.test(val)) {
      return
    }

    // Prevent more decimal places than allowed
    const parts = val.split(".")
    if (parts.length > 1 && parts[1].length > decimals) {
      return
    }

    onChange(val)
  }

  // Handle MAX button click
  const handleMaxClick = () => {
    if (max !== undefined && onMaxClick) {
      onMaxClick()
    }
  }

  return (
    <div className={cn("relative", className)}>
      <Input
        type="text"
        value={value}
        onChange={handleChange}
        disabled={disabled}
        placeholder={placeholder}
        className="pr-16 bg-slate-800/50 border-slate-700 text-slate-200 focus-visible:ring-violet-500"
      />
      {showMaxButton && max !== undefined && (
        <Button
          variant="ghost"
          size="sm"
          onClick={handleMaxClick}
          disabled={disabled}
          className="absolute right-1 top-1/2 -translate-y-1/2 h-7 text-xs text-violet-400 hover:text-white hover:bg-violet-600 transition-colors duration-200 font-medium"
        >
          MAX
        </Button>
      )}
    </div>
  )
}
