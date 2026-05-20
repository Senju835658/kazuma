"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import { Shield, CheckCircle } from "lucide-react"

export default function AdminSetupPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    
    if (password !== confirmPassword) {
      setError("As senhas não coincidem")
      return
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      return
    }

    setLoading(true)

    try {
      // Verificar se já existe admin
      const { data: existingAdmins } = await supabase
        .from("admins")
        .select("id")
        .limit(1)

      if (existingAdmins && existingAdmins.length > 0) {
        setError("Já existe um administrador cadastrado. Use a página de login.")
        setLoading(false)
        return
      }

      // Criar usuário
      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? 
            `${window.location.origin}/auth/callback`
        }
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      if (authData.user) {
        // Adicionar como admin
        const { error: adminError } = await supabase
          .from("admins")
          .insert({
            user_id: authData.user.id,
            email: email
          })

        if (adminError) {
          setError("Erro ao criar administrador: " + adminError.message)
          setLoading(false)
          return
        }

        setSuccess(true)
      }
    } catch {
      setError("Erro ao criar administrador. Tente novamente.")
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{
          backgroundImage: "url('/background.webp')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/80" />
        <div className="relative z-10 w-full max-w-md text-center">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-xl font-bold mb-2">Administrador Criado!</h2>
            <p className="text-gray-400 text-sm mb-6">
              Verifique seu email para confirmar a conta, depois faça login.
            </p>
            <button
              onClick={() => router.push("/admin/login")}
              className="w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium transition-colors"
            >
              Ir para Login
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4"
      style={{
        backgroundImage: "url('/background.webp')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/80" />
      
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
              Configuração Inicial
            </h1>
            <p className="text-gray-400 text-sm mt-2">Criar primeiro administrador</p>
          </div>

          <form onSubmit={handleSetup} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
                Email do Admin
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
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-2">
                Confirmar Senha
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                placeholder="••••••••"
              />
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
                  Criando...
                </>
              ) : (
                "Criar Administrador"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <a href="/admin/login" className="text-gray-400 hover:text-white text-sm transition-colors">
              Já tem conta? Fazer login
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
