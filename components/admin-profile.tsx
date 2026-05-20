"use client"

import { useState, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { 
  User, 
  Camera, 
  Save, 
  Mail, 
  Calendar,
  Shield,
  Upload,
  Check,
  X
} from "lucide-react"

const AVATARS = [
  "https://api.dicebear.com/7.x/adventurer/svg?seed=admin1",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=admin2",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=admin3",
  "https://api.dicebear.com/7.x/adventurer/svg?seed=admin4",
  "https://api.dicebear.com/7.x/bottts/svg?seed=admin1",
  "https://api.dicebear.com/7.x/bottts/svg?seed=admin2",
  "https://api.dicebear.com/7.x/bottts/svg?seed=admin3",
  "https://api.dicebear.com/7.x/bottts/svg?seed=admin4",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=admin1",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=admin2",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=admin3",
  "https://api.dicebear.com/7.x/pixel-art/svg?seed=admin4",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=admin1",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=admin2",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=admin3",
  "https://api.dicebear.com/7.x/lorelei/svg?seed=admin4",
]

type Admin = {
  id: string
  user_id: string
  email: string
  role: string
  name: string | null
  avatar_url: string | null
  bio: string | null
  created_at: string
}

type AdminProfileProps = {
  admin: Admin
  onUpdate: (updated: Admin) => void
}

export default function AdminProfile({ admin, onUpdate }: AdminProfileProps) {
  const [name, setName] = useState(admin.name || "")
  const [avatarUrl, setAvatarUrl] = useState(admin.avatar_url || "")
  const [bio, setBio] = useState(admin.bio || "")
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

    if (!file.type.startsWith("image/")) {
      setError("Selecione uma imagem valida")
      return
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Imagem muito grande (max 10MB)")
      return
    }

    setUploading(true)
    setError("")

    try {
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
    setSaving(true)
    setError("")
    setSaved(false)

    const { data, error: updateError } = await supabase
      .from("admins")
      .update({
        name: name.trim() || null,
        avatar_url: avatarUrl || null,
        bio: bio.trim() || null,
      })
      .eq("id", admin.id)
      .select()
      .single()

    if (updateError) {
      setError("Erro ao salvar perfil")
    } else if (data) {
      onUpdate(data)
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    }

    setSaving(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric"
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Coluna Principal */}
      <div className="lg:col-span-2 space-y-6">
        {/* Avatar */}
        <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5 text-yellow-500" />
            Foto de Perfil
          </h4>
          
          <div className="flex items-center gap-6">
            <div className="relative">
              {avatarUrl ? (
                <img 
                  src={avatarUrl} 
                  alt="Avatar" 
                  className="w-24 h-24 rounded-full object-cover border-4 border-yellow-500/30"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-yellow-600/30 flex items-center justify-center border-4 border-yellow-500/30">
                  <Shield className="w-10 h-10 text-yellow-500" />
                </div>
              )}
              <button
                onClick={() => setShowAvatars(!showAvatars)}
                className="absolute bottom-0 right-0 w-8 h-8 bg-yellow-600 rounded-full flex items-center justify-center hover:bg-yellow-700 transition-colors"
              >
                <Camera className="w-4 h-4" />
              </button>
            </div>
            <div>
              <p className="text-gray-400 text-sm">Clique no icone de camera para trocar</p>
              <p className="text-gray-500 text-xs mt-1">Recomendado: 200x200px</p>
            </div>
          </div>

          {showAvatars && (
            <div className="mt-6 p-4 bg-[#0d0d0d] rounded-lg border border-[#333]">
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
                      avatarUrl === avatar ? "border-yellow-500" : "border-transparent"
                    }`}
                  >
                    <img src={avatar} alt={`Avatar ${index + 1}`} className="w-full h-full" />
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Informacoes */}
        <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-6">
          <h4 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <User className="w-5 h-5 text-yellow-500" />
            Informacoes
          </h4>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Nome de Exibicao</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome no painel"
                className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors"
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-sm text-gray-400 mb-2">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Uma breve descricao sobre voce..."
                className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-yellow-500 transition-colors resize-none"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">{bio.length}/200 caracteres</p>
            </div>
          </div>
        </div>

        {/* Botao Salvar */}
        <div className="flex items-center gap-4">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 disabled:bg-yellow-600/50 rounded-lg font-medium transition-colors flex items-center gap-2"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Salvando...
              </>
            ) : saved ? (
              <>
                <Check className="w-4 h-4" />
                Salvo!
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Salvar Perfil
              </>
            )}
          </button>
          {error && (
            <span className="text-red-500 text-sm flex items-center gap-1">
              <X className="w-4 h-4" />
              {error}
            </span>
          )}
        </div>
      </div>

      {/* Coluna Lateral - Preview */}
      <div className="space-y-6">
        <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-6">
          <h4 className="text-lg font-semibold mb-4">Preview do Perfil</h4>
          
          <div className="text-center">
            {avatarUrl ? (
              <img 
                src={avatarUrl} 
                alt="Preview" 
                className="w-20 h-20 rounded-full object-cover mx-auto border-4 border-yellow-500/30"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-yellow-600/30 flex items-center justify-center mx-auto border-4 border-yellow-500/30">
                <Shield className="w-8 h-8 text-yellow-500" />
              </div>
            )}
            <h5 className="mt-3 font-semibold text-lg">
              {name || "Admin"}
            </h5>
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-600/20 text-yellow-500 rounded text-xs mt-2">
              <Shield className="w-3 h-3" />
              {admin.role === "super_admin" ? "Super Admin" : "Administrador"}
            </span>
            {bio && (
              <p className="text-gray-400 text-sm mt-3">{bio}</p>
            )}
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-xl border border-[#333] p-6">
          <h4 className="text-lg font-semibold mb-4">Informacoes da Conta</h4>
          
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-gray-500" />
              <span className="text-gray-400">{admin.email}</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className="text-gray-400">Desde {formatDate(admin.created_at)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
