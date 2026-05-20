import { NextRequest, NextResponse } from "next/server"

// Mapeamento de códigos de idioma
const languageMap: Record<string, string> = {
  pt: "pt",
  en: "en",
  es: "es",
  fr: "fr",
  de: "de",
  it: "it",
  ru: "ru",
  zh: "zh",
  ja: "ja",
  ko: "ko",
  ar: "ar",
  hi: "hi",
  tr: "tr",
  ms: "ms",
}

// Rate limiting simples em memoria
const rateLimits = new Map<string, { count: number; resetTime: number }>()
const RATE_LIMIT = 30 // requests por minuto
const RATE_WINDOW = 60 * 1000 // 1 minuto

function checkRateLimit(ip: string): boolean {
  const now = Date.now()
  const record = rateLimits.get(ip)
  
  if (!record || now > record.resetTime) {
    rateLimits.set(ip, { count: 1, resetTime: now + RATE_WINDOW })
    return true
  }
  
  if (record.count >= RATE_LIMIT) {
    return false
  }
  
  record.count++
  return true
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for") || "unknown"
    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 })
    }

    const { text, targetLang, sourceLang = "auto" } = await request.json()

    if (!text || !targetLang) {
      return NextResponse.json({ error: "Missing parameters" }, { status: 400 })
    }

    // Validar tamanho do texto (max 1000 caracteres)
    if (text.length > 1000) {
      return NextResponse.json({ error: "Text too long" }, { status: 400 })
    }

    // Validar idioma de destino
    if (!languageMap[targetLang]) {
      return NextResponse.json({ error: "Invalid target language" }, { status: 400 })
    }

    // Usar Google Translate API gratuita (não oficial mas funcional)
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sourceLang}&tl=${languageMap[targetLang] || targetLang}&dt=t&q=${encodeURIComponent(text)}`

    const response = await fetch(url)
    const data = await response.json()

    // Extrair texto traduzido
    let translatedText = ""
    if (data && data[0]) {
      for (const item of data[0]) {
        if (item[0]) {
          translatedText += item[0]
        }
      }
    }

    return NextResponse.json({ 
      translatedText: translatedText || text,
      detectedLanguage: data[2] || sourceLang
    })
  } catch (error) {
    console.error("Translation error:", error)
    return NextResponse.json({ error: "Translation failed", translatedText: "" }, { status: 500 })
  }
}
