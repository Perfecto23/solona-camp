import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { WalletContextProvider } from "@/contexts/wallet-context"
import { ErrorBoundary } from "@/components/error-boundary"

const inter = Inter({ subsets: ["latin"] })

// 支持多语言的metadata生成
const createMetadata = (lang: 'zh' | 'en' = 'zh'): Metadata => {
  const metadata = {
    zh: {
      title: "Solana DEX - 训练营实战项目",
      description: "专为 Solana 训练营设计的专业 DEX 教学平台。支持代币交换、流动性管理、奖励分发和系统管理的完整去中心化交易所功能体验。",
      keywords: ["Solana", "DEX", "训练营", "去中心化交易所", "代币交换", "流动性", "DeFi"],
      generator: 'Solana 训练营',
      author: "Solana 训练营",
      creator: "Solana 训练营",
      publisher: "Solana 训练营",
    },
    en: {
      title: "Solana DEX - Bootcamp Practical Project",
      description: "Professional DEX learning platform designed for Solana Bootcamp. Supporting token swaps, liquidity management, reward distribution, and system administration in a comprehensive DeFi learning experience.",
      keywords: ["Solana", "DEX", "Bootcamp", "Decentralized Exchange", "Token Swap", "Liquidity", "DeFi"],
      generator: 'Solana Bootcamp',
      author: "Solana Bootcamp",
      creator: "Solana Bootcamp",
      publisher: "Solana Bootcamp",
    }
  }

  const meta = metadata[lang]
  
  return {
    title: meta.title,
    description: meta.description,
    keywords: meta.keywords,
    generator: meta.generator,
    authors: [{ name: meta.author }],
    creator: meta.creator,
    publisher: meta.publisher,
    applicationName: "Solana DEX",
    openGraph: {
      title: meta.title,
      description: meta.description,
      type: "website",
      locale: lang === 'zh' ? "zh_CN" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title: meta.title,
      description: meta.description,
    },
    alternates: {
      languages: {
        'zh-CN': '/',
        'en': '/en',
      }
    }
  }
}

// 默认使用中文metadata，但支持通过环境变量或其他方式切换
export const metadata: Metadata = createMetadata('zh')

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="theme-color" content="#0f172a" />
        <link rel="icon" href="/favicon.ico" />
      </head>
      <body className={inter.className}>
        <ErrorBoundary>
          <WalletContextProvider>
            {children}
            <Toaster />
          </WalletContextProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
