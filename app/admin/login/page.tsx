"use client"

import { useState, useEffect } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Shield } from "lucide-react"

export default function AdminLoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(true)
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [checkingSession, setCheckingSession] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  // Verificar se ja esta logado como admin
  useEffect(() => {
    const checkSession = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: adminData } = await supabase
          .from("admins")
          .select("*")
          .eq("user_id", user.id)

        if (adminData && adminData.length > 0) {
          router.push("/admin")
          return
        }
      }
      setCheckingSession(false)
    }
    checkSession()
  }, [])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) {
        setError("Email ou senha incorretos")
        setLoading(false)
        return
      }

      // Verificar se o usuário é admin
      const { data: adminData, error: adminError } = await supabase
        .from("admins")
        .select("*")
        .eq("user_id", data.user?.id)

      if (adminError || !adminData || adminData.length === 0) {
        await supabase.auth.signOut()
        setError("Você não tem permissão de administrador")
        setLoading(false)
        return
      }

      router.push("/admin")
    } catch {
      setError("Erro ao fazer login. Tente novamente.")
      setLoading(false)
    }
  }

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d]">
        <div className="w-8 h-8 border-2 border-red-500/30 border-t-red-500 rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: "url('/bg-panels.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/70" />
      
      <div className="relative z-10 w-full max-w-md">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 shadow-2xl">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mb-4">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <h1 
              className="text-2xl font-bold font-[family-name:var(--font-cinzel)]"
              style={{
                color: '#dc2626',
                textShadow: '0 0 10px rgba(220, 38, 38, 0.6)',
              }}
            >
              Área do Administrador
            </h1>
            <p className="text-gray-400 text-sm mt-2">Aliança FODA</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                placeholder="admin@aliancafoda.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors pr-12"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                id="remember"
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#333] bg-[#0d0d0d] text-red-600 focus:ring-red-500"
              />
              <label htmlFor="remember" className="text-sm text-gray-400 cursor-pointer">
                Manter conectado
              </label>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/" className="text-gray-400 hover:text-white text-sm transition-colors">
              Voltar ao site
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
