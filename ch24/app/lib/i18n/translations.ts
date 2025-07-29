import { zh } from "./zh"
import { en } from "./en"

export const translations = {
  zh,
  en,
}

export type Language = keyof typeof translations
export type TranslationKey = keyof typeof translations.zh
