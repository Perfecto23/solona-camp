"use client"

import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { Button } from "@/components/ui/button"
import { Loader2, Wallet } from "lucide-react"
import { useLanguage } from "@/contexts/language-context"

// 重新导出useWallet钩子以便其他组件可以使用
export { useWallet } from '@solana/wallet-adapter-react';

// 自定义钱包连接按钮组件 - 使用官方WalletMultiButton避免钱包选择错误
export function ConnectWalletButton() {
  const { connected, publicKey } = useWallet();
  const { t } = useLanguage();

  return (
    <WalletMultiButton
      style={{
        background: connected 
          ? 'rgba(71, 85, 105, 0.5)' // slate-600/50 for connected state
          : 'linear-gradient(to right, rgb(124, 58, 237), rgb(192, 38, 211))', // violet to fuchsia gradient
        border: connected ? '1px solid rgb(51, 65, 85)' : 'none', // slate-700 border when connected
        borderRadius: '6px',
        color: 'white',
        fontSize: '14px',
        fontWeight: '500',
        height: '40px',
        padding: '0 16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        transition: 'all 0.2s ease-in-out',
      }}
    >
      {connected ? (
        <>
          <Wallet style={{ width: '16px', height: '16px' }} />
          {publicKey ? `${publicKey.toString().slice(0, 6)}...${publicKey.toString().slice(-4)}` : t.common.disconnect}
        </>
      ) : (
        <>
          <Wallet style={{ width: '16px', height: '16px' }} />
          {t.common.connectWallet}
        </>
      )}
    </WalletMultiButton>
  )
}

// 如果需要完全自定义的按钮，可以使用这个版本（但需要手动处理钱包选择）
export function CustomConnectWalletButton() {
  const { connected, connecting, select, wallets, publicKey, disconnect } = useWallet();
  const { t } = useLanguage();

  const handleConnect = async () => {
    if (connected) {
      await disconnect();
    } else {
      // 如果只有一个钱包可用，自动选择它
      if (wallets.length === 1) {
        select(wallets[0].adapter.name);
      } else {
        // 这里可以显示钱包选择界面，现在先选择第一个可用的钱包
        const availableWallet = wallets.find(wallet => wallet.readyState === 'Installed');
        if (availableWallet) {
          select(availableWallet.adapter.name);
        } else if (wallets.length > 0) {
          select(wallets[0].adapter.name);
        }
      }
    }
  };

  return (
    <Button
      variant={connected ? "outline" : "default"}
      onClick={handleConnect}
      disabled={connecting}
      className={
        connected 
          ? "bg-slate-800/50 border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white"
          : "bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700"
      }
    >
      {connecting ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {t.common.connecting}
        </>
      ) : connected ? (
        <>
          <Wallet className="mr-2 h-4 w-4" />
          {publicKey ? `${publicKey.toString().slice(0, 6)}...${publicKey.toString().slice(-4)}` : t.common.disconnect}
        </>
      ) : (
        <>
          <Wallet className="mr-2 h-4 w-4" />
          {t.common.connectWallet}
        </>
      )}
    </Button>
  )
}
