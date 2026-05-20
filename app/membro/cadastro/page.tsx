"use client"

import { useState } from "react"
import { createClient } from "@/lib/supabase/client"
import Link from "next/link"
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff } from "lucide-react"

export default function MemberSignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const supabase = createClient()

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError("As senhas nao coincidem")
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError("A senha deve ter pelo menos 6 caracteres")
      setLoading(false)
      return
    }

    // Verificar limite de 200 membros
    const { count } = await supabase
      .from("members")
      .select("*", { count: "exact", head: true })

    if (count !== null && count >= 200) {
      setError("Limite de 200 membros atingido. Cadastros encerrados.")
      setLoading(false)
      return
    }

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { name },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    })

    if (signUpError) {
      if (signUpError.message.includes("rate limit")) {
        setError("Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.")
      } else if (signUpError.message.includes("already registered")) {
        setError("Este email ja esta cadastrado. Tente fazer login.")
      } else {
        setError(signUpError.message)
      }
      setLoading(false)
      return
    }

    if (data.user) {
      // Criar registro de membro
      await supabase
        .from("members")
        .insert({
          user_id: data.user.id,
          email,
          name,
          notify_events: true
        })

      // Se o email ja foi confirmado, redirecionar direto
      if (data.session) {
        window.location.href = "/membro/painel"
        return
      }

      setSuccess(true)
    }

    setLoading(false)
  }

  if (success) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4 relative"
        style={{
          backgroundImage: "url('/bg-panels.png')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-black/70" />
        <div className="w-full max-w-md relative z-10">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8 text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Mail className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Verifique seu email</h2>
            <p className="text-gray-400 mb-4">
              Enviamos um link de confirmacao para <span className="text-white font-medium">{email}</span>
            </p>

            <div className="bg-[#252525] rounded-lg p-4 mb-6 text-left">
              <p className="text-sm text-gray-300 mb-2">Para ativar sua conta:</p>
              <ol className="text-sm text-gray-400 space-y-1 list-decimal list-inside">
                <li>Abra seu email (verifique spam/lixeira)</li>
                <li>Clique no link de confirmacao</li>
                <li>Faca login com seu email e senha</li>
              </ol>
            </div>

            <div className="space-y-3">
              <Link
                href="/membro/login"
                className="block w-full py-3 bg-red-600 hover:bg-red-700 rounded-lg font-medium text-white transition-colors text-center"
              >
                Ja confirmei, ir para login
              </Link>
              <Link
                href="/"
                className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Voltar para o site
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative"
      style={{
        backgroundImage: "url('/bg-panels.png')",
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="absolute inset-0 bg-black/70" />
      <div className="w-full max-w-md relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-4xl font-black text-white tracking-wider">FODA</h1>
            <p className="text-red-500 text-sm font-medium">ALIANCA</p>
          </Link>
        </div>

        <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Criar Conta</h2>

          <form onSubmit={handleSignUp} className="space-y-5">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Nome</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Seu nome no jogo"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="seu@email.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-12 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Minimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Confirmar Senha</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full pl-11 pr-4 py-3 bg-[#0d0d0d] border border-[#333] rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors"
                  placeholder="Repita a senha"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 rounded-lg font-medium text-white transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Criando conta...
                </>
              ) : (
                "Criar Conta"
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              Ja tem uma conta?{" "}
              <Link href="/membro/login" className="text-red-500 hover:text-red-400 font-medium">
                Fazer login
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar para o site
          </Link>
        </div>
      </div>
    </div>
  )
}
