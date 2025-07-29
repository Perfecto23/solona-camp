"use client"

import { DexWidget } from "@/components/dex-widget"
import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/contexts/language-context"
import { useLanguage } from "@/contexts/language-context"

export default function DexPage() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <DexPageContent />
      </LanguageProvider>
    </ThemeProvider>
  )
}

function DexPageContent() {
  const { t } = useLanguage()

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative overflow-hidden">
      {/* 背景装饰效果 */}
      <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-transparent to-purple-500/5 pointer-events-none" />
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-full blur-3xl opacity-30 pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-gradient-to-tl from-fuchsia-500/10 to-indigo-500/10 rounded-full blur-3xl opacity-30 pointer-events-none" />
      
      {/* 移动端顶部导航 */}
      <div className="lg:hidden relative z-10">
        <div className="flex items-center justify-center p-8 bg-slate-900/80 backdrop-blur-xl shadow-lg shadow-slate-900/20">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-xl shadow-violet-500/30 border border-violet-400/20">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <div className="flex flex-col">
              <span className="text-white font-bold text-xl leading-tight bg-gradient-to-r from-white via-violet-100 to-purple-100 bg-clip-text text-transparent">{t.home.title}</span>
              <span className="text-violet-300 text-sm leading-tight font-medium opacity-80">{t.home.bootcampProjectTitle}</span>
            </div>
          </div>
        </div>
      </div>

      {/* DEX Widget */}
      <div className="relative z-10">
        <DexWidget />
      </div>
    </main>
  )
} 