import { useLanguage } from "@/contexts/language-context"

export interface TutorialStep {
  step: number
  title: string
  description: string
}

export interface TutorialData {
  title: string
  description: string
  steps: TutorialStep[]
  tips?: string[]
}

export interface TutorialDataMap {
  [key: string]: TutorialData | null
}

// 使用翻译系统的教程数据获取函数
export const getTutorialData = (tab: string): TutorialData | null => {
  // 这里我们需要在组件内部使用useLanguage hook
  // 所以我们需要创建一个hook来获取翻译的教程数据
  return null // 占位符，将在useTutorialData hook中实现
}

// 新的hook来获取翻译的教程数据
export const useTutorialData = (tab: string): TutorialData | null => {
  const { t } = useLanguage()
  
  const tutorialDataMap: TutorialDataMap = {
    swap: {
      title: t.tutorials.swap.title,
      description: t.tutorials.swap.description,
      steps: t.tutorials.swap.steps,
      tips: t.tutorials.swap.tips
    },
    createPool: {
      title: t.tutorials.createPool.title,
      description: t.tutorials.createPool.description,
      steps: t.tutorials.createPool.steps,
      tips: t.tutorials.createPool.tips
    },
    addLiquidity: {
      title: t.tutorials.addLiquidity.title,
      description: t.tutorials.addLiquidity.description,
      steps: t.tutorials.addLiquidity.steps,
      tips: t.tutorials.addLiquidity.tips
    },
    removeLiquidity: {
      title: t.tutorials.removeLiquidity.title,
      description: t.tutorials.removeLiquidity.description,
      steps: t.tutorials.removeLiquidity.steps,
      tips: t.tutorials.removeLiquidity.tips
    },
    rewards: {
      title: t.tutorials.rewards.title,
      description: t.tutorials.rewards.description,
      steps: t.tutorials.rewards.steps,
      tips: t.tutorials.rewards.tips
    },
    admin: {
      title: t.tutorials.admin.title,
      description: t.tutorials.admin.description,
      steps: t.tutorials.admin.steps,
      tips: t.tutorials.admin.tips
    }
  }
  
  return tutorialDataMap[tab] || null
} 