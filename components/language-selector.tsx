"use client"

import { useEffect, useState } from "react"
import { Globe } from "lucide-react"

declare global {
  interface Window {
    googleTranslateElementInit: () => void
    google: {
      translate: {
        TranslateElement: new (
          options: {
            pageLanguage: string
            includedLanguages?: string
            layout?: number
            autoDisplay?: boolean
          },
          elementId: string
        ) => void
      }
    }
  }
}

const languages = [
  { code: "pt", name: "Português", flag: "🇧🇷" },
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "fr", name: "Français", flag: "🇫🇷" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "it", name: "Italiano", flag: "🇮🇹" },
  { code: "ru", name: "Русский", flag: "🇷🇺" },
  { code: "ja", name: "日本語", flag: "🇯🇵" },
  { code: "ko", name: "한국어", flag: "🇰🇷" },
  { code: "zh-CN", name: "中文", flag: "🇨🇳" },
  { code: "ar", name: "العربية", flag: "🇸🇦" },
  { code: "hi", name: "हिन्दी", flag: "🇮🇳" },
  { code: "tr", name: "Türkçe", flag: "🇹🇷" },
  { code: "ms", name: "Bahasa Melayu", flag: "🇲🇾" },
]

export default function LanguageSelector() {
  const [isOpen, setIsOpen] = useState(false)
  const [currentLang, setCurrentLang] = useState("pt")

  useEffect(() => {
    // Adicionar script do Google Translate
    const addScript = () => {
      const script = document.createElement("script")
      script.src = "//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit"
      script.async = true
      document.body.appendChild(script)
    }

    // Inicializar o Google Translate
    window.googleTranslateElementInit = () => {
      new window.google.translate.TranslateElement(
        {
          pageLanguage: "pt",
          includedLanguages: languages.map(l => l.code).join(","),
          layout: 0,
          autoDisplay: false,
        },
        "google_translate_element"
      )
    }

    addScript()

    return () => {
      // Limpar script quando o componente for desmontado
      const scripts = document.querySelectorAll('script[src*="translate.google.com"]')
      scripts.forEach(s => s.remove())
    }
  }, [])

  const changeLanguage = (langCode: string) => {
    setCurrentLang(langCode)
    setIsOpen(false)

    // Usar a API do Google Translate para mudar o idioma
    const googleFrame = document.querySelector(".goog-te-combo") as HTMLSelectElement
    if (googleFrame) {
      googleFrame.value = langCode
      googleFrame.dispatchEvent(new Event("change"))
    }
  }

  const currentLanguage = languages.find(l => l.code === currentLang) || languages[0]

  return (
    <>
      {/* Container oculto do Google Translate */}
      <div id="google_translate_element" className="hidden" />

      {/* Botão do seletor de idioma */}
      <div className="fixed top-20 right-4 z-50">
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="flex items-center gap-2 px-3 py-2 bg-[#1a1a1a]/90 backdrop-blur border border-[#333] rounded-lg text-sm font-medium text-white hover:bg-[#252525] transition-colors"
          >
            <Globe className="w-4 h-4" />
            <span>{currentLanguage.flag}</span>
            <span className="hidden sm:inline">{currentLanguage.name}</span>
          </button>

          {/* Dropdown de idiomas */}
          {isOpen && (
            <>
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsOpen(false)} 
              />
              <div className="absolute right-0 mt-2 w-48 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto">
                {languages.map((lang) => (
                  <button
                    key={lang.code}
                    onClick={() => changeLanguage(lang.code)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors hover:bg-[#252525] ${
                      currentLang === lang.code 
                        ? "bg-red-600/20 text-red-400" 
                        : "text-gray-300"
                    }`}
                  >
                    <span className="text-lg">{lang.flag}</span>
                    <span>{lang.name}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* CSS para esconder elementos do Google Translate */}
      <style jsx global>{`
        .goog-te-banner-frame,
        .goog-te-gadget-icon,
        #goog-gt-tt,
        .goog-te-balloon-frame,
        .goog-tooltip,
        .goog-tooltip:hover {
          display: none !important;
        }
        
        .goog-text-highlight {
          background-color: transparent !important;
          box-shadow: none !important;
        }

        body {
          top: 0 !important;
        }

        .skiptranslate {
          display: none !important;
        }
      `}</style>
    </>
  )
}
