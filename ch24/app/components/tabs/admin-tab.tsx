"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { PublicKey } from '@solana/web3.js';
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ShieldAlert, Save, AlertTriangle, PauseCircle, PlayCircle, Percent, Wallet } from "lucide-react"
import { useWallet } from "@/components/wallet-provider"
import { useToast } from "@/hooks/use-toast"
import { useLanguage } from "@/contexts/language-context"
import { useDex } from "@/hooks/use-dex"
import { RefreshButton } from "@/components/refresh-button"

export function AdminTab() {
  const { connected, publicKey } = useWallet()
  const { toast } = useToast()
  const { t } = useLanguage()
  const dex = useDex()
  
  // 表单状态
  const [swapFee, setSwapFee] = useState("30") // 基点数，30 = 0.3%
  const [protocolFee, setProtocolFee] = useState("5") // 基点数，5 = 0.05%
  const [feeReceiver, setFeeReceiver] = useState("")
  const [saving, setSaving] = useState(false)
  const [togglePausing, setTogglePausing] = useState(false)
  const [refreshing, setRefreshing] = useState(false)

  // 原始值状态，用于检测是否有修改
  const [originalSwapFee, setOriginalSwapFee] = useState("30")
  const [originalProtocolFee, setOriginalProtocolFee] = useState("5")
  const [originalFeeReceiver, setOriginalFeeReceiver] = useState("")

  // 检查用户是否为管理员
  const isAdmin = connected && dex.globalConfig && publicKey && 
    dex.globalConfig.admin === publicKey.toString()

  // 检查费率设置是否有修改
  const hasFeeRateChanges = swapFee !== originalSwapFee || protocolFee !== originalProtocolFee

  // 检查收款账户是否有修改
  const hasFeeReceiverChanges = feeReceiver !== originalFeeReceiver

  // 页面加载时获取全局配置
  useEffect(() => {
    if (connected) {
      dex.fetchGlobalConfig()
    }
  }, [connected])

  // 当全局配置加载后，更新表单状态
  useEffect(() => {
    if (dex.globalConfig) {
      if (dex.globalConfig.swapFeeRate !== null) {
        const swapFeeValue = dex.globalConfig.swapFeeRate.toString()
        setSwapFee(swapFeeValue)
        setOriginalSwapFee(swapFeeValue)
      }
      if (dex.globalConfig.protocolFeeRate !== null) {
        const protocolFeeValue = dex.globalConfig.protocolFeeRate.toString()
        setProtocolFee(protocolFeeValue)
        setOriginalProtocolFee(protocolFeeValue)
      }
      if (dex.globalConfig.protocolFeeAccount) {
        const feeReceiverValue = dex.globalConfig.protocolFeeAccount
        setFeeReceiver(feeReceiverValue)
        setOriginalFeeReceiver(feeReceiverValue)
      }
    }
  }, [dex.globalConfig])

  // 刷新配置
  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await dex.fetchGlobalConfig()
    } finally {
      setRefreshing(false)
    }
  }

  // 初始化全局配置
  const handleInitGlobalConfig = async () => {
    if (!publicKey || !dex.initializeGlobalConfig) return
    
    setSaving(true)
    try {
      const protocolFeeAccount = feeReceiver ? new PublicKey(feeReceiver) : publicKey
      const result = await dex.initializeGlobalConfig(
        parseInt(swapFee),
        parseInt(protocolFee),
        protocolFeeAccount
      )
      
      if (result && result !== '') {
        // 检查是否是模拟失败但实际成功的情况
        const isSimulatedFailure = result === 'success-but-simulated-failed';
        
        toast({
          variant: isSimulatedFailure ? "default" : "success",
          title: isSimulatedFailure ? "初始化可能成功" : t.admin.initializeSuccess,
          description: isSimulatedFailure 
            ? "交易已提交但模拟失败，请手动刷新查看最新状态" 
            : t.admin.initializeSuccessDesc.replace("{0}", result.slice(0, 8) + "..."),
        })
        
        // 无论如何都刷新配置
        setTimeout(() => dex.fetchGlobalConfig(), 2000)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t.admin.initializeFailed,
        description: t.admin.initializeFailedDesc,
      })
    } finally {
      setSaving(false)
    }
  }

  // 批量保存设置
  const handleSaveSettings = async () => {
    if (!dex.updateFeeRates) return
    
    setSaving(true)
    try {
      const result = await dex.updateFeeRates(parseInt(swapFee), parseInt(protocolFee))
      
      if (result && result !== '') {
        // 检查是否是模拟失败但实际成功的情况
        const isSimulatedFailure = result === 'success-but-simulated-failed';
        
        toast({
          variant: isSimulatedFailure ? "default" : "success",
          title: isSimulatedFailure ? "设置保存可能成功" : t.admin.saveSettingsSuccess,
          description: isSimulatedFailure 
            ? "交易已提交但模拟失败，请手动刷新查看最新状态" 
            : t.admin.saveSettingsSuccessDesc
                .replace("{0}", (parseInt(swapFee) / 100).toString())
                .replace("{1}", (parseInt(protocolFee) / 100).toString()),
        })
        
        // 成功后重置原始值，使按钮被禁用
        if (!isSimulatedFailure) {
          setOriginalSwapFee(swapFee)
          setOriginalProtocolFee(protocolFee)
        }
        
        // 无论如何都刷新配置
        setTimeout(() => dex.fetchGlobalConfig(), 2000)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t.admin.saveSettingsError,
        description: t.admin.saveSettingsErrorDesc,
      })
    } finally {
      setSaving(false)
    }
  }

  // 更新协议收款账户
  const handleUpdateFeeReceiver = async () => {
    if (!feeReceiver || !dex.updateProtocolFeeAccount) return
    
    setSaving(true)
    try {
      const newAccount = new PublicKey(feeReceiver)
      const result = await dex.updateProtocolFeeAccount(newAccount)
      
      if (result && result !== '') {
        // 检查是否是模拟失败但实际成功的情况
        const isSimulatedFailure = result === 'success-but-simulated-failed';
        
        toast({
          variant: isSimulatedFailure ? "default" : "success",
          title: isSimulatedFailure ? "更新可能成功" : t.admin.updateFeeReceiverSuccess,
          description: isSimulatedFailure 
            ? "交易已提交但模拟失败，请手动刷新查看最新状态" 
            : t.admin.updateFeeReceiverSuccessDesc.replace("{0}", feeReceiver.slice(0, 8) + "..."),
        })
        
        // 成功后重置原始值，使按钮被禁用
        if (!isSimulatedFailure) {
          setOriginalFeeReceiver(feeReceiver)
        }
        
        // 无论如何都刷新配置
        setTimeout(() => dex.fetchGlobalConfig(), 2000)
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: t.admin.updateFailed,
        description: t.admin.checkAddressFormat,
      })
    } finally {
      setSaving(false)
    }
  }

  // 暂停/恢复系统
  const handleTogglePause = async () => {
    if (togglePausing || dex.loading || !dex.togglePause) {
      console.log('操作正在进行中或方法不可用，忽略重复请求');
      return;
    }
    
    setTogglePausing(true)
    const newState = !dex.globalConfig?.isPaused
    
    // 确保配置已加载
    if (!dex.globalConfig) {
      toast({
        variant: "destructive",
        title: "配置未加载",
        description: "请先刷新配置信息",
      })
      setTogglePausing(false)
      return;
    }
    
    console.log('切换系统状态:', { 
      当前状态: dex.globalConfig.isPaused ? '暂停' : '运行',
      目标状态: newState ? '暂停' : '运行',
      配置信息: dex.globalConfig
    });
    
    try {
      const result = await dex.togglePause(newState)
      
      if (result && result !== '') {
        // 检查是否是模拟失败但实际成功的情况
        const isSimulatedFailure = result === 'success-but-simulated-failed';
        
        toast({
          variant: isSimulatedFailure ? "default" : (newState ? "warning" : "success"),
          title: isSimulatedFailure ? "操作可能成功" : (newState ? t.admin.pauseTradingSuccess : t.admin.resumeTradingSuccess),
          description: isSimulatedFailure 
            ? "交易已提交但模拟失败，请手动刷新查看最新状态" 
            : (newState ? t.admin.pauseTradingSuccessDesc : t.admin.resumeTradingSuccessDesc),
        })
        
        // 无论如何都刷新配置
        setTimeout(() => dex.fetchGlobalConfig(), 2000)
      }
    } catch (error) {
      console.error('暂停/恢复操作失败:', error);
      toast({
        variant: "destructive",
        title: t.admin.pauseTradingError,
        description: error instanceof Error ? error.message : t.admin.pauseTradingErrorDesc,
      })
    } finally {
      setTogglePausing(false)
    }
  }

  // 处理交换费率输入
  const handleSwapFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === "" || /^\d+$/.test(val)) {
      const num = parseInt(val) || 0
      if (num <= 10000) { // 最大100%
        setSwapFee(val)
      }
    }
  }

  // 处理协议费率输入
  const handleProtocolFeeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (val === "" || /^\d+$/.test(val)) {
      const num = parseInt(val) || 0
      const maxProtocolFee = parseInt(swapFee) || 0
      if (num <= maxProtocolFee) {
        setProtocolFee(val)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold text-white bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500">
          {t.admin.title}
        </h3>
        <RefreshButton
          onClick={handleRefresh}
          loading={refreshing}
        />
      </div>

      {!connected ? (
        <div className="text-center py-8">
          <ShieldAlert className="h-12 w-12 mx-auto mb-4 text-slate-400" />
          <h3 className="text-lg font-medium text-white mb-2">{t.common.pleaseConnectWallet}</h3>
          <p className="text-slate-400 mb-6">{t.common.connectWalletDesc}</p>
        </div>
      ) : !dex.globalConfig ? (
        <Card className="bg-slate-800/30 border-slate-700">
          <CardContent className="p-4 space-y-4">
            <div className="text-center py-4">
              <AlertTriangle className="h-8 w-8 mx-auto mb-2 text-amber-400" />
              <h4 className="text-lg font-medium text-white mb-2">{t.admin.globalConfigNotInitialized}</h4>
              <p className="text-slate-400 text-sm mb-4">{t.admin.needInitializeFirst}</p>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="initSwapFee" className="text-sm font-medium text-slate-200">
                  {t.admin.swapFeeBasicPoints}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="initSwapFee"
                    value={swapFee}
                    onChange={handleSwapFeeChange}
                    placeholder="30"
                    className="bg-slate-800 border-slate-700 text-slate-200 focus-visible:ring-violet-500"
                  />
                  <span className="text-slate-400 text-sm">= {(parseInt(swapFee) / 100 || 0)}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="initProtocolFee" className="text-sm font-medium text-slate-200">
                  {t.admin.protocolFeeBasicPoints}
                </Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="initProtocolFee"
                    value={protocolFee}
                    onChange={handleProtocolFeeChange}
                    placeholder="5"
                    className="bg-slate-800 border-slate-700 text-slate-200 focus-visible:ring-violet-500"
                  />
                  <span className="text-slate-400 text-sm">= {(parseInt(protocolFee) / 100 || 0)}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="initFeeReceiver" className="text-sm font-medium text-slate-200">
                  {t.admin.protocolFeeAccount}
                </Label>
                <Input
                  id="initFeeReceiver"
                  value={feeReceiver}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFeeReceiver(e.target.value)}
                  placeholder={publicKey?.toString() || ""}
                  className="bg-slate-800 border-slate-700 text-slate-200 focus-visible:ring-violet-500 font-mono text-xs"
                />
                {publicKey && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFeeReceiver(publicKey.toString())}
                    className="text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                  >
                    {t.admin.useCurrentWallet}
                  </Button>
                )}
              </div>

              <Button
                onClick={handleInitGlobalConfig}
                disabled={saving || dex.loading || !feeReceiver}
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
              >
                {saving ? t.admin.initializing : t.admin.initializeGlobalConfig}
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : !isAdmin ? (
        <div className="text-center py-8">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4 text-amber-400" />
          <h3 className="text-lg font-medium text-white mb-2">{t.common.noAdminAccess}</h3>
          <p className="text-slate-400 mb-6">{t.common.noAdminAccessDesc}</p>
          <div className="text-xs text-slate-500 space-y-1">
            <p>{t.admin.currentAdmin}: {dex.globalConfig.admin}</p>
            <p>{t.admin.yourWallet}: {publicKey?.toString()}</p>
          </div>
        </div>
      ) : (
        <>
          {/* 系统状态显示 */}
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="p-4">
              <h4 className="text-lg font-medium text-slate-200 mb-3">{t.admin.systemStatus}</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-slate-400">{t.admin.swapFee}:</span>
                  <span className="ml-2 text-slate-200">
                    {dex.globalConfig.swapFeeRate ? `${dex.globalConfig.swapFeeRate / 100}%` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">{t.admin.protocolFee}:</span>
                  <span className="ml-2 text-slate-200">
                    {dex.globalConfig.protocolFeeRate ? `${dex.globalConfig.protocolFeeRate / 100}%` : 'N/A'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">{t.admin.currentStatus}:</span>
                  <span className={`ml-2 font-medium ${dex.globalConfig.isPaused ? 'text-red-400' : 'text-green-400'}`}>
                    {dex.globalConfig.isPaused ? t.admin.paused : t.admin.running}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400">{t.admin.feeReceiver}:</span>
                  <span className="ml-2 text-slate-200 font-mono text-xs">
                    {dex.globalConfig.protocolFeeAccount ? 
                      `${dex.globalConfig.protocolFeeAccount.slice(0, 8)}...` : 'N/A'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* 费率设置 */}
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="p-4 space-y-4">
              <h4 className="text-lg font-medium text-slate-200">{t.admin.feeSettings}</h4>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-slate-400" />
                  <Label htmlFor="swapFee" className="text-sm font-medium text-slate-200">
                    {t.admin.swapFeeBasicPoints}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id="swapFee"
                    value={swapFee}
                    onChange={handleSwapFeeChange}
                    className="bg-slate-800 border-slate-700 text-slate-200 focus-visible:ring-violet-500"
                  />
                  <span className="text-slate-400 text-sm">= {(parseInt(swapFee) / 100 || 0)}%</span>
                </div>
                <p className="text-xs text-slate-400">
                  {t.admin.current}: {dex.globalConfig.swapFeeRate ? `${dex.globalConfig.swapFeeRate / 100}%` : 'N/A'}
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Percent className="h-4 w-4 text-slate-400" />
                  <Label htmlFor="protocolFee" className="text-sm font-medium text-slate-200">
                    {t.admin.protocolFeeBasicPoints}
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    id="protocolFee"
                    value={protocolFee}
                    onChange={handleProtocolFeeChange}
                    className="bg-slate-800 border-slate-700 text-slate-200 focus-visible:ring-violet-500"
                  />
                  <span className="text-slate-400 text-sm">= {(parseInt(protocolFee) / 100 || 0)}%</span>
                </div>
                <p className="text-xs text-slate-400">
                  {t.admin.current}: {dex.globalConfig.protocolFeeRate ? `${dex.globalConfig.protocolFeeRate / 100}%` : 'N/A'}
                </p>
              </div>

              <Button
                onClick={handleSaveSettings}
                disabled={saving || dex.loading || !hasFeeRateChanges}
                className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
              >
                {saving ? (
                  <>
                    <Save className="mr-2 h-4 w-4 animate-pulse" />
                    {t.common.saving}
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    {t.admin.saveSettings}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* 协议收款账户 */}
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="p-4 space-y-4">
              <h4 className="text-lg font-medium text-slate-200">{t.admin.protocolFeeAccountSettings}</h4>
              
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-slate-400" />
                  <Label htmlFor="feeReceiver" className="text-sm font-medium text-slate-200">
                    {t.admin.newFeeReceiverAddress}
                  </Label>
                </div>
                <Input
                  id="feeReceiver"
                  value={feeReceiver}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFeeReceiver(e.target.value)}
                  className="bg-slate-800 border-slate-700 text-slate-200 focus-visible:ring-violet-500 font-mono text-xs"
                />
                <p className="text-xs text-slate-400">
                  {t.admin.current}: {dex.globalConfig.protocolFeeAccount || 'N/A'}
                </p>
              </div>

              <Button
                onClick={handleUpdateFeeReceiver}
                disabled={saving || dex.loading || !feeReceiver || !hasFeeReceiverChanges}
                className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
              >
                {saving ? t.admin.updating : t.admin.updateFeeReceiver}
              </Button>
            </CardContent>
          </Card>

          {/* 紧急控制 */}
          <Card className="bg-slate-800/30 border-slate-700">
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-medium text-slate-200 mb-1">{t.common.emergencyControl}</h4>
                  <p className="text-xs text-slate-400">
                    {t.common.currentStatus}: {dex.globalConfig.isPaused ? t.common.paused : t.common.running}
                  </p>
                </div>
                <Button
                  variant={dex.globalConfig.isPaused ? "default" : "destructive"}
                  onClick={handleTogglePause}
                  disabled={togglePausing || dex.loading}
                  className={dex.globalConfig.isPaused ? "bg-emerald-600 hover:bg-emerald-700" : "bg-red-600 hover:bg-red-700"}
                >
                  {togglePausing ? (
                    t.common.processing
                  ) : dex.globalConfig.isPaused ? (
                    <>
                      <PlayCircle className="mr-2 h-4 w-4" />
                      {t.common.resumeTrading}
                    </>
                  ) : (
                    <>
                      <PauseCircle className="mr-2 h-4 w-4" />
                      {t.common.pauseTrading}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
