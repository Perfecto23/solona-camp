"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BookOpen, Info, Lightbulb, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLanguage } from "@/contexts/language-context"

interface TutorialStep {
  step: number
  title: string
  description: string
}

interface TutorialCardProps {
  title: string
  description: string
  steps: TutorialStep[]
  tips?: string[]
  className?: string
  variant?: "default" | "compact"
}

export function TutorialCard({ 
  title, 
  description, 
  steps, 
  tips = [], 
  className,
  variant = "default" 
}: TutorialCardProps) {
  const { t } = useLanguage()

  if (variant === "compact") {
    return (
      <Card className={cn("bg-slate-800/60 border-slate-700/60 backdrop-blur-xl shadow-xl shadow-slate-900/20", className)}>
        {/* 紧凑版头部 */}
        <CardHeader className="pb-3 pt-4 px-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-400/30 flex items-center justify-center">
              <BookOpen className="w-4 h-4 text-violet-300" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-sm font-bold text-white leading-tight">{title}</CardTitle>
            </div>
            <Badge className="bg-violet-500/20 text-violet-300 border-violet-400/30 text-xs px-2 py-0.5">
              <Sparkles className="w-2.5 h-2.5 mr-1" />
              {t.common.tutorial}
            </Badge>
          </div>
          <CardDescription className="text-slate-300 text-xs leading-snug mt-1">
            {description}
          </CardDescription>
        </CardHeader>
        
        <CardContent className="px-4 pb-4 space-y-3">
          {/* 步骤区域 - 移动端紧凑显示 */}
          <div>
            <h4 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
              <Info className="w-3 h-3 text-blue-300" />
              {t.common.operationSteps}
            </h4>
            <div className="grid grid-cols-1 gap-1">
              {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-2 p-1.5 rounded bg-slate-800/30 border border-slate-700/30">
                  <div className="w-5 h-5 rounded bg-violet-500/30 text-violet-300 text-xs flex items-center justify-center flex-shrink-0 font-bold">
                    {step.step}
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-medium text-white">{step.title}</span>
                    <span className="text-xs text-slate-400 ml-1">- {step.description}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 提示区域 - 移动端紧凑显示 */}
          {tips.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
                <Lightbulb className="w-3 h-3 text-amber-300" />
                {t.common.practicalTips}
              </h4>
              <div className="space-y-1">
                {tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-1.5 p-1.5 rounded bg-amber-500/5 border border-amber-400/20">
                    <div className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                    <p className="text-xs text-slate-300 leading-snug">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={cn("bg-slate-800/60 border-slate-700/60 backdrop-blur-xl shadow-xl shadow-slate-900/20", className)}>
      {/* 极简头部 */}
      <CardHeader className="pb-3 pt-4 px-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 border border-violet-400/30 flex items-center justify-center">
            <BookOpen className="w-4 h-4 text-violet-300" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base font-bold text-white leading-tight">{title}</CardTitle>
          </div>
          <Badge className="bg-violet-500/20 text-violet-300 border-violet-400/30 text-xs px-2 py-0.5">
            <Sparkles className="w-2.5 h-2.5 mr-1" />
            {t.common.tutorial}
          </Badge>
        </div>
        <CardDescription className="text-slate-300 text-xs leading-snug mt-1">
          {description}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="px-4 pb-4 space-y-3">
        {/* 步骤区域 - 超紧凑设计 */}
        <div>
          <h4 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
            <Info className="w-3 h-3 text-blue-300" />
            {t.common.operationSteps}
          </h4>
          <div className="grid grid-cols-1 gap-1">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center gap-2 p-1.5 rounded bg-slate-800/30 border border-slate-700/30">
                <div className="w-5 h-5 rounded bg-violet-500/30 text-violet-300 text-xs flex items-center justify-center flex-shrink-0 font-bold">
                  {step.step}
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-xs font-medium text-white">{step.title}</span>
                  <span className="text-xs text-slate-400 ml-1">- {step.description}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 提示区域 - 横向布局节省空间 */}
        {tips.length > 0 && (
          <div>
            <h4 className="text-xs font-bold text-slate-200 mb-2 flex items-center gap-1.5">
              <Lightbulb className="w-3 h-3 text-amber-300" />
              {t.common.practicalTips}
            </h4>
            <div className="space-y-1">
              {tips.map((tip, index) => (
                <div key={index} className="flex items-start gap-1.5 p-1.5 rounded bg-amber-500/5 border border-amber-400/20">
                  <div className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0 mt-1.5" />
                  <p className="text-xs text-slate-300 leading-snug">{tip}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
} 