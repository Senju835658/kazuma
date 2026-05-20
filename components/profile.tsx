"use client"

import { useState, useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  User, 
  Camera, 
  Save, 
  Mail, 
  Calendar, 
  Gamepad2, 
  Globe, 
  FileText,
  Check,
  X,
  Upload,
  Image as ImageIcon
} from "lucide-react"

type Member = {
  id: string
  user_id: string
  email: string
  name: string | null
  avatar_url: string | null
  bio: string | null
  game_id: string | null
  language: string | null
  notify_events: boolean
  created_at: string
}

const LANGUAGES = [
  { code: "pt", name: "Portugues" },
  { code: "en", name: "English" },
  { code: "es", name: "Espanol" },
  { code: "fr", name: "Francais" },
  { code: "de", name: "Deutsch" },
  { code: "it", name: "Italiano" },
  { code: "ru", name: "Русский" },
  { code: "zh", name: "中文" },
  { code: "ja", name: "日本語" },
  { code: "ko", name: "한국어" },
  { code: "ar", name: "العربية" },
  { code: "tr", name: "Turkce" },
]

const AVATARS = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Felix",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Aneka",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Max",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Luna",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Leo",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Sara",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Jack",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=Mia",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Robot1",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Robot2",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Robot3",
  "https://api.dicebear.com/7.x/bottts/svg?seed=Robot4",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=Pixel1",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=Pixel2",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=Pixel3",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=Pixel4",
]

type ProfileProps = {
  member: Member
  onUpdate: (member: Member) => void
}

export default function Profile({ member, onUpdate }: ProfileProps) {
  const [name, setName] = useState(member.name || "")
  const [bio, setBio] = useState(member.bio || "")
  const [gameId, setGameId] = useState(member.game_id || "")
  const [language, setLanguage] = useState(member.language || "pt")
  const [avatarUrl, setAvatarUrl] = useState(member.avatar_url || AVATARS[0])
  const [showAvatars, setShowAvatars] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const supabase = createClient()

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validar tipo de arquivo
    if (!file.type.startsWith("image/")) {
      setError("Selecione uma imagem valida")
      return
    }

    // Validar tamanho (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Imagem muito grande (max 10MB)")
      return
    }

    setUploading(true)
    setError("")

    try {
      // Converter para base64 data URL
      const reader = new FileReader()
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string
        setAvatarUrl(dataUrl)
        setUploading(false)
        setShowAvatars(false)
      }
      reader.onerror = () => {
        setError("Erro ao carregar imagem")
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch {
      setError("Erro ao processar imagem")
      setUploading(false)
    }
  }

  const handleSave = async () => {
    if (!name.trim()) {
      setError("Nome e obrigatorio")
      return
    }

    setSaving(true)
    setError("")

    const { data, error: updateError } = await supabase
      .from("members")
      .update({
        name: name.trim(),
        bio: bio.trim() || null,
        game_id: gameId.trim() || null,
        language,
        avatar_url: avatarUrl,
      })
      .eq("id", member.id)
      .select()
      .single()

    if (updateError) {
      setError("Erro ao salvar perfil")
    } else if (data) {
      onUpdate(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    }

    setSaving(false)
  }

  const memberSince = new Date(member.created_at).toLocaleDateString("pt-BR", {
    day: "numeric",
    month: "long",
    year: "numeric"
  })

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header do Perfil */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 mb-6">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative">
            <div className="w-28 h-28 rounded-full bg-[#252525] border-4 border-[#333] overflow-hidden">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-12 h-12 text-gray-500" />
                </div>
              )}
            </div>
            <button
              onClick={() => setShowAvatars(!showAvatars)}
              className="absolute bottom-0 right-0 p-2 bg-red-600 hover:bg-red-700 rounded-full transition-colors"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Info Basica */}
          <div className="flex-1 text-center sm:text-left">
            <h2 className="text-2xl font-bold">{member.name || "Sem nome"}</h2>
            <p className="text-gray-500 text-sm flex items-center justify-center sm:justify-start gap-2 mt-2">
              <Calendar className="w-4 h-4" />
              Membro desde {memberSince}
            </p>
          </div>
        </div>

        {/* Seletor de Avatar */}
        {showAvatars && (
          <div className="mt-6 p-4 bg-[#0d0d0d] rounded-lg border border-[#333]">
            {/* Upload de foto */}
            <div className="mb-4 pb-4 border-b border-[#333]">
              <h4 className="text-sm font-medium mb-3 text-gray-400">Enviar foto da galeria</h4>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="w-full px-4 py-3 bg-[#252525] hover:bg-[#333] border border-[#444] border-dashed rounded-lg transition-colors flex items-center justify-center gap-2 text-gray-400 hover:text-white"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-gray-400/30 border-t-gray-400 rounded-full animate-spin" />
                    Carregando...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Escolher foto (max 10MB)
                  </>
                )}
              </button>
            </div>
            
            <h4 className="text-sm font-medium mb-3 text-gray-400">Ou escolha um avatar</h4>
            <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
              {AVATARS.map((avatar, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setAvatarUrl(avatar)
                    setShowAvatars(false)
                  }}
                  className={`w-12 h-12 rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${
                    avatarUrl === avatar ? "border-red-500" : "border-transparent"
                  }`}
                >
                  <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Formulario */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6 space-y-5">
        <h3 className="text-lg font-semibold mb-4">Editar Perfil</h3>

        {/* Nome */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <User className="w-4 h-4 inline mr-2" />
            Nome
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Seu nome no jogo"
            className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
            maxLength={50}
          />
        </div>

        {/* ID do Jogo */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <Gamepad2 className="w-4 h-4 inline mr-2" />
            ID do Jogo
          </label>
          <input
            type="text"
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            placeholder="Seu ID no jogo (ex: ABC123456)"
            className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
            maxLength={30}
          />
        </div>

        {/* Idioma */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <Globe className="w-4 h-4 inline mr-2" />
            Idioma Preferido
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white focus:outline-none focus:border-red-500 transition-colors"
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.code} value={lang.code}>
                {lang.name}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            Usado para traducao automatica no chat
          </p>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-sm font-medium text-gray-400 mb-2">
            <FileText className="w-4 h-4 inline mr-2" />
            Sobre mim
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Conte um pouco sobre voce..."
            rows={4}
            className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors resize-none"
            maxLength={300}
          />
          <p className="text-xs text-gray-500 mt-1 text-right">
            {bio.length}/300
          </p>
        </div>

        {/* Erro */}
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <X className="w-4 h-4" />
            {error}
          </div>
        )}

        {/* Botao Salvar */}
        <button
          onClick={handleSave}
          disabled={saving}
          className={`w-full py-3 rounded-lg font-medium transition-all flex items-center justify-center gap-2 ${
            saved
              ? "bg-green-600 text-white"
              : "bg-red-600 hover:bg-red-700 text-white"
          }`}
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : saved ? (
            <>
              <Check className="w-5 h-5" />
              Salvo!
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Salvar Perfil
            </>
          )}
        </button>
      </div>

      {/* Card de Preview */}
      <div className="mt-6 bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
        <h3 className="text-lg font-semibold mb-4">Preview do Perfil</h3>
        <div className="bg-[#0d0d0d] rounded-lg p-4 flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-[#252525] overflow-hidden flex-shrink-0">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User className="w-8 h-8 text-gray-500" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-semibold truncate">{name || "Sem nome"}</span>
              {gameId && (
                <span className="text-xs bg-[#333] px-2 py-0.5 rounded text-gray-400">
                  {gameId}
                </span>
              )}
            </div>
            <p className="text-gray-400 text-sm mt-1 line-clamp-2">
              {bio || "Nenhuma descricao"}
            </p>
            <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                {LANGUAGES.find(l => l.code === language)?.name || "Portugues"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
