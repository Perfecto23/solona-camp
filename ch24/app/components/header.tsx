"use client"

import { ConnectWalletButton } from "@/components/wallet-provider"
import { LanguageSelector } from "@/components/language-selector"

export function Header() {
  return (
    <header className="h-20 border-b border-slate-700/50 bg-gradient-to-r from-slate-900/80 via-slate-900/60 to-slate-900/80 backdrop-blur-xl flex items-center justify-end px-8 shadow-sm shadow-slate-900/20">
      {/* Right side - Controls */}
      <div className="flex items-center gap-6">
        <div className="bg-slate-800/40 backdrop-blur-sm rounded-xl border border-slate-700/40 p-1">
          <LanguageSelector />
        </div>
        <div className="h-6 w-px bg-slate-700/50"></div>
        <ConnectWalletButton />
      </div>
    </header>
  )
}
