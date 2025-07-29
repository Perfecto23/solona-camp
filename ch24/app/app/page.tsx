"use client"

import { ThemeProvider } from "@/components/theme-provider"
import { LanguageProvider } from "@/contexts/language-context"
import { useLanguage } from "@/contexts/language-context"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowRightLeft, Plus, Trophy, Settings, ExternalLink, BookOpen, ArrowRight } from "lucide-react"
import Link from "next/link"

// 客户端渲染 client render
// html <div id="root"></div>
// js 向 root 中插入 html 元素，生成事件、绑定事件（点击、输入、鼠标输入移出...）、CSS绑定
// SEO支持度不好

// 服务端渲染 server render
// html <div id="root">Hello, xxx.</div>
// SEO支持度好
// 渲染快，用户体验好
// 对服务器压力大，需要预渲染
// 框架限制：不能使用 Hooks，不能使用事件
// 访问数据库、访问API、访问服务器本地文件...


export default function Home() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </ThemeProvider>
  )
}

// 创建一个内部组件，在LanguageProvider内部使用useLanguage
function AppContent() {
  // 现在可以安全地使用useLanguage，因为这个组件在LanguageProvider内部渲染
  const { t } = useLanguage()

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-12 lg:py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-2xl">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <h1 className="text-4xl lg:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500">
              {t.home.title}
            </h1>
          </div>
          
          <div className="mb-4">
            <span className="inline-block px-4 py-2 bg-violet-500/20 text-violet-300 rounded-full text-sm font-medium border border-violet-500/30 backdrop-blur-md">
              {t.home.bootcampProject}
            </span>
          </div>
          
          <h2 className="text-xl lg:text-2xl font-semibold text-white mb-4">
            {t.home.subtitle}
          </h2>
          
          <p className="text-lg text-slate-300 max-w-2xl mx-auto mb-8">
            {t.home.description}
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button 
              asChild
              size="lg" 
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white px-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <Link href="/dex" className="flex items-center gap-2">
                {t.home.startUsing}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button 
              size="lg"
              asChild
              className="bg-gradient-to-r from-slate-800/80 to-slate-700/80 border border-violet-500/40 text-violet-200 hover:from-violet-500/20 hover:to-fuchsia-500/20 hover:border-violet-400 hover:text-white backdrop-blur-md shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
            >
              <a href="https://www.soldevcamp.com/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {t.home.visitBootcamp}
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md hover:bg-slate-800/60 transition-all duration-300 hover:scale-105 hover:shadow-xl group">
            <CardHeader className="pb-4">
              <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center mb-3 group-hover:bg-violet-500/30 transition-colors duration-300">
                <ArrowRightLeft className="w-5 h-5 text-violet-400 group-hover:text-violet-300" />
              </div>
              <CardTitle className="text-white text-lg">{t.home.features.swap.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-400">
                {t.home.features.swap.description}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md hover:bg-slate-800/60 transition-all duration-300 hover:scale-105 hover:shadow-xl group">
            <CardHeader className="pb-4">
              <div className="w-10 h-10 rounded-lg bg-indigo-500/20 flex items-center justify-center mb-3 group-hover:bg-indigo-500/30 transition-colors duration-300">
                <Plus className="w-5 h-5 text-indigo-400 group-hover:text-indigo-300" />
              </div>
              <CardTitle className="text-white text-lg">{t.home.features.liquidity.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-400">
                {t.home.features.liquidity.description}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md hover:bg-slate-800/60 transition-all duration-300 hover:scale-105 hover:shadow-xl group">
            <CardHeader className="pb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center mb-3 group-hover:bg-purple-500/30 transition-colors duration-300">
                <Trophy className="w-5 h-5 text-purple-400 group-hover:text-purple-300" />
              </div>
              <CardTitle className="text-white text-lg">{t.home.features.rewards.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-400">
                {t.home.features.rewards.description}
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-slate-900/60 border-slate-800 backdrop-blur-md hover:bg-slate-800/60 transition-all duration-300 hover:scale-105 hover:shadow-xl group">
            <CardHeader className="pb-4">
              <div className="w-10 h-10 rounded-lg bg-fuchsia-500/20 flex items-center justify-center mb-3 group-hover:bg-fuchsia-500/30 transition-colors duration-300">
                <Settings className="w-5 h-5 text-fuchsia-400 group-hover:text-fuchsia-300" />
              </div>
              <CardTitle className="text-white text-lg">{t.home.features.admin.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-slate-400">
                {t.home.features.admin.description}
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* 教学特色部分 */}
        <div className="text-center mb-12">
          <h3 className="text-2xl lg:text-3xl font-bold text-white mb-6">
            {t.home.whyChooseOurPlatform}
          </h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-violet-500 to-purple-600 flex items-center justify-center shadow-2xl group-hover:shadow-violet-500/50 transition-all duration-300 group-hover:scale-110">
                <BookOpen className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">{t.home.educationalOriented.title}</h4>
              <p className="text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
                {t.home.educationalOriented.description}
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl group-hover:shadow-indigo-500/50 transition-all duration-300 group-hover:scale-110">
                <Settings className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">{t.home.completeExperience.title}</h4>
              <p className="text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
                {t.home.completeExperience.description}
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-fuchsia-500 to-purple-600 flex items-center justify-center shadow-2xl group-hover:shadow-fuchsia-500/50 transition-all duration-300 group-hover:scale-110">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-lg font-semibold text-white mb-2">{t.home.secureReliable.title}</h4>
              <p className="text-slate-400 group-hover:text-slate-300 transition-colors duration-300">
                {t.home.secureReliable.description}
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <div className="max-w-3xl mx-auto p-8 rounded-2xl bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 backdrop-blur-md shadow-2xl hover:shadow-violet-500/20 transition-all duration-300">
            <h3 className="text-2xl font-bold text-white mb-4">
              {t.home.readyToStart}
            </h3>
            <p className="text-slate-300 mb-6">
              {t.home.connectAndExperience}
            </p>
            <Button 
              asChild
              size="lg" 
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500 hover:from-violet-600 hover:to-fuchsia-600 text-white px-8 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <Link href="/dex" className="flex items-center gap-2">
                {t.home.startNow}
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
          </div>
        </div>
      </div>

      <footer className="mt-16 py-8 border-t border-slate-800/50 bg-slate-900/40 backdrop-blur-md">
        <div className="container mx-auto px-4 text-center">
          <div className="flex flex-col sm:flex-row justify-center items-center gap-6 mb-4">
            <a 
              href="https://www.soldevcamp.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 transition-all duration-300 flex items-center gap-2 hover:scale-105"
            >
              <BookOpen className="w-4 h-4" />
              {t.home.links.bootcampWebsite}
              <ExternalLink className="w-4 h-4" />
            </a>
            <a 
              href="https://token-manager.soldevcamp.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-violet-400 hover:text-violet-300 transition-all duration-300 flex items-center gap-2 hover:scale-105"
            >
              {t.home.links.tokenManager}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
          <p className="text-sm text-slate-400">
            © {new Date().getFullYear()} {t.home.title}. {t.home.footer}.
          </p>
        </div>
      </footer>
    </main>
  )
}
