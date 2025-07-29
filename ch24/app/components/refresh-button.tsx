"use client"

import type React from "react"
import { Button } from "@/components/ui/button"
import { RefreshCw } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

interface RefreshButtonProps {
  onClick: () => void
  disabled?: boolean
  loading?: boolean
  className?: string
}

export function RefreshButton({ 
  onClick, 
  disabled = false, 
  loading = false,
  className = ""
}: RefreshButtonProps) {
  const { t } = useLanguage()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={onClick}
      disabled={disabled || loading}
      className={`h-8 w-8 rounded-full bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800 ${className}`}
    >
      <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
      <span className="sr-only">{t.common.refresh}</span>
    </Button>
  )
} 