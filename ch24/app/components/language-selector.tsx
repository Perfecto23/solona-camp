"use client"

import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { useLanguage } from "@/contexts/language-context"

const languages = [
  { code: "zh" as const, name: "中文" },
  { code: "en" as const, name: "English" },
]

export function LanguageSelector() {
  const { language, setLanguage } = useLanguage()

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-8 px-2 text-slate-400 hover:text-white hover:bg-slate-800/50">
          <Globe className="h-4 w-4 mr-1" />
          <span>{languages.find((l) => l.code === language)?.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-slate-900 border-slate-700">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            className={`text-sm ${
              language === lang.code ? "text-violet-400" : "text-slate-300"
            } hover:bg-slate-800 cursor-pointer`}
            onClick={() => setLanguage(lang.code)}
          >
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
