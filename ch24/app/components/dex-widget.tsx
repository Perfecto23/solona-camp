"use client"

import { useState, useEffect } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent } from "@/components/ui/card"
import { ConnectWalletButton, useWallet } from "@/components/wallet-provider"
import { SwapTab } from "@/components/tabs/swap-tab"
import { CreatePoolTab } from "@/components/tabs/create-pool-tab"
import { AddLiquidityTab } from "@/components/tabs/add-liquidity-tab"
import { RemoveLiquidityTab } from "@/components/tabs/remove-liquidity-tab"
import { RewardsTab } from "@/components/tabs/rewards-tab"
import { AdminTab } from "@/components/tabs/admin-tab"
import { TutorialCard } from "@/components/tutorial-card"
import { ArrowLeftRight, Plus, Minus, Trophy, Settings, ShieldAlert, Droplets, BookOpen, ChevronDown, ChevronUp } from "lucide-react"
import { SidebarNav } from "@/components/sidebar-nav"
import { Header } from "@/components/header"
import { useLanguage } from "@/contexts/language-context"
import { LanguageSelector } from "@/components/language-selector"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useTutorialData } from "@/data/tutorial-data"

export function DexWidget() {
  const { connected } = useWallet()
  const [activeTab, setActiveTab] = useState("swap")
  const [showTutorial, setShowTutorial] = useState(false)
  const { t } = useLanguage()

  // Reset to swap tab when wallet disconnects
  useEffect(() => {
    if (!connected) {
      setActiveTab("swap")
    }
  }, [connected])

  const currentTutorial = useTutorialData(activeTab)

  // 尽量不要改默认屏幕断点尺寸
  // 因为 tailwind 是遵循最佳实践
  // sm 640 小手机 iPhone se se2 se3
  // md 768 正常手机 iPhone 12 小IPad
  // lg 1024 笔记本 13寸 MacBook Pro 大IPad 小电脑
  // xl 1280 正常电脑 笔记本 大IPad
  // 2xl 1536 大屏显示器
  return (
    <div className="lg:min-h-screen 2xl:flex">
      {/* Sidebar for large screens - 占据整个高度 */}
      <div className="hidden lg:block lg:w-64 lg:border-r lg:border-slate-800/50 lg:bg-slate-900/40 lg:backdrop-blur-md lg:min-h-screen lg:flex-shrink-0">
        <SidebarNav activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      {/* Main content area with header */}
      <div className="lg:flex-1 lg:flex lg:flex-col">
        {/* Header for large screens - 只占据除侧边栏外的宽度 */}
        <div className="hidden lg:block">
          <Header />
        </div>

        {/* Main content */}
        <div className="lg:flex-1 lg:p-8">
          <div className="max-w-md mx-auto lg:max-w-none lg:mx-0 lg:flex lg:items-start lg:justify-center lg:gap-8 lg:h-full">
            
            {/* Main DEX Card - 设置固定最小宽度 */}
            <div className="flex flex-col min-h-screen lg:min-h-0 w-full lg:w-auto">
              <Card className="backdrop-blur-xl bg-slate-900/80 border-slate-700/60 shadow-2xl shadow-violet-500/10 lg:w-full lg:max-w-xl lg:min-w-[420px] flex-1 lg:flex-none lg:rounded-2xl rounded-t-none rounded-b-2xl lg:border-2 border-x-2 border-b-2 border-t-0 lg:border-t-2">
                <CardContent className="p-8">
                  {/* 移动端顶部区域 */}
                  <div className="lg:hidden mb-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-500 via-purple-500 to-fuchsia-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
                          <span className="text-white font-bold text-sm">S</span>
                        </div>
                        <span className="text-white font-semibold text-base">{t.home.title}</span>
                      </div>
                      <LanguageSelector />
                    </div>
                    
                    {/* Mobile Tutorial - 可折叠的紧凑版 */}
                    {connected && currentTutorial && (
                      <div className="mb-6">
                        <Button
                          variant="ghost"
                          onClick={() => setShowTutorial(!showTutorial)}
                          className="w-full justify-between bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 text-white hover:text-white h-12 rounded-xl transition-all duration-300 backdrop-blur-sm"
                        >
                          <div className="flex items-center gap-2">
                            <BookOpen className="w-4 h-4 text-violet-400" />
                            <span className="text-sm font-semibold">{t.common.tutorialGuide}</span>
                          </div>
                          {showTutorial ? (
                            <ChevronUp className="w-4 h-4 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-slate-400" />
                          )}
                        </Button>
                        
                        <div className={cn(
                          "transition-all duration-500 ease-in-out overflow-hidden",
                          showTutorial ? "max-h-96 opacity-100 mt-4" : "max-h-0 opacity-0"
                        )}>
                          <TutorialCard
                            title={currentTutorial.title}
                            description={currentTutorial.description}
                            steps={currentTutorial.steps}
                            tips={currentTutorial.tips || []}
                            variant="compact"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 连接钱包提示 */}
                  {!connected && (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-700 flex items-center justify-center">
                        <ShieldAlert className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-xl font-bold text-white mb-3 bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                        {t.common.pleaseConnectWallet}
                      </h3>
                      <p className="text-sm text-slate-400 mb-8 max-w-xs mx-auto leading-relaxed">
                        {t.common.connectWalletDesc}
                      </p>
                      <ConnectWalletButton />
                    </div>
                  )}

                  {/* 功能标签页 */}
                  {connected && (
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      {/* 移动端统一功能网格 */}
                      <div className="lg:hidden grid grid-cols-3 gap-3">
                        <button
                          onClick={() => setActiveTab("swap")}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl text-xs font-semibold transition-all duration-300 backdrop-blur-sm",
                            activeTab === "swap"
                              ? "bg-gradient-to-br from-violet-500/20 via-purple-500/15 to-fuchsia-500/20 text-violet-200 border-2 border-violet-400/40 shadow-lg shadow-violet-500/20"
                              : "bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-700/40 hover:border-slate-600/60"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                            activeTab === "swap"
                              ? "bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-md"
                              : "bg-slate-700/50 text-slate-400"
                          )}>
                            <ArrowLeftRight className="h-4 w-4" />
                          </div>
                          <span className="leading-tight">{t.nav.swap}</span>
                        </button>
                        <button
                          onClick={() => setActiveTab("createPool")}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl text-xs font-semibold transition-all duration-300 backdrop-blur-sm",
                            activeTab === "createPool"
                              ? "bg-gradient-to-br from-violet-500/20 via-purple-500/15 to-fuchsia-500/20 text-violet-200 border-2 border-violet-400/40 shadow-lg shadow-violet-500/20"
                              : "bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-700/40 hover:border-slate-600/60"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                            activeTab === "createPool"
                              ? "bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-md"
                              : "bg-slate-700/50 text-slate-400"
                          )}>
                            <Droplets className="h-4 w-4" />
                          </div>
                          <span className="leading-tight">{t.nav.createPool}</span>
                        </button>
                        <button
                          onClick={() => setActiveTab("addLiquidity")}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl text-xs font-semibold transition-all duration-300 backdrop-blur-sm",
                            activeTab === "addLiquidity"
                              ? "bg-gradient-to-br from-violet-500/20 via-purple-500/15 to-fuchsia-500/20 text-violet-200 border-2 border-violet-400/40 shadow-lg shadow-violet-500/20"
                              : "bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-700/40 hover:border-slate-600/60"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                            activeTab === "addLiquidity"
                              ? "bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-md"
                              : "bg-slate-700/50 text-slate-400"
                          )}>
                            <Plus className="h-4 w-4" />
                          </div>
                          <span className="leading-tight">{t.nav.addLiquidity}</span>
                        </button>
                        <button
                          onClick={() => setActiveTab("removeLiquidity")}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl text-xs font-semibold transition-all duration-300 backdrop-blur-sm",
                            activeTab === "removeLiquidity"
                              ? "bg-gradient-to-br from-violet-500/20 via-purple-500/15 to-fuchsia-500/20 text-violet-200 border-2 border-violet-400/40 shadow-lg shadow-violet-500/20"
                              : "bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-700/40 hover:border-slate-600/60"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                            activeTab === "removeLiquidity"
                              ? "bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-md"
                              : "bg-slate-700/50 text-slate-400"
                          )}>
                            <Minus className="h-4 w-4" />
                          </div>
                          <span className="leading-tight">{t.nav.removeLiquidity}</span>
                        </button>
                        <button
                          onClick={() => setActiveTab("rewards")}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl text-xs font-semibold transition-all duration-300 backdrop-blur-sm",
                            activeTab === "rewards"
                              ? "bg-gradient-to-br from-violet-500/20 via-purple-500/15 to-fuchsia-500/20 text-violet-200 border-2 border-violet-400/40 shadow-lg shadow-violet-500/20"
                              : "bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-700/40 hover:border-slate-600/60"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                            activeTab === "rewards"
                              ? "bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-md"
                              : "bg-slate-700/50 text-slate-400"
                          )}>
                            <Trophy className="h-4 w-4" />
                          </div>
                          <span className="leading-tight">{t.nav.rewards}</span>
                        </button>
                        <button
                          onClick={() => setActiveTab("admin")}
                          className={cn(
                            "flex flex-col items-center gap-2 p-4 rounded-xl text-xs font-semibold transition-all duration-300 backdrop-blur-sm",
                            activeTab === "admin"
                              ? "bg-gradient-to-br from-violet-500/20 via-purple-500/15 to-fuchsia-500/20 text-violet-200 border-2 border-violet-400/40 shadow-lg shadow-violet-500/20"
                              : "bg-slate-800/40 text-slate-400 hover:text-white hover:bg-slate-800/60 border border-slate-700/40 hover:border-slate-600/60"
                          )}
                        >
                          <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                            activeTab === "admin"
                              ? "bg-gradient-to-br from-violet-500 to-purple-500 text-white shadow-md"
                              : "bg-slate-700/50 text-slate-400"
                          )}>
                            <Settings className="h-4 w-4" />
                          </div>
                          <span className="leading-tight">{t.nav.admin}</span>
                        </button>
                      </div>

                      {/* 内容区域 */}
                      <TabsContent value="swap" className="border-0 p-0 mt-6">
                        <SwapTab />
                      </TabsContent>
                      <TabsContent value="createPool" className="border-0 p-0 mt-6">
                        <CreatePoolTab />
                      </TabsContent>
                      <TabsContent value="addLiquidity" className="border-0 p-0 mt-6">
                        <AddLiquidityTab />
                      </TabsContent>
                      <TabsContent value="removeLiquidity" className="border-0 p-0 mt-6">
                        <RemoveLiquidityTab />
                      </TabsContent>
                      <TabsContent value="rewards" className="border-0 p-0 mt-6">
                        <RewardsTab />
                      </TabsContent>
                      <TabsContent value="admin" className="border-0 p-0 mt-6">
                        <AdminTab />
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
              </Card>

              {/* Mobile Footer */}
              <div className="lg:hidden p-6 text-center bg-slate-900/90 border-t border-slate-800/50 backdrop-blur-md">
                <div className="text-xs text-slate-500 leading-relaxed">
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

            {/* Tutorial Card - 移动到右侧 */}
            {connected && currentTutorial && (
              <div className="hidden lg:block lg:w-80 lg:flex-shrink-0">
                <div className="sticky top-8">
                  {/* 教程标题栏 */}
                  <div className="mb-4">
                    <Button
                      variant="ghost"
                      onClick={() => setShowTutorial(!showTutorial)}
                      className="w-full justify-between bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 backdrop-blur-sm text-white hover:text-white h-12 rounded-xl transition-all duration-300"
                    >
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-violet-400" />
                        <span className="font-medium">{t.common.tutorialGuide}</span>
                      </div>
                      {showTutorial ? (
                        <ChevronUp className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      )}
                    </Button>
                  </div>
                  
                  {/* 可折叠的教程内容 */}
                  <div className={cn(
                    "transition-all duration-500 ease-in-out overflow-hidden",
                    showTutorial ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
                  )}>
                    <TutorialCard
                      title={currentTutorial.title}
                      description={currentTutorial.description}
                      steps={currentTutorial.steps}
                      tips={currentTutorial.tips || []}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
