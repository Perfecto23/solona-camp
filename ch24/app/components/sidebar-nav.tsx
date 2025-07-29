"use client"

import type React from "react"
import { cn } from "@/lib/utils"
import { ArrowLeftRight, Plus, Minus, Trophy, Settings, ShieldAlert, Droplets, ExternalLink, BookOpen } from 'lucide-react'
import { useWallet } from "@/components/wallet-provider"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"

interface NavItemProps {
  icon: React.ReactNode
  label: string
  active: boolean
  onClick: () => void
}

// 提升NavItem组件的精致度和高级感
function NavItem({ icon, label, active, onClick }: NavItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "group w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm transition-all duration-300 ease-out",
        active
          ? "bg-gradient-to-r from-violet-500/15 via-purple-500/10 to-fuchsia-500/15 text-white shadow-lg shadow-violet-500/10 border border-violet-400/20"
          : "text-slate-400 hover:text-white hover:bg-slate-800/40 hover:border-slate-700/50 border border-transparent",
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-300 shadow-sm",
          active
            ? "bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 text-white shadow-lg shadow-violet-500/25"
            : "bg-slate-800/60 text-slate-400 group-hover:bg-slate-700/80 group-hover:text-white group-hover:shadow-md",
        )}
      >
        {icon}
      </div>
      <span className={cn(
        "font-semibold transition-all duration-200",
        active && "bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent"
      )}>{label}</span>
      {active && (
        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gradient-to-r from-violet-400 to-fuchsia-400 shadow-sm shadow-violet-400/50" />
      )}
    </button>
  )
}

interface SidebarNavProps {
  activeTab: string
  onTabChange: (tab: string) => void
}

// 提升SidebarNav组件的高级感
export function SidebarNav({ activeTab, onTabChange }: SidebarNavProps) {
  const { connected } = useWallet()
  const { t } = useLanguage()

  const navItems = [
    { id: "swap", label: t.nav.swap, icon: <ArrowLeftRight className="h-4 w-4" /> },
    { id: "createPool", label: t.nav.createPool, icon: <Droplets className="h-4 w-4" /> },
    { id: "addLiquidity", label: t.nav.addLiquidity, icon: <Plus className="h-4 w-4" /> },
    { id: "removeLiquidity", label: t.nav.removeLiquidity, icon: <Minus className="h-4 w-4" /> },
    { id: "rewards", label: t.nav.rewards, icon: <Trophy className="h-4 w-4" /> },
    { id: "admin", label: t.nav.admin, icon: <Settings className="h-4 w-4" /> },
  ]

  return (
    <div className="w-full h-full flex flex-col bg-gradient-to-b from-slate-900/60 via-slate-900/50 to-slate-900/60 backdrop-blur-xl">
      {/* Brand Header - 更精致的品牌区域 */}
      <div className="flex flex-col gap-4 px-6 py-8 border-b border-slate-700/50 bg-gradient-to-r from-slate-800/30 to-slate-800/20 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-xl shadow-violet-500/30 border border-violet-400/20">
            <span className="text-white font-bold text-lg">S</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-300 via-purple-300 to-fuchsia-300 bg-clip-text text-transparent leading-tight">
              {t.home.title}
            </h1>
            <span className="text-violet-400 text-sm leading-tight font-medium opacity-80">{t.home.bootcampProjectTitle}</span>
          </div>
        </div>

        {/* Camp Link - 更精致的链接按钮 */}
        <a
          href="https://www.soldevcamp.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2.5 w-full group p-3 text-slate-400 hover:text-violet-300 hover:bg-gradient-to-r hover:from-violet-500/10 hover:to-purple-500/10 transition-all duration-300 rounded-lg border border-slate-700/30 hover:border-violet-400/30 backdrop-blur-sm"
        >
          <div className="w-7 h-7 rounded-lg bg-slate-800/50 group-hover:bg-violet-500/20 flex items-center justify-center transition-all duration-200">
            <BookOpen className="w-3.5 h-3.5" />
          </div>
          <span className="text-sm font-medium">{t.home.visitBootcampWebsite}</span>
          <ExternalLink className="w-3 h-3 ml-auto opacity-60 group-hover:opacity-100 transition-opacity" />
        </a>
      </div>

      {/* Navigation Items - 更优雅的导航区域 */}
      <div className="flex-1 mt-6 space-y-2 px-4 overflow-y-auto">
        {connected ? (
          navItems.map((item) => (
            <NavItem
              key={item.id}
              icon={item.icon}
              label={item.label}
              active={activeTab === item.id}
              onClick={() => onTabChange(item.id)}
            />
          ))
        ) : (
          <div className="text-center py-12 px-4">
            <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center shadow-lg">
              <ShieldAlert className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-base font-bold text-white mb-3 bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
              {t.common.pleaseConnectWallet}
            </h3>
            <p className="text-sm text-slate-400 leading-relaxed max-w-xs mx-auto">
              {t.common.connectWalletDesc}
            </p>
          </div>
        )}
      </div>

      {/* Copyright Footer - 更精致的底部区域 */}
      <div className="mt-auto p-6 border-t border-slate-700/40 bg-gradient-to-r from-slate-800/20 to-slate-800/10 backdrop-blur-sm">
        <div className="text-xs text-slate-500 text-center leading-relaxed">
          <div className="mb-2 font-semibold">© {new Date().getFullYear()} {t.home.title}</div>
          <div>
            {t.home.designedFor} <a
              className="text-violet-400 hover:text-violet-300 transition-all duration-200 font-semibold underline decoration-violet-400/30 underline-offset-2 hover:decoration-violet-300/50"
              href="https://www.soldevcamp.com/" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              {t.common.solanaBootcamp}
            </a> {t.home.designed}
          </div>
        </div>
      </div>
    </div>
  )
}
